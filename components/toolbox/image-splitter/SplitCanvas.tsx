'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Image as KonvaImage, Rect, Line, Circle, Text } from 'react-konva'
import type Konva from 'konva'
import { ZOOM_STEP } from '@/lib/toolbox/common/constants'
import { createCheckerPattern } from '@/lib/toolbox/common/canvas'
import { centerPosition, clampZoom, fitZoom, zoomAroundPoint, type Point } from '@/lib/toolbox/common/view'
import { edgesOf, type Piece, type SplitLines } from '@/lib/toolbox/image-splitter/grid'
import { ZoomControls } from '@/components/toolbox/common/ZoomControls'

export type LineAxis = keyof SplitLines

interface SplitCanvasProps {
  canvas: HTMLCanvasElement
  width: number
  height: number
  /** 이 값이 바뀌면(새 이미지) 화면 맞춤. 사진 크기만 바뀌면 배율을 유지한다 */
  fitKey: unknown
  lines: SplitLines
  pieces: Piece[]
  /** 선 이동 요청(fraction = 사진 기준 비율). 최소 간격 제한은 호출하는 쪽(moveLine)에서 처리 */
  onLineChange: (axis: LineAxis, index: number, fraction: number) => void
}

interface LineRef {
  axis: LineAxis
  index: number
}

interface View extends Point {
  zoom: number
}

/** 누르고 있는 동안의 조작 — 분할선 이동 또는 화면 이동 */
type Gesture = ({ kind: 'line' } & LineRef) | { kind: 'pan'; start: Point; origin: Point }

interface PinchState {
  distance: number
  imagePoint: Point
  zoom: number
}

const INDIGO = '#4f46e5'
const BADGE_RADIUS = 15
/** 선을 잡을 수 있는 폭(화면 px) */
const HIT_WIDTH = 12
const CURSOR: Record<LineAxis, string> = { xs: 'col-resize', ys: 'row-resize' }

const sameLine = (a: LineRef | null, b: LineRef | null) => a?.axis === b?.axis && a?.index === b?.index

/**
 * 분할 미리보기 — 이미지와 분할선·조각 번호를 겹쳐 표시(번호·선은 저장 결과에 포함되지 않음).
 * 이미지는 원본 좌표 Group(배율 적용), 분할선·번호는 화면 좌표 레이어에 그려 두께·크기가 배율과 무관하게 일정하다.
 * - 분할선 드래그(세로선 = 좌우, 가로선 = 위아래), 선 밖을 끌면 화면 이동
 * - 휠 = 포인터 기준 확대/축소, 두 손가락 = 핀치 줌, 오른쪽 아래 줌 컨트롤(이미지 편집과 동일)
 * 누른 뒤에는 window 포인터 이벤트로 따라가 캔버스 밖으로 나가도 끊기지 않는다.
 */
export function SplitCanvas({ canvas, width, height, fitKey, lines, pieces, onLineChange }: SplitCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 })
  const [checker] = useState(createCheckerPattern)
  const [hover, setHover] = useState<LineRef | null>(null)
  const [gesture, setGesture] = useState<Gesture | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      setSize({ width: Math.floor(w), height: Math.floor(h) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fit = useCallback(() => {
    if (!size.width || !size.height) return
    const zoom = fitZoom(width, height, size.width, size.height)
    setView({ zoom, ...centerPosition(width, height, size.width, size.height, zoom) })
  }, [width, height, size.width, size.height])

  const zoomTo = useCallback(
    (nextZoomRaw: number, anchor?: Point) => {
      setView((prev) => {
        const zoom = clampZoom(nextZoomRaw)
        const point = anchor ?? { x: size.width / 2, y: size.height / 2 }
        return { zoom, ...zoomAroundPoint(prev, prev.zoom, zoom, point) }
      })
    },
    [size.width, size.height]
  )

  // 새 이미지·작업 영역 크기 변경 → 화면 맞춤
  // 사진 크기만 변경 → 배율 유지(3배면 화면에서도 3배), 화면 가운데에 있던 지점을 그대로 가운데에 둔다
  const prevLayout = useRef<{ fitKey: unknown; width: number; height: number; vw: number; vh: number } | null>(null)
  useLayoutEffect(() => {
    if (!size.width || !size.height) return
    const prev = prevLayout.current
    prevLayout.current = { fitKey, width, height, vw: size.width, vh: size.height }
    if (!prev || prev.fitKey !== fitKey || prev.vw !== size.width || prev.vh !== size.height) {
      fit()
    } else if (prev.width !== width || prev.height !== height) {
      setView((v) => {
        const cx = size.width / 2
        const cy = size.height / 2
        const fx = (cx - v.x) / (v.zoom * prev.width)
        const fy = (cy - v.y) / (v.zoom * prev.height)
        return { zoom: v.zoom, x: cx - fx * v.zoom * width, y: cy - fy * v.zoom * height }
      })
    }
  }, [fitKey, width, height, size.width, size.height, fit])

  const { zoom } = view
  const sx = (x: number) => view.x + x * zoom
  const sy = (y: number) => view.y + y * zoom

  // 제스처 중 최신 뷰·크기·콜백을 이벤트 핸들러에서 쓰기 위한 ref
  const latest = useRef({ view, width, height, onLineChange })
  latest.current = { view, width, height, onLineChange }

  useEffect(() => {
    if (!gesture) return
    const handleMove = (e: PointerEvent) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const { view: v, width: w, height: h, onLineChange: change } = latest.current
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      if (gesture.kind === 'pan') {
        setView((prev) => ({ ...prev, x: gesture.origin.x + px - gesture.start.x, y: gesture.origin.y + py - gesture.start.y }))
        return
      }
      const fraction = gesture.axis === 'xs' ? (px - v.x) / v.zoom / w : (py - v.y) / v.zoom / h
      change(gesture.axis, gesture.index, fraction)
    }
    const end = () => setGesture(null)
    // 제스처 중에는 포인터가 선·캔버스 밖으로 나가도 커서 유지
    const prevCursor = document.body.style.cursor
    document.body.style.cursor = gesture.kind === 'pan' ? 'grabbing' : CURSOR[gesture.axis]
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      document.body.style.cursor = prevCursor
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [gesture])

  // ---------- 터치: 두 손가락 핀치 줌·이동 (이미지 편집 EditorCanvas와 같은 방식) ----------
  // 한 손가락으로 시작한 선 이동·화면 이동은 두 번째 손가락이 닿는 순간 취소하고 핀치로 전환한다.
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
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      if (e.cancelable) e.preventDefault()
      setGesture(null)
      const { distance, center } = measure(e.touches)
      const v = latest.current.view
      pinchRef.current = {
        distance: Math.max(1, distance),
        imagePoint: { x: (center.x - v.x) / v.zoom, y: (center.y - v.y) / v.zoom },
        zoom: v.zoom,
      }
    }
    const handleTouchMove = (e: TouchEvent) => {
      const pinch = pinchRef.current
      if (!pinch || e.touches.length !== 2) return
      if (e.cancelable) e.preventDefault()
      const { distance, center } = measure(e.touches)
      const z = clampZoom(pinch.zoom * (distance / pinch.distance))
      setView({ zoom: z, x: center.x - pinch.imagePoint.x * z, y: center.y - pinch.imagePoint.y * z })
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null
    }
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('touchcancel', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [])

  /** Konva는 마우스·터치 이벤트를 pointer 이벤트로 넘겨준다 — 마우스는 왼쪽 버튼만, 핀치 중에는 무시 */
  const acceptPointer = (e: Konva.KonvaEventObject<PointerEvent>) => {
    const evt = e.evt as MouseEvent | TouchEvent
    if ('button' in evt && evt.button !== 0) return false
    if ('touches' in evt && evt.touches.length > 1) return false
    if (pinchRef.current) return false
    evt.preventDefault()
    return true
  }

  // 선 밖(이미지·빈 곳)을 누르면 화면 이동. 선을 누르면 선 핸들러가 먼저 받고 전파를 막는다
  const handleStagePointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!acceptPointer(e)) return
    const pointer = e.target.getStage()?.getPointerPosition()
    if (!pointer) return
    setGesture({ kind: 'pan', start: pointer, origin: { x: view.x, y: view.y } })
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const pointer = e.target.getStage()?.getPointerPosition()
    // 트랙패드(작은 delta)와 마우스 휠(큰 delta) 모두 자연스럽게 — 지수 배율
    zoomTo(zoom * Math.exp(-e.evt.deltaY * 0.0015), pointer ?? undefined)
  }

  // 표시 위치 = 실제 저장 경계(정수 px)와 동일
  const xEdges = edgesOf(lines.xs, width).slice(1, -1)
  const yEdges = edgesOf(lines.ys, height).slice(1, -1)
  const activeLine = gesture?.kind === 'line' ? gesture : null
  const highlighted = activeLine ?? (gesture ? null : hover)
  const cursor =
    gesture?.kind === 'pan' ? 'grabbing' : highlighted ? CURSOR[highlighted.axis] : 'grab'

  /**
   * 축소 상태에서는 최소 간격(8px)인 선들이 화면에서 몇 px 차이라 잡는 영역이 겹친다.
   * 위에 그려진 선이 아니라 누른 위치에서 가장 가까운 같은 방향 선을 잡는다.
   */
  const nearestLine = (hit: LineRef, pointer: Point | null | undefined): LineRef => {
    if (!pointer) return hit
    const screen = hit.axis === 'xs' ? xEdges.map(sx) : yEdges.map(sy)
    const at = hit.axis === 'xs' ? pointer.x : pointer.y
    let index = hit.index
    screen.forEach((pos, i) => {
      if (Math.abs(pos - at) < Math.abs(screen[index] - at)) index = i
    })
    return { axis: hit.axis, index }
  }

  // hover(커서·강조)는 마우스 전용. Konva는 stage를 벗어날 때 도형에 mouseleave를 보낸다(pointerleave 아님)
  const lineHandlers = (ref: LineRef) => ({
    onMouseEnter: () => setHover(ref),
    onMouseLeave: () => setHover((h) => (sameLine(h, ref) ? null : h)),
    onPointerDown: (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.cancelBubble = true
      if (!acceptPointer(e)) return
      setGesture({ kind: 'line', ...nearestLine(ref, e.target.getStage()?.getPointerPosition()) })
    },
  })

  const renderLine = (ref: LineRef, points: number[]) => {
    const isOn = sameLine(highlighted, ref)
    return (
      <Group key={`${ref.axis}${ref.index}`}>
        <Line points={points} stroke="rgba(255,255,255,0.9)" strokeWidth={isOn ? 5 : 3} listening={false} />
        <Line points={points} stroke={INDIGO} strokeWidth={isOn ? 2 : 1} opacity={isOn ? 1 : 0.6} listening={false} />
        {/* 잡기 쉬운 투명 히트 영역 */}
        <Line
          points={points}
          stroke="transparent"
          strokeWidth={1}
          hitStrokeWidth={HIT_WIDTH}
          name={`split-line-${ref.axis}-${ref.index}`}
          {...lineHandlers(ref)}
        />
      </Group>
    )
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none"
      style={{ cursor }}
      role="region"
      aria-label={`분할 미리보기 — ${pieces.length}조각. 분할선을 드래그해 조각 크기를, 빈 곳을 끌어 화면 위치를, 휠로 배율을 조절합니다.`}
    >
      {size.width > 0 && size.height > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          onMouseLeave={() => setHover(null)}
          onPointerDown={handleStagePointerDown}
          onWheel={handleWheel}
        >
          {/* 확대 시(200% 이상) 픽셀이 뭉개지지 않도록 스무딩 끔 */}
          <Layer imageSmoothingEnabled={zoom < 2} listening={false}>
            <Group x={view.x} y={view.y} scaleX={zoom} scaleY={zoom}>
              <Rect
                width={width}
                height={height}
                fillPatternImage={checker as unknown as HTMLImageElement}
                fillPatternScale={{ x: 1 / zoom, y: 1 / zoom }}
              />
              <KonvaImage image={canvas} width={width} height={height} />
            </Group>
          </Layer>
          <Layer>
            <Rect
              x={sx(0)}
              y={sy(0)}
              width={width * zoom}
              height={height * zoom}
              stroke={INDIGO}
              strokeWidth={1}
              opacity={0.5}
              listening={false}
            />
            {pieces.map((p) => {
              // 조각이 화면에서 작으면 배지도 작게
              const r = Math.max(7, Math.min(BADGE_RADIUS, (Math.min(p.width, p.height) * zoom) / 3))
              return (
                <Group
                  key={p.index}
                  x={sx(p.x + p.width / 2)}
                  y={sy(p.y + p.height / 2)}
                  name="piece-badge"
                  listening={false}
                >
                  <Circle radius={r} fill={INDIGO} stroke="#ffffff" strokeWidth={1.5} shadowColor="rgba(0,0,0,0.25)" shadowBlur={4} />
                  <Text
                    text={String(p.index)}
                    width={r * 2}
                    height={r * 2}
                    offsetX={r}
                    offsetY={r}
                    align="center"
                    verticalAlign="middle"
                    fill="#ffffff"
                    fontStyle="bold"
                    fontSize={Math.round(r * 0.95)}
                  />
                </Group>
              )
            })}
            {/* 선은 배지 위에 — 조각이 작아 배지와 겹쳐도 선을 잡을 수 있게 */}
            {yEdges.map((y, index) => renderLine({ axis: 'ys', index }, [sx(0), sy(y), sx(width), sy(y)]))}
            {xEdges.map((x, index) => renderLine({ axis: 'xs', index }, [sx(x), sy(0), sx(x), sy(height)]))}
          </Layer>
        </Stage>
      )}
      <ZoomControls
        zoomPercent={Math.round(zoom * 100)}
        onZoomIn={() => zoomTo(zoom * ZOOM_STEP)}
        onZoomOut={() => zoomTo(zoom / ZOOM_STEP)}
        onFit={fit}
        onActualSize={() => setView({ zoom: 1, ...centerPosition(width, height, size.width, size.height, 1) })}
      />
    </div>
  )
}
