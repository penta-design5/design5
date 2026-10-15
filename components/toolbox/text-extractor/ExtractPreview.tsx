'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, FolderOpen, Loader2, SquareDashedMousePointer, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ZoomControls } from '@/components/toolbox/common/ZoomControls'
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from '@/lib/toolbox/common/constants'
import { centerPosition, fitZoom, zoomAroundPoint, type Point } from '@/lib/toolbox/common/view'
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

/** PDF 미리보기는 긴 변 1,600px 그림이라 그 이상 키우면 흐려진다 — 200%까지 */
const PDF_MAX_ZOOM = 2
/** 화면 이동 시 그림이 이만큼(px)은 화면에 남게 */
const KEEP_VISIBLE = 48

interface View extends Point {
  zoom: number
}

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
 * 원본 미리보기 — 그림과 같은 크기의 SVG를 한 「무대」 상자에 겹쳐 인식 줄 상자(P3)와 선택 영역을 그린다.
 * 「영역 선택」을 켜면 드래그로 영역을 고른다(Esc: 선택 해제). 좌표는 0~1 정규화라 배율과 관계없다.
 * 줌(Z2): 오른쪽 아래 줌 툴바(공용 ZoomControls)·휠·두 손가락으로 배율, 영역 선택 중이 아니면 드래그로 화면 이동.
 * 기본은 화면에 맞추기(원본보다 키우지 않음, 이미지 분할·모자이크와 같은 규칙) — 새 파일·쪽이면 다시 맞춘다.
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

  /* ───── 줌·화면 이동 ───── */
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<View | null>(null)
  /** 사용자가 배율·위치를 바꿨는가(그 동안은 창 크기가 바뀌어도 다시 맞추지 않음) */
  const manualRef = useRef(false)
  const lastUrl = useRef<string | null>(null)
  const maxZoom = numPages !== null ? PDF_MAX_ZOOM : MAX_ZOOM
  const padding = viewport.width < 640 ? 16 : 24

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setViewport({ width: el.clientWidth, height: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fit = useCallback(() => {
    if (!size || !viewport.width || !viewport.height) return
    manualRef.current = false
    const zoom = fitZoom(size.width, size.height, viewport.width, viewport.height, padding)
    setView({ zoom, ...centerPosition(size.width, size.height, viewport.width, viewport.height, zoom) })
  }, [size, viewport.width, viewport.height, padding])

  // 새 그림(파일·쪽)이면 다시 맞추고, 창 크기가 바뀌면 직접 바꾼 적이 없을 때만 다시 맞춘다
  useEffect(() => {
    if (url !== lastUrl.current) {
      lastUrl.current = url
      manualRef.current = false
    }
    if (!manualRef.current) fit()
  }, [url, fit])

  /** 화면 이동 — 그림이 조금은 화면에 남게 */
  const clampView = useCallback(
    (v: View): View => {
      const w = W * v.zoom
      const h = H * v.zoom
      return {
        zoom: v.zoom,
        x: Math.min(viewport.width - KEEP_VISIBLE, Math.max(KEEP_VISIBLE - w, v.x)),
        y: Math.min(viewport.height - KEEP_VISIBLE, Math.max(KEEP_VISIBLE - h, v.y)),
      }
    },
    [W, H, viewport.width, viewport.height]
  )

  const zoomTo = useCallback(
    (next: number, anchor?: Point) => {
      manualRef.current = true
      setView((prev) => {
        if (!prev) return prev
        const zoom = Math.min(maxZoom, Math.max(MIN_ZOOM, next))
        const point = anchor ?? { x: viewport.width / 2, y: viewport.height / 2 }
        return clampView({ zoom, ...zoomAroundPoint(prev, prev.zoom, zoom, point) })
      })
    },
    [maxZoom, viewport.width, viewport.height, clampView]
  )

  // 휠 = 배율(트랙패드·마우스 모두 지수 배율 — 모자이크와 같음). passive가 아니어야 페이지 스크롤을 막을 수 있다
  const viewRef = useRef(view)
  viewRef.current = view
  useEffect(() => {
    const el = viewportRef.current
    if (!el || !url) return
    const onWheel = (e: WheelEvent) => {
      const v = viewRef.current
      if (!v) return
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      zoomTo(v.zoom * Math.exp(-e.deltaY * 0.0015), { x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [url, zoomTo])

  // 드래그 = 화면 이동(영역 선택 중이 아닐 때), 두 손가락 = 배율 + 이동
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<{ kind: 'pan'; start: Point; origin: View } | { kind: 'pinch'; distance: number; origin: View; imagePoint: Point } | null>(null)
  const [panning, setPanning] = useState(false)
  const localPoint = (e: React.PointerEvent) => {
    const rect = viewportRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const pinchInfo = () => {
    const [a, b] = Array.from(pointers.current.values())
    return { distance: Math.hypot(a.x - b.x, a.y - b.y), center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
  }
  const onViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!view || !url || selecting || (e.pointerType === 'mouse' && e.button !== 0)) return
    // 빈 바탕이나 그림 위에서만(도구 줄·줌 툴바·쪽 넘기기·진행 카드 위는 제외)
    if (e.target !== e.currentTarget && !(e.target as Element).closest('[data-testid=ocr-preview-stage]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, localPoint(e))
    if (pointers.current.size === 1) gesture.current = { kind: 'pan', start: localPoint(e), origin: view }
    else if (pointers.current.size === 2) {
      const { distance, center } = pinchInfo()
      gesture.current = { kind: 'pinch', distance, origin: view, imagePoint: { x: (center.x - view.x) / view.zoom, y: (center.y - view.y) / view.zoom } }
    }
    setPanning(true)
  }
  const onViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, localPoint(e))
    const g = gesture.current
    if (!g) return
    if (g.kind === 'pan') {
      const p = localPoint(e)
      const dx = p.x - g.start.x
      const dy = p.y - g.start.y
      if (Math.abs(dx) + Math.abs(dy) < 2) return
      manualRef.current = true
      setView(clampView({ zoom: g.origin.zoom, x: g.origin.x + dx, y: g.origin.y + dy }))
    } else if (pointers.current.size === 2) {
      const { distance, center } = pinchInfo()
      const zoom = Math.min(maxZoom, Math.max(MIN_ZOOM, g.origin.zoom * (distance / g.distance)))
      manualRef.current = true
      setView(clampView({ zoom, x: center.x - g.imagePoint.x * zoom, y: center.y - g.imagePoint.y * zoom }))
    }
  }
  const onViewportPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    // 두 손가락 중 하나를 떼면 남은 손가락으로 이어서 이동
    const rest = Array.from(pointers.current.values())[0]
    gesture.current = rest && view ? { kind: 'pan', start: rest, origin: view } : null
    if (!rest) setPanning(false)
  }
  // 맞춤 상태(확대 전)에서는 손가락 세로 스와이프로 페이지를 스크롤할 수 있게 둔다(두 손가락 확대는 받음)
  const zoomedIn = !!view && manualRef.current && view.zoom > fitZoom(W, H, viewport.width, viewport.height, padding) + 0.001

  return (
    <div
      ref={viewportRef}
      className={cn('relative min-h-[320px] flex-1 select-none overflow-hidden rounded-lg border bg-neutral-100', url && !selecting && (panning ? 'cursor-grabbing' : 'cursor-grab'))}
      style={{ touchAction: selecting || zoomedIn ? 'none' : 'pan-y' }}
      onPointerDown={onViewportPointerDown}
      onPointerMove={onViewportPointerMove}
      onPointerUp={onViewportPointerEnd}
      onPointerCancel={onViewportPointerEnd}
      data-testid="ocr-preview-viewport"
    >
      {url && view && (
        <div
          className="absolute left-0 top-0 shadow-sm"
          style={{ width: W * view.zoom, height: H * view.zoom, transform: `translate(${view.x}px, ${view.y}px)` }}
          data-testid="ocr-preview-stage"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 사용자 파일(blob URL) 미리보기 */}
          <img src={url} alt={alt} className="absolute inset-0 h-full w-full max-w-none" draggable={false} />
          {size && (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className={cn('absolute inset-0 h-full w-full', selecting ? 'cursor-crosshair touch-none' : 'pointer-events-none')}
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
        </div>
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

      {url && view && (
        <ZoomControls
          zoomPercent={Math.round(view.zoom * 100)}
          onZoomIn={() => zoomTo(view.zoom * ZOOM_STEP)}
          onZoomOut={() => zoomTo(view.zoom / ZOOM_STEP)}
          onFit={fit}
          onActualSize={() => {
            manualRef.current = true
            setView({ zoom: 1, ...centerPosition(W, H, viewport.width, viewport.height, 1) })
          }}
        />
      )}

      {numPages !== null && numPages > 1 && (
        // 좁은 화면은 왼쪽 아래(오른쪽 아래 줌 툴바와 겹치지 않게), 넓으면 가운데
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-lg border bg-card/95 px-1 py-0.5 shadow-sm sm:left-1/2 sm:-translate-x-1/2">
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
