'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/common/constants'
import { resizeCanvas, validateOutputSize, type Size } from '@/lib/toolbox/common/canvas'
import { DEFAULT_EXPORT_QUALITY, baseNameOf, downloadBlob, type ExportFormat } from '@/lib/toolbox/common/export'
import { ImageLoadError, decodeImageFile, getImageFileFromClipboard, validateImageFile } from '@/lib/toolbox/common/load'
import {
  DEFAULT_PIECE_COUNT,
  DEFAULT_SPLIT_ORDER,
  computePieces,
  equalLines,
  fitLines,
  gridSummary,
  moveLine,
  type PieceCount,
  type SplitOrder,
} from '@/lib/toolbox/image-splitter/grid'
import { buildSplitZip } from '@/lib/toolbox/image-splitter/split'
import { ImageUploadZone } from '@/components/toolbox/common/ImageUploadZone'
import { SplitCanvas, type LineAxis } from './SplitCanvas'
import { SplitSidePanel, type SplitImageInfo } from './SplitSidePanel'

interface LoadedImage extends SplitImageInfo {
  /** 불러온 원본(EXIF 보정 후) — 크기 변경은 항상 여기서 다시 계산 */
  original: HTMLCanvasElement
  /** 현재 크기의 캔버스(원본 크기면 original과 같은 객체) — 미리보기·분할 대상 */
  canvas: HTMLCanvasElement
}

/**
 * TOOLBOX「이미지 분할」 — 모든 처리는 브라우저에서만 수행(서버 전송 없음).
 * 레이아웃: 좌측 작업 영역 + 우측 410px 옵션 패널(xl 이상), xl 미만은 「편집 옵션」 Sheet(모바일 하단 / 태블릿 오른쪽) — 이미지 편집과 동일.
 * 개발 중에는 사이드바(TOOLBOX_MENU)에 노출하지 않는다(P4에서 등록).
 * 구현 기록: docs/TOOLBOX_image-splitter_handoff.md
 */
export function ImageSplitterPage() {
  const isMobileViewport = useIsMobileViewport()
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const [image, setImage] = useState<LoadedImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [count, setCount] = useState<PieceCount>(DEFAULT_PIECE_COUNT)
  const [order, setOrder] = useState<SplitOrder>(DEFAULT_SPLIT_ORDER)
  const [lines, setLines] = useState(() => equalLines(DEFAULT_PIECE_COUNT))
  const [baseName, setBaseName] = useState('')
  const [saving, setSaving] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState(DEFAULT_EXPORT_QUALITY)

  const pieces = useMemo(
    () => (image ? computePieces({ width: image.width, height: image.height }, lines, order) : []),
    [image, lines, order]
  )

  useEffect(() => {
    if (!isCompactViewport) setSheetOpen(false)
  }, [isCompactViewport])

  const openFile = useCallback(async (file: File) => {
    const error = validateImageFile(file)
    if (error) {
      toast.error(error)
      return
    }
    setLoading(true)
    try {
      const canvas = await decodeImageFile(file)
      const fileName = file.name || 'image.png'
      setImage({
        original: canvas,
        canvas,
        width: canvas.width,
        height: canvas.height,
        originalWidth: canvas.width,
        originalHeight: canvas.height,
        fileName,
        fileSize: file.size,
      })
      setBaseName(baseNameOf(fileName))
      // 조각 수·배치는 유지하고, 이전 사진에 맞춰 옮긴 분할선은 균등으로 되돌린다
      setLines(equalLines(count))
    } catch (e) {
      toast.error(e instanceof ImageLoadError ? e.message : '이미지를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [count])

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

  /** 조각 수를 바꾸면 균등 분할로 초기화 (배치=번호 순서는 선 위치에 영향 없음) */
  const changeCount = (next: PieceCount) => {
    setCount(next)
    setLines(equalLines(next))
  }

  const resetLines = () => setLines(equalLines(count))

  /**
   * 사진 크기 적용 — 항상 원본에서 다시 리사이즈(누적 화질 저하 없음), 원본 크기면 원본 그대로.
   * 분할선은 비율을 유지하고, 새 크기에서 최소 간격을 어기는 선만 맞춘다(fitLines).
   */
  const resize = async (next: Size) => {
    if (!image || resizing) return
    const error = validateOutputSize(next)
    if (error) {
      toast.error(error)
      return
    }
    setResizing(true)
    // 큰 이미지는 리사이즈가 수백 ms 걸릴 수 있어, 진행 표시가 먼저 그려지도록 한 틱 양보
    await new Promise((resolve) => setTimeout(resolve, 0))
    try {
      const source = image.original
      const isOriginal = next.width === image.originalWidth && next.height === image.originalHeight
      const canvas = isOriginal ? source : resizeCanvas(source, next.width, next.height)
      // 그 사이 다른 이미지를 열었으면 무시
      setImage((prev) => (prev && prev.original === source ? { ...prev, canvas, width: next.width, height: next.height } : prev))
      setLines((prev) => {
        const xs = fitLines(prev.xs, next.width)
        const ys = fitLines(prev.ys, next.height)
        return xs === prev.xs && ys === prev.ys ? prev : { xs, ys }
      })
      toast.success(`사진 크기를 ${next.width} × ${next.height}px로 바꿨습니다.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '크기를 바꾸지 못했습니다.')
    } finally {
      setResizing(false)
    }
  }

  /** 캔버스 드래그·슬라이더 공용 — 최소 조각 크기·이웃 선 제한은 moveLine이 처리 */
  const changeLine = useCallback(
    (axis: LineAxis, index: number, fraction: number) => {
      if (!image) return
      const length = axis === 'xs' ? image.width : image.height
      setLines((prev) => {
        const next = moveLine(prev[axis], index, fraction, length)
        return next === prev[axis] ? prev : { ...prev, [axis]: next }
      })
    },
    [image]
  )

  const save = async () => {
    if (!image) return
    setSaving(true)
    try {
      const { blob, zipName, fileNames } = await buildSplitZip(image.canvas, pieces, {
        baseName,
        format,
        quality,
      })
      downloadBlob(blob, zipName)
      toast.success(`${fileNames.length}개 조각을 ZIP으로 저장했습니다.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const panelProps = {
    image,
    count,
    order,
    lines,
    baseName,
    format,
    quality,
    saving,
    resizing,
    onResize: resize,
    onFormatChange: setFormat,
    onQualityChange: setQuality,
    onCountChange: changeCount,
    onOrderChange: setOrder,
    onLineChange: changeLine,
    onResetLines: resetLines,
    onBaseNameChange: setBaseName,
    onSave: save,
    onOpenNew: browse,
  }

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50" {...dropHandlers}>
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        <div className="flex h-full flex-col px-8 pt-16 pb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="page-header-title">이미지 분할</h1>
              <p className="text-muted-foreground mt-2">
                이미지를 2·4·8·16조각으로 나눠 ZIP으로 저장하세요. 이미지는 서버로 전송되지 않습니다.
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
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-lg border bg-neutral-100">
                <SplitCanvas
                  canvas={image.canvas}
                  width={image.width}
                  height={image.height}
                  fitKey={image.original}
                  lines={lines}
                  pieces={pieces}
                  onLineChange={changeLine}
                />
                {dragActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
                    여기에 놓으면 새 이미지로 교체됩니다
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground" aria-live="polite">
                {gridSummary(count)} · 번호·분할선은 저장되지 않습니다.
              </p>
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
        <SplitSidePanel {...panelProps} />
      </div>

      <Sheet open={Boolean(isCompactViewport && sheetOpen)} onOpenChange={setSheetOpen}>
        <SheetContent
          side={isMobileViewport ? 'bottom' : 'right'}
          className={isMobileViewport ? 'h-[70vh] overflow-y-auto p-0' : 'w-[410px] max-w-[90vw] overflow-y-auto p-0 sm:max-w-[410px]'}
        >
          <SheetTitle className="sr-only">편집 옵션</SheetTitle>
          <SplitSidePanel variant="sheet" {...panelProps} />
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
