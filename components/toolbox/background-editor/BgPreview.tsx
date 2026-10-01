'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ZOOM_STEP } from '@/lib/toolbox/common/constants'
import { centerPosition, clampZoom, fitZoom, zoomAroundPoint, type Point } from '@/lib/toolbox/common/view'
import { ZoomControls } from '@/components/toolbox/common/ZoomControls'

/** 미리보기 방식 — 결과가 나온 뒤 작업 영역 왼쪽 위 전환 버튼으로 고른다 */
export type PreviewMode = 'original' | 'compare' | 'result'

/** 투명 영역 체크무늬 — 공용 createCheckerPattern과 같은 색·8px 칸 */
const CHECKER_STYLE: React.CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '16px 16px',
}

/** 비교 경계선 키보드 이동 폭(%) — Shift는 10배 */
const KEY_STEP = 1

interface View extends Point {
  zoom: number
}

interface PinchState {
  distance: number
  imagePoint: Point
  zoom: number
}

type Gesture = { kind: 'pan'; start: Point; origin: Point } | { kind: 'divider' }

interface BgPreviewProps {
  original: HTMLCanvasElement
  /** 배경을 제거한 결과(원본 해상도) — 없으면 원본만 표시 */
  result: HTMLCanvasElement | null
  mode: PreviewMode
  /** 처리 중 — 원본을 흐리게 */
  dimmed?: boolean
}

/** 원본 해상도 캔버스를 화면 표시 크기 × devicePixelRatio로 그린다(원본 해상도를 넘지 않음) */
function DisplayCanvas({
  source,
  width,
  height,
  pixelated,
  style,
  testId,
  label,
}: {
  source: HTMLCanvasElement
  width: number
  height: number
  pixelated: boolean
  style?: React.CSSProperties
  testId: string
  label: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const display = ref.current
    if (!display) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    display.width = Math.max(1, Math.min(source.width, Math.round(width * dpr)))
    display.height = Math.max(1, Math.min(source.height, Math.round(height * dpr)))
    const ctx = display.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, display.width, display.height)
    ctx.drawImage(source, 0, 0, display.width, display.height)
  }, [source, width, height])
  return (
    <canvas
      ref={ref}
      data-testid={testId}
      className="absolute inset-0 block"
      // 200% 이상은 픽셀이 뭉개지지 않게(이미지 편집·분할과 같은 기준)
      style={{ width, height, imageRendering: pixelated ? 'pixelated' : 'auto', ...style }}
      role="img"
      aria-label={label}
    />
  )
}

/**
 * 결과 미리보기 — 원본 / 비교(왼쪽 원본 · 오른쪽 결과) / 결과.
 * - 처음과 새 이미지·작업 영역 크기 변경 시 화면 맞춤(원본보다 키우지 않음)
 * - 휠 = 포인터 기준 확대/축소, 두 손가락 = 핀치, 빈 곳·이미지를 끌어 화면 이동, 오른쪽 아래 줌 컨트롤(이미지 편집·분할과 동일)
 * - 비교 경계선은 선(히트 폭 24px)·손잡이를 잡았을 때만 움직인다(화면 이동과 겹치지 않음). 손잡이는 키보드 슬라이더
 */
export function BgPreview({ original, result, mode, dimmed }: BgPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 })
  /** 경계선 위치(%, 왼쪽 = 원본 영역) */
  const [split, setSplit] = useState(50)
  const [gesture, setGesture] = useState<Gesture | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBox({ width: Math.floor(width), height: Math.floor(height) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const imgW = original.width
  const imgH = original.height

  const fit = useCallback(() => {
    if (!box.width || !box.height) return
    const zoom = fitZoom(imgW, imgH, box.width, box.height)
    setView({ zoom, ...centerPosition(imgW, imgH, box.width, box.height, zoom) })
  }, [imgW, imgH, box.width, box.height])

  // 새 이미지·작업 영역 크기 변경 → 화면 맞춤(결과·보기 방식이 바뀌어도 배율은 유지)
  useLayoutEffect(() => {
    fit()
  }, [original, fit])

  // 새 결과(새 이미지·다시 제거)가 나오면 경계선을 가운데로
  useEffect(() => setSplit(50), [result])

  const zoomTo = useCallback(
    (nextRaw: number, anchor?: Point) => {
      setView((prev) => {
        const zoom = clampZoom(nextRaw)
        const point = anchor ?? { x: box.width / 2, y: box.height / 2 }
        return { zoom, ...zoomAroundPoint(prev, prev.zoom, zoom, point) }
      })
    },
    [box.width, box.height]
  )

  const latest = useRef({ view })
  latest.current = { view }

  const splitFromClientX = useCallback((clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    setSplit(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  // 누른 뒤에는 window 포인터 이벤트로 따라가 작업 영역 밖으로 나가도 끊기지 않는다
  useEffect(() => {
    if (!gesture) return
    const move = (e: PointerEvent) => {
      if (gesture.kind === 'divider') {
        splitFromClientX(e.clientX)
        return
      }
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      setView((prev) => ({ ...prev, x: gesture.origin.x + px - gesture.start.x, y: gesture.origin.y + py - gesture.start.y }))
    }
    const end = () => setGesture(null)
    const prevCursor = document.body.style.cursor
    document.body.style.cursor = gesture.kind === 'pan' ? 'grabbing' : 'col-resize'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      document.body.style.cursor = prevCursor
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [gesture, splitFromClientX])

  // 휠 확대/축소 — React onWheel은 passive라 preventDefault가 안 되므로 직접 등록
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const v = latest.current.view
      // 트랙패드(작은 delta)와 마우스 휠(큰 delta) 모두 자연스럽게 — 지수 배율
      const zoom = clampZoom(v.zoom * Math.exp(-e.deltaY * 0.0015))
      setView({ zoom, ...zoomAroundPoint(v, v.zoom, zoom, { x: e.clientX - rect.left, y: e.clientY - rect.top }) })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // 터치: 두 손가락 핀치 줌·이동(이미지 분할 SplitCanvas와 같은 방식) — 한 손가락 조작은 두 번째 손가락이 닿으면 취소
  const pinchRef = useRef<PinchState | null>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = (touches: TouchList) => {
      const rect = el.getBoundingClientRect()
      const [a, b] = [touches[0], touches[1]]
      return {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        center: { x: (a.clientX + b.clientX) / 2 - rect.left, y: (a.clientY + b.clientY) / 2 - rect.top },
      }
    }
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      if (e.cancelable) e.preventDefault()
      setGesture(null)
      const { distance, center } = measure(e.touches)
      const v = latest.current.view
      pinchRef.current = { distance: Math.max(1, distance), imagePoint: { x: (center.x - v.x) / v.zoom, y: (center.y - v.y) / v.zoom }, zoom: v.zoom }
    }
    const onMove = (e: TouchEvent) => {
      const pinch = pinchRef.current
      if (!pinch || e.touches.length !== 2) return
      if (e.cancelable) e.preventDefault()
      const { distance, center } = measure(e.touches)
      const z = clampZoom(pinch.zoom * (distance / pinch.distance))
      setView({ zoom: z, x: center.x - pinch.imagePoint.x * z, y: center.y - pinch.imagePoint.y * z })
    }
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null
    }
    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const acceptPointer = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return false
    if (pinchRef.current) return false
    e.preventDefault()
    return true
  }

  const startPan = (e: React.PointerEvent) => {
    if (!acceptPointer(e)) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setGesture({ kind: 'pan', start: { x: e.clientX - rect.left, y: e.clientY - rect.top }, origin: { x: view.x, y: view.y } })
  }

  const startDivider = (e: React.PointerEvent) => {
    e.stopPropagation() // 화면 이동으로 넘어가지 않게
    if (!acceptPointer(e)) return
    splitFromClientX(e.clientX)
    setGesture({ kind: 'divider' })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? KEY_STEP * 10 : KEY_STEP
    const next =
      e.key === 'ArrowLeft' ? split - step : e.key === 'ArrowRight' ? split + step : e.key === 'Home' ? 0 : e.key === 'End' ? 100 : null
    if (next === null) return
    e.preventDefault()
    setSplit(Math.min(100, Math.max(0, next)))
  }

  const ready = box.width > 0 && box.height > 0
  const width = Math.max(1, imgW * view.zoom)
  const height = Math.max(1, imgH * view.zoom)
  const pixelated = view.zoom >= 2
  const shown: PreviewMode = result ? mode : 'original'
  // 손잡이·라벨은 화면에 보이는 부분의 세로 가운데(확대해도 화면 안에 있게)
  const visibleTop = Math.max(0, -view.y)
  const visibleBottom = Math.min(height, box.height - view.y)
  const handleY = visibleBottom > visibleTop ? (visibleTop + visibleBottom) / 2 : height / 2

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none overflow-hidden"
      style={{ cursor: gesture?.kind === 'pan' ? 'grabbing' : 'grab' }}
      onPointerDown={startPan}
      role="region"
      aria-label="미리보기 — 끌어서 화면을 옮기고, 휠(또는 두 손가락)로 확대/축소합니다."
      data-testid="bg-preview-viewport"
    >
      {ready && (
        <div
          ref={frameRef}
          className={cn('absolute shadow-sm transition-opacity', dimmed && 'opacity-60')}
          style={{ left: view.x, top: view.y, width, height }}
          data-testid="bg-preview"
          data-mode={shown}
          data-transparent={shown === 'original' ? 'false' : 'true'}
          data-zoom={view.zoom.toFixed(4)}
        >
          {result && shown !== 'original' && (
            <DisplayCanvas
              source={result}
              width={width}
              height={height}
              pixelated={pixelated}
              style={CHECKER_STYLE}
              testId="bg-preview-result"
              label="배경을 바꾼 결과"
            />
          )}
          {shown !== 'result' && (
            <DisplayCanvas
              source={original}
              width={width}
              height={height}
              pixelated={pixelated}
              testId="bg-preview-original"
              label="원본 이미지"
              // 비교: 경계선 왼쪽만 원본을 보인다
              style={shown === 'compare' ? { clipPath: `inset(0 ${100 - split}% 0 0)` } : undefined}
            />
          )}

          {shown === 'compare' && (
            <div
              className="absolute inset-y-0 z-10 w-6 -translate-x-1/2 cursor-col-resize touch-none"
              style={{ left: `${split}%` }}
              onPointerDown={startDivider}
              data-testid="bg-compare-divider"
            >
              <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
              <div className="pointer-events-none absolute" style={{ top: handleY - 44 }}>
                <span className="absolute right-3 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">원본</span>
                <span className="absolute left-9 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">결과</span>
              </div>
              <div
                role="slider"
                tabIndex={0}
                aria-label="원본·결과 비교 위치"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(split)}
                aria-valuetext={`원본 ${Math.round(split)}%`}
                onKeyDown={onKeyDown}
                className="absolute left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[var(--penta-indigo)] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ top: handleY }}
              >
                <ChevronsLeftRight className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      )}
      <div onPointerDown={(e) => e.stopPropagation()}>
        <ZoomControls
          zoomPercent={Math.round(view.zoom * 100)}
          onZoomIn={() => zoomTo(view.zoom * ZOOM_STEP)}
          onZoomOut={() => zoomTo(view.zoom / ZOOM_STEP)}
          onFit={fit}
          onActualSize={() => setView({ zoom: 1, ...centerPosition(imgW, imgH, box.width, box.height, 1) })}
        />
      </div>
    </div>
  )
}
