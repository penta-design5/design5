'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { FolderOpen, Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/common/constants'
import {
  DEFAULT_EXPORT_QUALITY,
  baseNameOf,
  downloadBlob,
  encodeCanvas,
  getExportFormat,
  sanitizeFileName,
  type ExportFormat,
} from '@/lib/toolbox/common/export'
import { DEFAULT_BACKGROUND, composeBackground, type BackgroundSettings } from '@/lib/toolbox/background-editor/compose'
import { buildCutout } from '@/lib/toolbox/background-editor/cutout'
import { MODEL } from '@/lib/toolbox/background-editor/model'
import { DEFAULT_EDGE, type EdgeSettings } from '@/lib/toolbox/background-editor/refine'
import {
  BRUSH_SIZE_STEP,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_SOFTNESS,
  brushRadiusInImage,
  clampBrushSize,
  normalizeRect,
  type RectMode,
} from '@/lib/toolbox/background-editor/edits'
import { DEFAULT_PICK, type PickOptions } from '@/lib/toolbox/background-editor/picker'
import { DEFAULT_RECOGNITION, sameRecognition, type RecognitionSettings } from '@/lib/toolbox/background-editor/recognition'
import { ImageLoadError, decodeImageFile, getImageFileFromClipboard, validateImageFile } from '@/lib/toolbox/common/load'
import { cn } from '@/lib/utils'
import { ImageUploadZone } from '@/components/toolbox/common/ImageUploadZone'
import { BgEditToolbar, EDIT_TOOLS } from './BgEditToolbar'
import { BgPreview, type EditTool, type PreviewEditing, type PreviewMode } from './BgPreview'
import { BgProgressCard } from './BgProgressCard'
import { BgSidePanel, type BgImageInfo } from './BgSidePanel'
import { RemoveBackgroundButton, type RemoveButtonState } from './RemoveBackgroundButton'
import { useBackgroundRemoval } from './use-background-removal'
import { useManualEdits } from './use-manual-edits'

const VIEW_MODES: { value: PreviewMode; label: string }[] = [
  { value: 'original', label: '원본' },
  { value: 'compare', label: '비교' },
  { value: 'result', label: '결과' },
]

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** 다이얼로그·Sheet 안에 포커스가 있으면 편집 단축키를 쓰지 않음 */
const isInDialog = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('[role=dialog]')

interface LoadedImage extends BgImageInfo {
  /** 불러온 원본(EXIF 보정 후) */
  original: HTMLCanvasElement
}

/**
 * TOOLBOX「배경 편집」 — 배경 제거는 브라우저 안의 AI 모델(ISNet, onnxruntime-web)로 처리한다(서버 전송 없음).
 * 레이아웃: 좌측 작업 영역 + 우측 410px 옵션 패널(xl 이상), xl 미만은 「편집 옵션」 Sheet — 이미지 분할과 동일.
 * 흐름: 이미지 불러오기(원본 표시) → 「배경 제거」 버튼 → 결과. 결과는 「원본 | 비교 | 결과」로 볼 수 있다.
 * 모델은 처음 「배경 제거」를 누를 때 외부 CDN에서 내려받는다(진행 카드), 이후에는 브라우저에 저장된 모델을 쓴다.
 * 사이드바 메뉴: lib/toolbox/menu.ts의 TOOLBOX_MENU(P5에서 등록).
 * 구현 기록: docs/TOOLBOX_background-editor_handoff.md
 */
export function BackgroundEditorPage() {
  const isMobileViewport = useIsMobileViewport()
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const [image, setImage] = useState<LoadedImage | null>(null)
  /**
   * 처음 배경 제거로 모델이 만든 전경 알파 마스크(MODEL.inputSize²) — 경계 다듬기를 바꿔도 AI를 다시 돌리지 않고 여기서 결과를 다시 만든다.
   * 인식 보정으로 다시 제거한 결과는 수동 보정 작업 기록(AiOp)에 들어가고, 있으면 그쪽을 쓴다(실행 취소 가능).
   */
  const [mask, setMask] = useState<Uint8ClampedArray | null>(null)
  // 경계 다듬기는 슬라이더를 놓을 때 반영된다(큰 이미지 처리 비용) — 새 이미지를 열어도 유지
  const [edge, setEdge] = useState<EdgeSettings>(DEFAULT_EDGE)
  // 인식 보정(P4-3) — AI 입력에만 적용. 설정은 새 이미지를 열어도 유지하고, 지금 마스크를 만들 때 쓴 설정을 따로 기억한다
  const [recognition, setRecognition] = useState<RecognitionSettings>(DEFAULT_RECOGNITION)
  /** 처음 배경 제거에 쓴 인식 보정 설정 */
  const [appliedRecognition, setAppliedRecognition] = useState<RecognitionSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [baseName, setBaseName] = useState('')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<PreviewMode>('result')
  // 배경·저장 형식은 새 이미지를 열어도 유지한다(같은 설정으로 여러 장을 처리하기 쉽게)
  const [background, setBackground] = useState<BackgroundSettings>(DEFAULT_BACKGROUND)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState(DEFAULT_EXPORT_QUALITY)
  // 색상 선택기를 끄는 동안 큰 이미지 합성이 입력을 막지 않도록 한 박자 늦춰 합성한다
  const deferredBackground = useDeferredValue(background)
  // 수동 보정(P4) — AI 결과(경계 다듬기 후) 위에 사용자 수정 레이어를 적용한다. 도구·브러시 설정은 새 이미지를 열어도 유지
  const edits = useManualEdits(image?.original ?? null)
  // 지금 AI 결과 = 다시 제거한 결과(작업 기록) 또는 처음 결과
  const currentMask = edits.aiResult?.mask ?? mask
  const currentRecognition = edits.aiResult?.recognition ?? appliedRecognition
  const result = useMemo(
    () => (image && currentMask ? buildCutout(image.original, currentMask, MODEL.inputSize, edge) : null),
    [image, currentMask, edge]
  )
  // 실행 취소·다시 실행으로 AI 결과가 바뀌면 슬라이더도 그 결과를 만든 값으로 맞춘다
  useEffect(() => {
    if (currentRecognition) setRecognition(currentRecognition)
  }, [currentRecognition])
  const [tool, setTool] = useState<EditTool>('pan')
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE)
  const [softness, setSoftness] = useState(DEFAULT_SOFTNESS)
  const [rectMode, setRectMode] = useState<RectMode>('keep')
  const [pick, setPick] = useState<PickOptions>(DEFAULT_PICK)
  const edited = useMemo(() => edits.apply(result), [edits, result])
  const composed = useMemo(() => (edited ? composeBackground(edited, deferredBackground) : null), [edited, deferredBackground])
  const { model, removal, remove, reset, cancelDownload } = useBackgroundRemoval()
  const imageRef = useRef(image)
  imageRef.current = image

  /** 보정 도구는 「결과」 보기에서만 쓴다 — 도구를 고르면 「결과」로, 다른 보기로 바꾸면 화면 이동으로 */
  const chooseTool = useCallback((next: EditTool) => {
    setTool(next)
    if (next !== 'pan') setMode('result')
  }, [])
  const chooseMode = useCallback((next: PreviewMode) => {
    setMode(next)
    if (next !== 'result') setTool('pan')
  }, [])

  const editing = useMemo<PreviewEditing | null>(() => {
    if (!result || !image) return null
    return {
      tool,
      brushSize,
      rectMode,
      onStrokeStart: (point, zoom) =>
        edits.strokeStart(tool === 'restore' ? 'restore' : 'erase', point, brushRadiusInImage(brushSize, zoom), softness),
      onStrokeMove: edits.strokeMove,
      onStrokeEnd: edits.strokeEnd,
      onStrokeCancel: edits.strokeCancel,
      onRect: (start, end) => {
        const rect = normalizeRect(start, end, image.width, image.height)
        if (rect) edits.addRect({ mode: rectMode, ...rect })
      },
      onPick: (point) => edits.addPick(point, pick),
    }
  }, [result, image, tool, brushSize, rectMode, softness, pick, edits])

  // 단축키(배경을 제거한 뒤): 실행 취소 Ctrl/⌘+Z · 다시 실행 Ctrl/⌘+Shift+Z 또는 Ctrl+Y · 도구 H/E/R/M · 브러시 크기 [ ]
  const hasResult = Boolean(result)
  useEffect(() => {
    if (!hasResult) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || isTypingTarget(e.target) || isInDialog(e.target)) return
      const key = e.key.toLowerCase()
      if (e.metaKey || e.ctrlKey) {
        if (key === 'z') {
          e.preventDefault()
          if (e.shiftKey) edits.redo()
          else edits.undo()
        } else if (key === 'y') {
          e.preventDefault()
          edits.redo()
        }
        return
      }
      if (e.altKey) return
      if (e.key === '[' || e.key === ']') {
        e.preventDefault()
        setBrushSize((s) => clampBrushSize(e.key === ']' ? s * BRUSH_SIZE_STEP : s / BRUSH_SIZE_STEP))
        return
      }
      const t = EDIT_TOOLS.find((item) => item.shortcut.toLowerCase() === key)
      if (t && !e.shiftKey) {
        e.preventDefault()
        chooseTool(t.value)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasResult, edits, chooseTool])

  // 수동 보정 내용이 있을 때 페이지 이탈 경고(이미지 편집과 같음)
  useEffect(() => {
    if (!edits.hasEdits) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [edits.hasEdits])

  useEffect(() => {
    if (!isCompactViewport) setSheetOpen(false)
  }, [isCompactViewport])

  // 취소·오류는 진행 카드 대신 토스트로 알린다 — 「배경 제거」 버튼이 다시 활성화되어 바로 다시 시도할 수 있다
  useEffect(() => {
    if (model.kind === 'canceled') toast.info('AI 모델 내려받기를 취소했습니다.')
    if (model.kind === 'error') toast.error(model.message)
  }, [model])
  useEffect(() => {
    if (removal.kind === 'error') toast.error(removal.message)
  }, [removal])

  /**
   * 배경 제거(처음·인식 보정 후 다시) — 다시 할 때는 보기 방식·수동 보정을 그대로 두고, 결과를 작업 기록에 넣는다(실행 취소 가능).
   * 연달아 부르면 마지막 호출의 결과만 반영된다(remove가 이전 작업 결과를 버림).
   */
  const startRemoval = useCallback(async (settings: RecognitionSettings = recognition) => {
    if (!image) return
    const source = image.original
    const first = !mask
    const alpha = await remove(source, settings)
    // 그 사이 다른 이미지를 열었으면 무시(remove도 null을 돌려주지만 한 번 더 확인)
    if (!alpha || imageRef.current?.original !== source) return
    if (first) {
      setMask(alpha)
      setAppliedRecognition(settings)
      setMode('result')
    } else {
      edits.addAiResult(alpha, settings)
    }
  }, [image, mask, recognition, remove, edits])

  const openFile = useCallback(
    async (file: File) => {
      const error = validateImageFile(file)
      if (error) {
        toast.error(error)
        return
      }
      setLoading(true)
      try {
        const canvas = await decodeImageFile(file)
        const fileName = file.name || 'image.png'
        // 원본만 보여 주고, 배경 제거는 「배경 제거」 버튼으로 시작한다
        reset()
        setImage({ original: canvas, width: canvas.width, height: canvas.height, fileName, fileSize: file.size })
        setMask(null)
        setAppliedRecognition(null)
        setMode('result')
        setTool('pan')
        setBaseName(`${baseNameOf(fileName)}_bg`)
      } catch (e) {
        toast.error(e instanceof ImageLoadError ? e.message : '이미지를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [reset]
  )

  // 클립보드 붙여넣기 (이미지가 있을 때만 가로챔 — 입력창 텍스트 붙여넣기는 그대로)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = getImageFileFromClipboard(e.clipboardData)
      if (!file) return
      e.preventDefault()
      void openFile(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [openFile])

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

  const browse = () => fileInputRef.current?.click()

  /** 배경 이미지 — 원본과 같은 검증(형식·용량·픽셀)·EXIF 보정 */
  const pickBackgroundImage = useCallback(async (file: File) => {
    const error = validateImageFile(file)
    if (error) {
      toast.error(error)
      return
    }
    try {
      const canvas = await decodeImageFile(file)
      setBackground((prev) => ({ ...prev, kind: 'image', image: canvas, imageName: file.name || 'image' }))
    } catch (e) {
      toast.error(e instanceof ImageLoadError ? e.message : '배경 이미지를 불러오지 못했습니다.')
    }
  }, [])

  const save = async () => {
    // 저장은 늦춘 값이 아니라 현재 설정으로 다시 합성한다(마지막 색 변경 직후 저장해도 정확하게)
    if (!edited) return
    setSaving(true)
    try {
      const { ext, label } = getExportFormat(format)
      const blob = await encodeCanvas(composeBackground(edited, background), format, quality)
      downloadBlob(blob, `${sanitizeFileName(baseName)}.${ext}`)
      toast.success(`${label}로 저장했습니다.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const modelBusy = model.kind === 'downloading' || model.kind === 'verifying' || model.kind === 'preparing'
  const processing = modelBusy || removal.kind === 'running'
  const removeState: RemoveButtonState = result ? 'done' : processing ? 'busy' : 'ready'
  const cpu = (model.kind === 'ready' && model.backend === 'wasm') || (removal.kind === 'done' && removal.backend === 'wasm')
  // 그래픽 가속(WebGPU)이면 인식 보정 슬라이더를 놓을 때 바로 다시 제거한다(0.4~1초). CPU(장당 수 초)는 버튼으로
  const backendNow = removal.kind === 'done' ? removal.backend : model.kind === 'ready' ? model.backend : null
  const autoRerun = Boolean(result) && backendNow === 'webgpu'
  /** 인식 보정 값 확정(슬라이더 놓음·초기화) — 자동 다시 제거 대상이면 실행 */
  const commitRecognition = (next: RecognitionSettings) => {
    setRecognition(next)
    if (autoRerun && currentRecognition && !sameRecognition(next, currentRecognition)) void startRemoval(next)
  }

  const panelProps = {
    image,
    model,
    removal,
    hasResult: Boolean(result),
    removeState,
    background,
    format,
    quality,
    baseName,
    saving,
    onRemove: () => void startRemoval(),
    onBackgroundChange: (patch: Partial<BackgroundSettings>) => setBackground((prev) => ({ ...prev, ...patch })),
    onPickBackgroundImage: (file: File) => void pickBackgroundImage(file),
    onFormatChange: setFormat,
    onQualityChange: setQuality,
    edge,
    onEdgeChange: (patch: Partial<EdgeSettings>) => setEdge((prev) => ({ ...prev, ...patch })),
    manual: {
      tool,
      brushSize,
      softness,
      rectMode,
      hasEdits: edits.hasEdits,
      onBrushSizeChange: setBrushSize,
      onSoftnessChange: setSoftness,
      // 사각형 방식을 고르면 사각형 도구로 바꾼다
      onRectModeChange: (next: RectMode) => {
        setRectMode(next)
        chooseTool('rect')
      },
      pick,
      lastPickColor: edits.lastPick?.color ?? null,
      // 스포이드 설정을 바꾸면 스포이드 도구로 바꾸고, 마지막 작업이 스포이드면 그 결과에 바로 반영한다
      onPickChange: (patch: Partial<PickOptions>) => {
        const next = { ...pick, ...patch }
        setPick(next)
        chooseTool('picker')
        edits.updateLastPick(next)
      },
      onClear: edits.clearAll,
    },
    recognition: {
      original: image?.original ?? null,
      settings: recognition,
      applied: currentRecognition,
      processing,
      autoRerun,
      onChange: (patch: Partial<RecognitionSettings>) => setRecognition((prev) => ({ ...prev, ...patch })),
      onCommit: commitRecognition,
      onReset: () => commitRecognition(DEFAULT_RECOGNITION),
      onRerun: () => void startRemoval(),
    },
    onBaseNameChange: setBaseName,
    onSave: save,
  }

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50" {...dropHandlers}>
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        <div className="flex h-full flex-col px-8 pt-16 pb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="page-header-title">배경 편집</h1>
              <p className="text-muted-foreground mt-2">
                이미지를 불러와 「배경 제거」를 누르면 AI가 배경을 지웁니다. 지운 배경은 단색이나 다른 이미지로 바꿀 수 있습니다. 이미지는 서버로 전송되지 않고 브라우저에서 처리됩니다.
              </p>
            </div>
            {image && (
              <Button type="button" variant="outline" className="shrink-0 xl:hidden" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                편집 옵션
              </Button>
            )}
          </div>

          {image ? (
            <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-lg border bg-neutral-100">
              <BgPreview original={image.original} result={composed} mode={mode} dimmed={processing} editing={editing} />
              <BgProgressCard model={model} removal={removal} cpu={cpu} onCancelDownload={cancelDownload} />
              {/* 보기 전환 + 수동 보정 도구 — 배경을 제거한 뒤에만 */}
              {result && (
                <div className="pointer-events-none absolute left-3 right-16 top-3 z-30 flex flex-wrap items-start gap-2">
                  <div
                    className="pointer-events-auto flex rounded-lg border bg-card/95 p-0.5 shadow-sm"
                    role="radiogroup"
                    aria-label="보기 방식"
                  >
                    {VIEW_MODES.map((v) => (
                      <button
                        key={v.value}
                        type="button"
                        role="radio"
                        aria-checked={mode === v.value}
                        onClick={() => chooseMode(v.value)}
                        className={cn(
                          'rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          mode === v.value ? 'bg-[var(--penta-indigo)] text-white' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <div className="pointer-events-auto">
                    <BgEditToolbar
                      tool={tool}
                      onToolChange={chooseTool}
                      canUndo={edits.canUndo}
                      canRedo={edits.canRedo}
                      onUndo={edits.undo}
                      onRedo={edits.redo}
                    />
                  </div>
                </div>
              )}
              {/* xl 미만: 패널이 「편집 옵션」 Sheet 안에 있으므로 실행 버튼을 작업 영역 아래에도 둔다 */}
              {!result && (
                <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-4 xl:hidden">
                  <RemoveBackgroundButton state={removeState} onClick={() => void startRemoval()} className="w-auto px-6 shadow-md" />
                </div>
              )}
              {/* 새 이미지 열기 — 이미지 분할과 같은 위치·아이콘 */}
              <TooltipProvider delayDuration={300}>
                <div className="absolute right-3 top-3 z-30 rounded-lg border bg-card/95 px-1 py-0.5 shadow-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={browse}
                        disabled={loading || saving}
                        aria-label="새 이미지 열기"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>새 이미지 열기</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
              {dragActive && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
                  여기에 놓으면 새 이미지로 교체됩니다
                </div>
              )}
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

      <div className="hidden xl:block fixed right-0 top-0 bottom-0">
        <BgSidePanel {...panelProps} />
      </div>

      <Sheet open={Boolean(isCompactViewport && sheetOpen)} onOpenChange={setSheetOpen}>
        <SheetContent
          side={isMobileViewport ? 'bottom' : 'right'}
          className={isMobileViewport ? 'h-[70vh] overflow-y-auto p-0' : 'w-[410px] max-w-[90vw] overflow-y-auto p-0 sm:max-w-[410px]'}
        >
          <SheetTitle className="sr-only">편집 옵션</SheetTitle>
          <BgSidePanel variant="sheet" {...panelProps} />
        </SheetContent>
      </Sheet>

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // 같은 파일을 다시 선택해도 change가 발생하도록
          if (file) void openFile(file)
        }}
      />
    </div>
  )
}
