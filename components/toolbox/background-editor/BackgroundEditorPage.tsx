'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FolderOpen, Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/common/constants'
import { baseNameOf, downloadBlob, encodeCanvas, sanitizeFileName } from '@/lib/toolbox/common/export'
import { ImageLoadError, decodeImageFile, getImageFileFromClipboard, validateImageFile } from '@/lib/toolbox/common/load'
import { cn } from '@/lib/utils'
import { ImageUploadZone } from '@/components/toolbox/common/ImageUploadZone'
import { BgPreview, type PreviewMode } from './BgPreview'
import { BgProgressCard } from './BgProgressCard'
import { BgSidePanel, type BgImageInfo } from './BgSidePanel'
import { RemoveBackgroundButton, type RemoveButtonState } from './RemoveBackgroundButton'
import { useBackgroundRemoval } from './use-background-removal'

const VIEW_MODES: { value: PreviewMode; label: string }[] = [
  { value: 'original', label: '원본' },
  { value: 'compare', label: '비교' },
  { value: 'result', label: '결과' },
]

interface LoadedImage extends BgImageInfo {
  /** 불러온 원본(EXIF 보정 후) */
  original: HTMLCanvasElement
}

/**
 * TOOLBOX「배경 편집」 — 배경 제거는 브라우저 안의 AI 모델(ISNet, onnxruntime-web)로 처리한다(서버 전송 없음).
 * 레이아웃: 좌측 작업 영역 + 우측 410px 옵션 패널(xl 이상), xl 미만은 「편집 옵션」 Sheet — 이미지 분할과 동일.
 * 흐름: 이미지 불러오기(원본 표시) → 「배경 제거」 버튼 → 결과. 결과는 「원본 | 비교 | 결과」로 볼 수 있다.
 * 모델은 처음 「배경 제거」를 누를 때 외부 CDN에서 내려받는다(진행 카드), 이후에는 브라우저에 저장된 모델을 쓴다.
 * 사이드바 메뉴: lib/toolbox/menu.ts의 TOOLBOX_MENU(P4에서 등록).
 * 구현 기록: docs/TOOLBOX_background-editor_handoff.md
 */
export function BackgroundEditorPage() {
  const isMobileViewport = useIsMobileViewport()
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const [image, setImage] = useState<LoadedImage | null>(null)
  const [result, setResult] = useState<HTMLCanvasElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [baseName, setBaseName] = useState('')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<PreviewMode>('result')
  const { model, removal, remove, reset, cancelDownload } = useBackgroundRemoval()
  const imageRef = useRef(image)
  imageRef.current = image

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

  const startRemoval = useCallback(async () => {
    if (!image) return
    const source = image.original
    const cutout = await remove(source)
    // 그 사이 다른 이미지를 열었으면 무시(remove도 null을 돌려주지만 한 번 더 확인)
    if (!cutout || imageRef.current?.original !== source) return
    setResult(cutout)
    setMode('result')
  }, [image, remove])

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
        setResult(null)
        setMode('result')
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

  const save = async () => {
    if (!result) return
    setSaving(true)
    try {
      const blob = await encodeCanvas(result, 'png', 1)
      downloadBlob(blob, `${sanitizeFileName(baseName)}.png`)
      toast.success('배경을 제거한 이미지를 PNG로 저장했습니다.')
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

  const panelProps = {
    image,
    model,
    removal,
    hasResult: Boolean(result),
    removeState,
    baseName,
    saving,
    onRemove: () => void startRemoval(),
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
                이미지를 불러와 「배경 제거」를 누르면 AI가 배경을 지웁니다. 이미지는 서버로 전송되지 않고 브라우저에서 처리됩니다.
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
              <BgPreview original={image.original} result={result} mode={mode} dimmed={processing} />
              <BgProgressCard model={model} removal={removal} cpu={cpu} onCancelDownload={cancelDownload} />
              {/* 보기 전환 — 배경을 제거한 뒤에만 */}
              {result && (
                <div
                  className="absolute left-3 top-3 z-30 flex rounded-lg border bg-card/95 p-0.5 shadow-sm"
                  role="radiogroup"
                  aria-label="보기 방식"
                >
                  {VIEW_MODES.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      role="radio"
                      aria-checked={mode === v.value}
                      onClick={() => setMode(v.value)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        mode === v.value ? 'bg-[var(--penta-indigo)] text-white' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
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
