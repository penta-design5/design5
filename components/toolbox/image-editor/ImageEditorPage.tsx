'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/image-editor/constants'
import {
  ImageLoadError,
  decodeImageFile,
  getImageFileFromClipboard,
  validateImageFile,
} from '@/lib/toolbox/image-editor/load'
import {
  canRedo,
  canUndo,
  createHistory,
  historyLimitFor,
  pushHistory,
  redoHistory,
  undoHistory,
  type History,
} from '@/lib/toolbox/image-editor/history'
import {
  DEFAULT_EXPORT_QUALITY,
  buildExportFileName,
  defaultExportBaseName,
  downloadBlob,
  encodeCanvas,
  type ExportFormat,
} from '@/lib/toolbox/image-editor/export'
import { createEditorDoc, type EditorDoc } from '@/lib/toolbox/image-editor/types'
import {
  cropCanvas,
  flipCanvas,
  resizeCanvas,
  rotateCanvas,
  rotatedBounds,
  validateOutputSize,
  type FlipDirection,
  type Size,
} from '@/lib/toolbox/image-editor/transform'
import {
  aspectRatioOf,
  fitAspect,
  fullCropRect,
  isFullCrop,
  setCropField,
  type AspectKey,
  type CropRect,
} from '@/lib/toolbox/image-editor/crop'
import { CropPanel, type CropState } from './CropPanel'
import { EditorCanvas, type EditorCanvasHandle } from './EditorCanvas'
import { EditorToolbar } from './EditorToolbar'
import { EditorSidePanel, type ExportSettings, type LoadedImageInfo } from './EditorSidePanel'
import { ImageUploadZone } from './ImageUploadZone'
import { ResizePanel } from './ResizePanel'
import {
  DEFAULT_ROTATION_DRAFT,
  TransformPanel,
  rotationFillColor,
  type RotationDraft,
} from './TransformPanel'

interface LoadedImage extends LoadedImageInfo {
  /** 새 이미지를 열 때마다 증가 — 캔버스 화면 맞춤 트리거 */
  sessionId: number
  original: EditorDoc
}

/** 원본 형식을 기본 내보내기 형식으로 (GIF·BMP는 PNG) */
function defaultFormatFor(mime: string): ExportFormat {
  if (mime === 'image/jpeg') return 'jpeg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/**
 * TOOLBOX「이미지 편집」 — 모든 처리는 브라우저에서만 수행(서버 전송 없음).
 * 레이아웃은 Chart Generator와 동일: 좌측 작업 영역 + 우측 410px 옵션 패널(모바일은 하단 Sheet).
 * 진행 상태: docs/TOOLBOX_handoff.md
 */
export function ImageEditorPage() {
  const { confirm } = useConfirmDialog()
  const isMobileViewport = useIsMobileViewport()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<EditorCanvasHandle>(null)
  const dragDepth = useRef(0)

  const [loaded, setLoaded] = useState<LoadedImage | null>(null)
  const [history, setHistory] = useState<History<EditorDoc> | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'png',
    quality: DEFAULT_EXPORT_QUALITY,
    baseName: '',
  })

  const [rotationDraft, setRotationDraft] = useState<RotationDraft>(DEFAULT_ROTATION_DRAFT)
  const [crop, setCrop] = useState<CropState | null>(null)

  const doc = history?.present ?? null
  const isDirty = history ? canUndo(history) : false
  const cropRatio = crop && doc ? aspectRatioOf(crop.aspect, doc) : null

  // 문서가 바뀌면(편집 적용·실행취소·새 이미지) 미적용 자유 회전 각도·자르기 모드는 버린다
  useEffect(() => {
    setRotationDraft((d) => (d.angle === 0 ? d : { ...d, angle: 0 }))
    setCrop(null)
  }, [doc])

  useEffect(() => {
    if (!isMobileViewport) setMobileSheetOpen(false)
  }, [isMobileViewport])

  const commit = useCallback((next: EditorDoc) => {
    setHistory((h) => (h ? pushHistory(h, next, historyLimitFor(next.width, next.height)) : createHistory(next)))
  }, [])

  const undo = useCallback(() => setHistory((h) => (h ? undoHistory(h) : h)), [])
  const redo = useCallback(() => setHistory((h) => (h ? redoHistory(h) : h)), [])

  const openFile = useCallback(
    async (file: File) => {
      const error = validateImageFile(file)
      if (error) {
        toast.error(error)
        return
      }
      if (isDirty && !(await confirm('현재 편집 내용이 사라집니다. 새 이미지를 여시겠습니까?', { confirmText: '새 이미지 열기' }))) {
        return
      }

      setLoading(true)
      try {
        const original = createEditorDoc(await decodeImageFile(file))
        setLoaded((prev) => ({
          sessionId: (prev?.sessionId ?? 0) + 1,
          fileName: file.name || 'image.png',
          fileSize: file.size,
          originalWidth: original.width,
          originalHeight: original.height,
          original,
        }))
        setHistory(createHistory(original))
        setExportSettings((prev) => ({
          ...prev,
          format: defaultFormatFor(file.type),
          baseName: defaultExportBaseName(file.name || 'image'),
        }))
      } catch (e) {
        toast.error(e instanceof ImageLoadError ? e.message : '이미지를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [confirm, isDirty]
  )

  // window 리스너에서 최신 openFile을 쓰기 위한 ref
  const openFileRef = useRef(openFile)
  useEffect(() => {
    openFileRef.current = openFile
  }, [openFile])

  // 클립보드 붙여넣기 (이미지가 있을 때만 가로챔 — 입력창 텍스트 붙여넣기는 그대로)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = getImageFileFromClipboard(e.clipboardData)
      if (!file) return
      e.preventDefault()
      void openFileRef.current(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  // 단축키: 실행취소 Ctrl/⌘+Z, 다시실행 Ctrl/⌘+Shift+Z 또는 Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || isTypingTarget(e.target)) return
      const key = e.key.toLowerCase()
      if (key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // 편집 내용이 있을 때 페이지 이탈 경고
  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // 드래그 앤 드롭 — preventDefault로 브라우저가 파일을 새 탭에서 여는 기본 동작 차단
  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current += 1
      setDragActive(true)
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) setDragActive(false)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current = 0
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file && !loading) void openFile(file)
    },
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 선택해도 change가 발생하도록
    if (file) void openFile(file)
  }

  const browse = () => fileInputRef.current?.click()

  const revert = () => {
    if (loaded && doc !== loaded.original) commit(loaded.original)
  }

  /** 베이스 캔버스 변환을 적용하고 히스토리에 기록 (P4부터: 적용 전 주석 flatten) */
  const applyTransform = (transform: (source: HTMLCanvasElement) => HTMLCanvasElement) => {
    if (!doc) return
    try {
      commit(createEditorDoc(transform(doc.canvas)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '편집을 적용하지 못했습니다.')
    }
  }

  const rotate90 = (direction: 1 | -1) => applyTransform((c) => rotateCanvas(c, 90 * direction))
  const flip = (direction: FlipDirection) => applyTransform((c) => flipCanvas(c, direction))

  const applyRotation = () => {
    if (!doc || rotationDraft.angle === 0) return
    const error = validateOutputSize(rotatedBounds(doc.width, doc.height, rotationDraft.angle))
    if (error) {
      toast.error(error)
      return
    }
    applyTransform((c) => rotateCanvas(c, rotationDraft.angle, rotationFillColor(rotationDraft)))
  }

  // ---------- 자르기 ----------
  const startCrop = () => {
    if (!doc) return
    setRotationDraft((d) => ({ ...d, angle: 0 }))
    setCrop({ rect: fullCropRect(doc), aspect: 'free' })
    setMobileSheetOpen(false) // 모바일: 캔버스에서 상자를 조작할 수 있게 옵션 시트를 닫음
  }
  const cancelCrop = () => setCrop(null)
  const toggleCrop = () => (crop ? cancelCrop() : startCrop())

  const changeCropAspect = (aspect: AspectKey) => {
    if (!doc) return
    setCrop((c) => (c ? { aspect, rect: fitAspect(c.rect, aspectRatioOf(aspect, doc), doc) } : c))
  }
  const changeCropField = (field: keyof CropRect, value: number) => {
    if (!doc) return
    setCrop((c) => (c ? { ...c, rect: setCropField(c.rect, field, value, aspectRatioOf(c.aspect, doc), doc) } : c))
  }
  const changeCropRect = useCallback((rect: CropRect) => setCrop((c) => (c ? { ...c, rect } : c)), [])

  const applyCrop = () => {
    if (!doc || !crop) return
    if (isFullCrop(crop.rect, doc)) {
      setCrop(null)
      return
    }
    applyTransform((c) => cropCanvas(c, crop.rect))
  }

  // 자르기 모드 단축키 (Enter 적용 / Esc 취소) — window 리스너에서 최신 핸들러 사용
  const cropKeysRef = useRef({ active: false, apply: applyCrop, cancel: cancelCrop })
  useEffect(() => {
    cropKeysRef.current = { active: !!crop, apply: applyCrop, cancel: cancelCrop }
  })
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!cropKeysRef.current.active || isTypingTarget(e.target) || e.isComposing) return
      if (e.key === 'Enter') {
        e.preventDefault()
        cropKeysRef.current.apply()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cropKeysRef.current.cancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const applyResize = (size: Size) => {
    const error = validateOutputSize(size)
    if (error) {
      toast.error(error)
      return
    }
    applyTransform((c) => resizeCanvas(c, size.width, size.height))
  }

  const handleExport = async () => {
    if (!doc) return
    setExporting(true)
    try {
      // P4·P5에서 주석·워터마크 합성 후 인코딩으로 확장
      const blob = await encodeCanvas(doc.canvas, exportSettings.format, exportSettings.quality)
      downloadBlob(blob, buildExportFileName(exportSettings.baseName, exportSettings.format))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '이미지를 저장하지 못했습니다.')
    } finally {
      setExporting(false)
    }
  }

  const panelProps = {
    image: loaded,
    doc,
    exportSettings,
    exporting,
    onExportSettingsChange: setExportSettings,
    onExport: handleExport,
  }

  const cropPanel = (
    <CropPanel
      crop={crop}
      onStart={startCrop}
      onAspectChange={changeCropAspect}
      onFieldChange={changeCropField}
      onApply={applyCrop}
      onCancel={cancelCrop}
    />
  )

  // 자르기 모드에서는 다른 편집 도구를 숨겨 충돌을 막는다
  const toolSections = doc && (crop ? cropPanel : (
    <>
      {cropPanel}
      <TransformPanel
        size={doc}
        draft={rotationDraft}
        onDraftChange={setRotationDraft}
        onRotate90={rotate90}
        onFlip={flip}
        onApplyRotation={applyRotation}
      />
      <ResizePanel size={doc} onApply={applyResize} />
    </>
  ))

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50 dark:bg-neutral-900" {...dropHandlers}>
      {/* 좌측: 편집 영역 (모바일에서는 우측 패널 없음 → pr-0) */}
      <div className="flex-1 min-w-0 pr-0 md:pr-[410px]">
        <div className="flex h-full flex-col px-8 pt-16 pb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="page-header-title">이미지 편집</h1>
              <p className="text-muted-foreground mt-2">
                이미지를 회전·자르기·크기 변경하고, 텍스트·도형·워터마크를 넣어 다운로드하세요. 이미지는 서버로 전송되지 않습니다.
              </p>
            </div>
            {doc && (
              <Button type="button" variant="outline" className="shrink-0 md:hidden" onClick={() => setMobileSheetOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                편집 옵션
              </Button>
            )}
          </div>

          {history && doc && loaded ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <EditorToolbar
                canUndo={canUndo(history)}
                canRedo={canRedo(history)}
                canRevert={doc !== loaded.original}
                zoomPercent={Math.round(zoom * 100)}
                onUndo={undo}
                onRedo={redo}
                onZoomIn={() => canvasRef.current?.zoomIn()}
                onZoomOut={() => canvasRef.current?.zoomOut()}
                onFit={() => canvasRef.current?.fit()}
                onActualSize={() => canvasRef.current?.actualSize()}
                onOpenNew={browse}
                onRevert={revert}
                onRotate90={rotate90}
                onFlip={flip}
                cropActive={!!crop}
                onToggleCrop={toggleCrop}
                onApplyCrop={applyCrop}
              />
              <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-lg border bg-neutral-100 dark:bg-neutral-800">
                <EditorCanvas
                  ref={canvasRef}
                  doc={doc}
                  fitKey={loaded.sessionId}
                  onZoomChange={setZoom}
                  rotationPreview={{ angle: rotationDraft.angle, fill: rotationFillColor(rotationDraft) }}
                  crop={crop ? { rect: crop.rect, ratio: cropRatio, onChange: changeCropRect } : null}
                />
                {dragActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[var(--penta-indigo)]/10 text-sm font-medium">
                    여기에 놓으면 새 이미지로 교체됩니다
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ImageUploadZone dragActive={dragActive} disabled={loading} onBrowse={browse} className="min-h-[320px] flex-1" />
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 md:right-[410px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 우측: 옵션 패널 (데스크톱) */}
      <div className="hidden md:block fixed right-0 top-0 bottom-0">
        <EditorSidePanel {...panelProps}>{toolSections}</EditorSidePanel>
      </div>

      <Sheet open={Boolean(isMobileViewport && mobileSheetOpen)} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto p-0">
          <SheetTitle className="sr-only">편집 옵션</SheetTitle>
          <EditorSidePanel variant="sheet" {...panelProps}>
            {toolSections}
          </EditorSidePanel>
        </SheetContent>
      </Sheet>

      <input ref={fileInputRef} type="file" accept={FILE_INPUT_ACCEPT} className="hidden" onChange={handleFileInputChange} />
    </div>
  )
}
