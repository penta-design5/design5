'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, FolderOpen, Loader2, SquareDashedMousePointer, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TextBox } from '@/lib/toolbox/text-extractor/layout'
import { isUsableRegion, rectFromDrag, type NormRect } from '@/lib/toolbox/text-extractor/region'

interface ExtractPreviewProps {
  url: string | null
  /** 미리보기 그림 크기(px) — 겹쳐 그리는 SVG의 좌표계 */
  size: { width: number; height: number } | null
  alt: string
  loading: boolean
  /** PDF면 전체 쪽수(이미지면 null) */
  numPages: number | null
  page: number
  onPageChange: (page: number) => void
  /** 이 미리보기에 해당하는 인식 줄 상자(정규화, 없으면 null) */
  lines: TextBox[] | null
  showLines: boolean
  onShowLinesChange: (show: boolean) => void
  selecting: boolean
  onSelectingChange: (selecting: boolean) => void
  region: NormRect | null
  onRegionChange: (region: NormRect | null) => void
  /** 추출 중 등 — 영역 선택·파일 열기 잠금 */
  busy: boolean
  dragActive: boolean
  onBrowse: () => void
  /** 진행 카드 등 위에 겹칠 내용 */
  children?: React.ReactNode
}

const IMAGE_INSET = 'absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] sm:inset-6 sm:h-[calc(100%-3rem)] sm:w-[calc(100%-3rem)]'

function ToolButton({ label, pressed, disabled, onClick, children }: { label: string; pressed?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11', pressed && 'bg-[rgb(var(--penta-indigo-rgb)/0.12)] text-[var(--penta-indigo)]')}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={pressed}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * 원본 미리보기 — 그림 위에 같은 위치·비율(object-contain = SVG meet)로 SVG를 겹쳐
 * 인식 줄 상자(P3)와 선택 영역을 그린다. 「영역 선택」을 켜면 드래그로 영역을 고른다(Esc: 선택 해제).
 */
export function ExtractPreview(props: ExtractPreviewProps) {
  const { url, size, alt, loading, numPages, page, onPageChange, lines, showLines, onShowLinesChange } = props
  const { selecting, onSelectingChange, region, onRegionChange, busy, dragActive, onBrowse, children } = props
  const svgRef = useRef<SVGSVGElement>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [draft, setDraft] = useState<NormRect | null>(null)

  // Esc: 영역 선택 끝내기·선택 해제
  useEffect(() => {
    if (!selecting && !region) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || busy) return
      dragStart.current = null
      setDraft(null)
      onRegionChange(null)
      onSelectingChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selecting, region, busy, onRegionChange, onSelectingChange])

  const toNorm = (e: React.PointerEvent) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm || !size) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: p.x / size.width, y: p.y / size.height }
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!selecting || busy || e.button !== 0) return
    const p = toNorm(e)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = p
    setDraft(rectFromDrag(p, p))
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStart.current) return
    const p = toNorm(e)
    if (p) setDraft(rectFromDrag(dragStart.current, p))
  }
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const start = dragStart.current
    dragStart.current = null
    setDraft(null)
    const p = toNorm(e)
    if (!start || !p || !size) return
    const rect = rectFromDrag(start, p)
    // 너무 작으면(클릭) 무시 — 기존 선택 유지
    if (isUsableRegion(rect, size.width, size.height)) onRegionChange(rect)
  }

  const shownRegion = draft ?? region
  const W = size?.width ?? 1
  const H = size?.height ?? 1

  return (
    <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-lg border bg-neutral-100">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- 사용자 파일(blob URL) 미리보기
        <img src={url} alt={alt} className={cn(IMAGE_INSET, 'object-contain')} draggable={false} />
      )}
      {url && size && (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className={cn(IMAGE_INSET, selecting ? 'cursor-crosshair touch-none' : 'pointer-events-none')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragStart.current = null
            setDraft(null)
          }}
          data-testid="ocr-preview-overlay"
          aria-hidden="true"
        >
          {showLines &&
            lines?.map((l, i) => (
              <rect
                key={i}
                x={l.x0 * W}
                y={l.y0 * H}
                width={(l.x1 - l.x0) * W}
                height={(l.y1 - l.y0) * H}
                className={cn('fill-amber-400/15 stroke-amber-500', !selecting && 'pointer-events-auto')}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                data-testid="ocr-line-box"
              >
                <title>{l.text}</title>
              </rect>
            ))}
          {shownRegion && (
            <>
              {/* 선택 바깥을 어둡게 */}
              <path
                d={`M0 0H${W}V${H}H0Z M${shownRegion.x0 * W} ${shownRegion.y0 * H}V${shownRegion.y1 * H}H${shownRegion.x1 * W}V${shownRegion.y0 * H}Z`}
                className="fill-black/30"
                fillRule="evenodd"
              />
              <rect
                x={shownRegion.x0 * W}
                y={shownRegion.y0 * H}
                width={(shownRegion.x1 - shownRegion.x0) * W}
                height={(shownRegion.y1 - shownRegion.y0) * H}
                className="fill-none stroke-[var(--penta-indigo)]"
                strokeWidth={2}
                strokeDasharray="6 4"
                vectorEffect="non-scaling-stroke"
                data-testid="ocr-region"
              />
            </>
          )}
        </svg>
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <TooltipProvider delayDuration={300}>
        <div className="absolute right-3 top-3 z-10 flex items-center rounded-lg border bg-card/95 px-1 py-0.5 shadow-sm">
          <ToolButton label={selecting ? '영역 선택 끝내기' : '영역 선택'} pressed={selecting} disabled={busy || !size} onClick={() => onSelectingChange(!selecting)}>
            <SquareDashedMousePointer className="h-4 w-4" />
          </ToolButton>
          {region && (
            <ToolButton label="선택 해제" disabled={busy} onClick={() => onRegionChange(null)}>
              <X className="h-4 w-4" />
            </ToolButton>
          )}
          {lines && lines.length > 0 && (
            <ToolButton label={showLines ? '인식 영역 숨기기' : '인식 영역 표시'} pressed={showLines} onClick={() => onShowLinesChange(!showLines)}>
              {showLines ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </ToolButton>
          )}
          <ToolButton label="새 파일 열기" disabled={busy} onClick={onBrowse}>
            <FolderOpen className="h-4 w-4" />
          </ToolButton>
        </div>
      </TooltipProvider>

      {selecting && !region && !draft && (
        <p className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md bg-foreground/80 px-3 py-1 text-xs text-background">
          추출할 부분을 드래그하세요 (Esc: 취소)
        </p>
      )}

      {numPages !== null && numPages > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-card/95 px-1 py-0.5 shadow-sm">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} aria-label="이전 페이지">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[4.5rem] text-center text-sm tabular-nums" aria-live="polite">
            {page} / {numPages}쪽
          </span>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11" onClick={() => onPageChange(Math.min(numPages, page + 1))} disabled={page >= numPages} aria-label="다음 페이지">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {dragActive && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
          여기에 놓으면 새 파일로 교체됩니다
        </div>
      )}
      {children}
    </div>
  )
}
