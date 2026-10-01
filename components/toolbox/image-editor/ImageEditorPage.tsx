'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/common/constants'
import {
  ImageLoadError,
  decodeImageFile,
  getImageFileFromClipboard,
  validateImageFile,
} from '@/lib/toolbox/common/load'
import {
  canRedo,
  canUndo,
  createHistory,
  historyLimitFor,
  pushHistory,
  redoHistory,
  replacePresent,
  undoHistory,
  type History,
} from '@/lib/toolbox/common/history'
import {
  DEFAULT_EXPORT_QUALITY,
  buildExportFileName,
  defaultExportBaseName,
  downloadBlob,
  encodeCanvas,
  type ExportFormat,
} from '@/lib/toolbox/common/export'
import { createEditorDoc, type EditorDoc } from '@/lib/toolbox/image-editor/types'
import { cropCanvas, flipCanvas, rotateCanvas, rotatedBounds, type FlipDirection } from '@/lib/toolbox/image-editor/transform'
import { resizeCanvas, validateOutputSize, type Size } from '@/lib/toolbox/common/canvas'
import {
  aspectRatioOf,
  fitAspect,
  fullCropRect,
  isFullCrop,
  setCropField,
  type AspectKey,
  type CropRect,
} from '@/lib/toolbox/image-editor/crop'
import {
  TOOL_SHORTCUTS,
  applyStyle,
  defaultDrawStyle,
  duplicateAnnotation,
  removeAnnotation,
  reorderAnnotation,
  styleFromAnnotation,
  updateAnnotation,
  type Annotation,
  type DrawStyle,
  type EditorTool,
} from '@/lib/toolbox/image-editor/annotations'
import { renderComposite } from '@/lib/toolbox/image-editor/annotation-render'
import {
  isWatermarkActive,
  loadWatermarkSettings,
  saveWatermarkSettings,
  DEFAULT_WATERMARK_SETTINGS,
  type WatermarkLogo,
  type WatermarkSettings,
} from '@/lib/toolbox/image-editor/watermark'
import { renderWatermarked } from '@/lib/toolbox/image-editor/watermark-render'
import { nudgeDelta } from '@/lib/toolbox/image-editor/shortcuts'
import { AnnotationPanel } from './AnnotationPanel'
import { CropPanel, type CropState } from './CropPanel'
import { EditorCanvas, type EditorCanvasHandle } from './EditorCanvas'
import { ZoomControls } from '@/components/toolbox/common/ZoomControls'
import { EditorToolbar, ShortcutHint } from './EditorToolbar'
import { EditorSidePanel, type ExportSettings, type LoadedImageInfo } from './EditorSidePanel'
import { ImageUploadZone } from '@/components/toolbox/common/ImageUploadZone'
import { ResizePanel } from './ResizePanel'
import { ShortcutHelpDialog } from './ShortcutHelpDialog'
import {
  DEFAULT_ROTATION_DRAFT,
  TransformPanel,
  rotationFillColor,
  type RotationDraft,
} from './TransformPanel'
import { WatermarkPanel } from './WatermarkPanel'

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

/** 로고 썸네일(패널 표시용) — 큰 로고도 가볍게 */
function createThumbnailUrl(source: HTMLCanvasElement, maxSide = 96): string {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** 다이얼로그·Sheet 안에 포커스가 있으면 편집 단축키를 쓰지 않음 */
const isInDialog = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('[role=dialog]')

/** 방향키를 자체적으로 쓰는 위젯(슬라이더·목록 등)에 포커스가 있으면 방향키 이동을 하지 않음 */
const usesArrowKeys = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  !!target.closest('[role=slider],[role=listbox],[role=menu],[role=radiogroup],[role=tablist],[role=combobox]')

/**
 * TOOLBOX「이미지 편집」 — 모든 처리는 브라우저에서만 수행(서버 전송 없음).
 * 레이아웃: 좌측 작업 영역 + 우측 410px 옵션 패널(xl 이상). xl 미만은 「편집 옵션」 Sheet(모바일 하단 / 태블릿 오른쪽).
 * 구현 기록: docs/TOOLBOX_image-editor_handoff.md
 */
export function ImageEditorPage() {
  const { confirm } = useConfirmDialog()
  const isMobileViewport = useIsMobileViewport()
  // 우측 패널은 xl(1280px) 이상에서만 고정 — 그 미만(태블릿·작은 노트북)은 「편집 옵션」 Sheet (모바일 하단 / 태블릿 오른쪽)
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
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
  const [tool, setTool] = useState<EditorTool>('select')
  const [drawStyle, setDrawStyle] = useState<DrawStyle>(() => defaultDrawStyle(1000, 1000))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 워터마크 — 히스토리 밖 설정값(실행취소 대상 아님). 텍스트 설정은 localStorage에 저장(로고·켜짐 제외)
  const [watermark, setWatermark] = useState<WatermarkSettings>(DEFAULT_WATERMARK_SETTINGS)
  const [watermarkLogo, setWatermarkLogo] = useState<WatermarkLogo | null>(null)
  const watermarkRestored = useRef(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  // 방향키를 누르고 있는 동안의 이동은 실행취소 1단계로 묶는다(첫 이동만 기록 추가, 이후는 현재 상태 교체 — 키를 떼면 종료)
  const nudgingRef = useRef(false)

  const doc = history?.present ?? null
  const isDirty = history ? canUndo(history) : false
  const cropRatio = crop && doc ? aspectRatioOf(crop.aspect, doc) : null
  const selected = (tool === 'select' && doc?.annotations.find((a) => a.id === selectedId)) || null

  // 개체를 선택하면 패널 스타일을 그 개체 값으로 맞춘다(패널 조작 = 선택 개체 편집)
  useEffect(() => {
    if (selected) setDrawStyle((s) => styleFromAnnotation(selected, s))
  }, [selected])

  // 문서가 바뀌면(편집 적용·실행취소·새 이미지) 미적용 자유 회전 각도·자르기 모드는 버린다
  useEffect(() => {
    setRotationDraft((d) => (d.angle === 0 ? d : { ...d, angle: 0 }))
    setCrop(null)
  }, [doc])

  useEffect(() => {
    if (!isCompactViewport) setMobileSheetOpen(false)
  }, [isCompactViewport])

  // 저장된 워터마크 설정 복원(마운트 1회) → 이후 변경 시 저장(슬라이더 드래그 중 과도한 쓰기 방지로 지연)
  useEffect(() => {
    setWatermark(loadWatermarkSettings())
    watermarkRestored.current = true
  }, [])
  useEffect(() => {
    if (!watermarkRestored.current) return
    const timer = window.setTimeout(() => saveWatermarkSettings(watermark), 300)
    return () => window.clearTimeout(timer)
  }, [watermark])

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
        setTool('select')
        setSelectedId(null)
        setDrawStyle(defaultDrawStyle(original.width, original.height))
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

  /**
   * 베이스 캔버스 기하 변환(회전·반전·크기·자르기)을 적용하고 히스토리에 기록.
   * 주석이 있으면 먼저 이미지에 합친(flatten) 뒤 변환한다 — docs/TOOLBOX_image-editor_handoff.md 공통 설계 확정 규칙.
   */
  const applyTransform = (transform: (source: HTMLCanvasElement) => HTMLCanvasElement) => {
    if (!doc) return
    try {
      const hadAnnotations = doc.annotations.length > 0
      commit(createEditorDoc(transform(renderComposite(doc))))
      setSelectedId(null)
      if (hadAnnotations) toast.info('그리기·텍스트가 이미지에 합쳐졌습니다. 실행취소로 되돌릴 수 있습니다.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '편집을 적용하지 못했습니다.')
    }
  }

  // ---------- 주석(그리기·도형·텍스트) ----------
  const commitAnnotations = (annotations: Annotation[]) => {
    if (doc) commit({ ...doc, annotations })
  }
  const addAnnotation = (annotation: Annotation) => {
    if (doc) commitAnnotations([...doc.annotations, annotation])
  }
  const replaceAnnotation = (annotation: Annotation) => {
    if (doc) commitAnnotations(updateAnnotation(doc.annotations, annotation.id, () => annotation))
  }
  const deleteAnnotation = (id: string) => {
    if (!doc) return
    commitAnnotations(removeAnnotation(doc.annotations, id))
    setSelectedId((current) => (current === id ? null : current))
  }
  const duplicateSelected = () => {
    if (!doc || !selected) return
    const copy = duplicateAnnotation(selected, Math.max(10, Math.round(Math.min(doc.width, doc.height) * 0.02)))
    commitAnnotations([...doc.annotations, copy])
    setSelectedId(copy.id)
  }
  const reorderSelected = (direction: 1 | -1) => {
    if (!doc || !selected) return
    const next = reorderAnnotation(doc.annotations, selected.id, direction)
    if (next !== doc.annotations) commitAnnotations(next)
  }

  /** 선택 개체 방향키 이동 — 최신 히스토리 기준으로 계산(키 반복이 렌더보다 빨라도 누락 없음) */
  const nudgeSelected = (id: string, dx: number, dy: number) => {
    const continuing = nudgingRef.current
    nudgingRef.current = true
    setHistory((h) => {
      if (!h) return h
      const current = h.present
      const next = {
        ...current,
        annotations: updateAnnotation(current.annotations, id, (a) => ({ ...a, x: a.x + dx, y: a.y + dy })),
      }
      return continuing ? replacePresent(h, next) : pushHistory(h, next, historyLimitFor(next.width, next.height))
    })
  }

  useEffect(() => {
    const endNudge = (e?: KeyboardEvent) => {
      if (!e || e.key.startsWith('Arrow')) nudgingRef.current = false
    }
    const handleBlur = () => endNudge()
    window.addEventListener('keyup', endNudge)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keyup', endNudge)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  const changeTool = (next: EditorTool) => {
    setTool(next)
    if (next !== 'select') setSelectedId(null)
  }

  /** apply=true면 선택한 개체에도 반영(히스토리 기록), false면 패널 값만 갱신(슬라이더 드래그 중) */
  const changeStyle = (patch: Partial<DrawStyle>, apply: boolean) => {
    setDrawStyle((s) => ({ ...s, ...patch }))
    if (apply && selected) {
      const next = applyStyle(selected, patch)
      if (JSON.stringify(next) !== JSON.stringify(selected)) replaceAnnotation(next)
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
    setSelectedId(null)
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

  // 편집 단축키: 도구(V/P/H/L/A/R/O/T), 자르기(C), 삭제(Delete/Backspace), 복제(⌘/Ctrl+D), 선택 해제(Esc),
  // 방향키 이동(Shift 10px), 도움말(?) — 목록: lib/toolbox/image-editor/shortcuts.ts
  const editKeysRef = useRef({ hasDoc: false, crop: false, selected: null as Annotation | null, changeTool, toggleCrop, deleteAnnotation, duplicateSelected, nudgeSelected })
  useEffect(() => {
    editKeysRef.current = { hasDoc: !!doc, crop: !!crop, selected, changeTool, toggleCrop, deleteAnnotation, duplicateSelected, nudgeSelected }
  })
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = editKeysRef.current
      if (!k.hasDoc || isTypingTarget(e.target) || isInDialog(e.target) || e.isComposing) return
      const key = e.key.toLowerCase()
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setShortcutsOpen(true)
        return
      }
      const delta = nudgeDelta(e.key, e.shiftKey)
      if (delta && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (k.selected && !k.crop && !usesArrowKeys(e.target)) {
          e.preventDefault()
          k.nudgeSelected(k.selected.id, delta.dx, delta.dy)
        }
        return
      }
      if ((e.metaKey || e.ctrlKey) && key === 'd') {
        if (k.selected) {
          e.preventDefault()
          k.duplicateSelected()
        }
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && k.selected) {
        e.preventDefault()
        k.deleteAnnotation(k.selected.id)
      } else if (e.key === 'Escape' && !k.crop && k.selected) {
        e.preventDefault()
        k.changeTool('select')
        setSelectedId(null)
      } else if (key === 'c') {
        k.toggleCrop()
      } else if (!k.crop && TOOL_SHORTCUTS[key]) {
        k.changeTool(TOOL_SHORTCUTS[key])
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

  // ---------- 워터마크 ----------
  const changeWatermark = (patch: Partial<WatermarkSettings>) => setWatermark((w) => ({ ...w, ...patch }))

  const openWatermarkLogo = async (file: File) => {
    const error = validateImageFile(file)
    if (error) {
      toast.error(error)
      return
    }
    try {
      const canvas = await decodeImageFile(file)
      setWatermarkLogo({
        canvas,
        width: canvas.width,
        height: canvas.height,
        name: file.name || 'logo.png',
        previewUrl: createThumbnailUrl(canvas),
      })
      changeWatermark({ kind: 'image' })
    } catch (e) {
      toast.error(e instanceof ImageLoadError ? e.message : '로고 이미지를 불러오지 못했습니다.')
    }
  }

  const handleExport = async () => {
    if (!doc) return
    setExporting(true)
    try {
      // 베이스 + 주석 → 워터마크(현재 크기 기준) 순서로 원본 해상도 합성
      const composed = renderWatermarked(renderComposite(doc), watermark, watermarkLogo)
      const blob = await encodeCanvas(composed, exportSettings.format, exportSettings.quality)
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
  const flattenNotice = doc && doc.annotations.length > 0 && (
    <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      자르기·회전·반전·크기 변경을 적용하면 그리기·텍스트가 이미지에 합쳐져 더 이상 개별 수정할 수 없습니다(실행취소 가능).
    </p>
  )

  const toolSections = doc && (crop ? (
    <>
      {flattenNotice}
      {cropPanel}
    </>
  ) : (
    <>
      <AnnotationPanel
        tool={tool}
        style={drawStyle}
        selected={selected}
        onStyleChange={changeStyle}
        onDuplicate={duplicateSelected}
        onReorder={reorderSelected}
        onDelete={() => selected && deleteAnnotation(selected.id)}
      />
      {flattenNotice}
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
      <WatermarkPanel
        settings={watermark}
        logo={watermarkLogo}
        onChange={changeWatermark}
        onLogoFile={(file) => void openWatermarkLogo(file)}
        onLogoRemove={() => setWatermarkLogo(null)}
      />
    </>
  ))

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50 dark:bg-neutral-900" {...dropHandlers}>
      {/* 좌측: 편집 영역 (xl 미만은 우측 패널 없음 → pr-0) */}
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        <div className="flex h-full flex-col px-8 pt-16 pb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="page-header-title">이미지 편집</h1>
              <p className="text-muted-foreground mt-2">
                이미지를 회전·자르기·크기 변경하고, 텍스트·도형·워터마크를 넣어 다운로드하세요. 이미지는 서버로 전송되지 않습니다.
              </p>
            </div>
            {doc && (
              <Button type="button" variant="outline" className="shrink-0 xl:hidden" onClick={() => setMobileSheetOpen(true)}>
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
                onUndo={undo}
                onRedo={redo}
                onOpenNew={browse}
                onRevert={revert}
                onRotate90={rotate90}
                onFlip={flip}
                cropActive={!!crop}
                onToggleCrop={toggleCrop}
                onApplyCrop={applyCrop}
                tool={tool}
                onToolChange={changeTool}
                onShowShortcuts={() => setShortcutsOpen(true)}
              />
              <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-lg border bg-neutral-100 dark:bg-neutral-800">
                <EditorCanvas
                  ref={canvasRef}
                  doc={doc}
                  fitKey={loaded.sessionId}
                  onZoomChange={setZoom}
                  rotationPreview={{ angle: rotationDraft.angle, fill: rotationFillColor(rotationDraft) }}
                  crop={crop ? { rect: crop.rect, ratio: cropRatio, onChange: changeCropRect } : null}
                  tool={tool}
                  drawStyle={drawStyle}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelectedId}
                  onAddAnnotation={addAnnotation}
                  onUpdateAnnotation={replaceAnnotation}
                  onRemoveAnnotation={deleteAnnotation}
                  watermark={isWatermarkActive(watermark, watermarkLogo) ? { settings: watermark, logo: watermarkLogo } : undefined}
                />
                <ShortcutHint onClick={() => setShortcutsOpen(true)} />
                <ZoomControls
                  zoomPercent={Math.round(zoom * 100)}
                  onZoomIn={() => canvasRef.current?.zoomIn()}
                  onZoomOut={() => canvasRef.current?.zoomOut()}
                  onFit={() => canvasRef.current?.fit()}
                  onActualSize={() => canvasRef.current?.actualSize()}
                />
                {dragActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
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
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 xl:right-[410px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 우측: 옵션 패널 (xl 이상) */}
      <div className="hidden xl:block fixed right-0 top-0 bottom-0">
        <EditorSidePanel {...panelProps}>{toolSections}</EditorSidePanel>
      </div>

      <Sheet open={Boolean(isCompactViewport && mobileSheetOpen)} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side={isMobileViewport ? 'bottom' : 'right'}
          className={isMobileViewport ? 'h-[70vh] overflow-y-auto p-0' : 'w-[410px] max-w-[90vw] overflow-y-auto p-0 sm:max-w-[410px]'}
        >
          <SheetTitle className="sr-only">편집 옵션</SheetTitle>
          <EditorSidePanel variant="sheet" {...panelProps}>
            {toolSections}
          </EditorSidePanel>
        </SheetContent>
      </Sheet>

      <ShortcutHelpDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <input ref={fileInputRef} type="file" accept={FILE_INPUT_ACCEPT} className="hidden" onChange={handleFileInputChange} />
    </div>
  )
}
