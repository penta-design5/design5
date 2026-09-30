'use client'

import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Image as KonvaImage, Rect, Line, Circle, Text } from 'react-konva'
import type Konva from 'konva'
import { createCheckerPattern } from '@/lib/toolbox/common/canvas'
import { centerPosition, fitZoom } from '@/lib/toolbox/common/view'
import { edgesOf, type Piece, type SplitLines } from '@/lib/toolbox/image-splitter/grid'

export type LineAxis = keyof SplitLines

interface SplitCanvasProps {
  canvas: HTMLCanvasElement
  width: number
  height: number
  lines: SplitLines
  pieces: Piece[]
  /** 선 이동 요청(fraction = 사진 기준 비율). 최소 간격 제한은 호출하는 쪽(moveLine)에서 처리 */
  onLineChange: (axis: LineAxis, index: number, fraction: number) => void
}

interface LineRef {
  axis: LineAxis
  index: number
}

const INDIGO = '#4f46e5'
const BADGE_RADIUS = 15
/** 선을 잡을 수 있는 폭(화면 px) */
const HIT_WIDTH = 12
const CURSOR: Record<LineAxis, string> = { xs: 'col-resize', ys: 'row-resize' }

const sameLine = (a: LineRef | null, b: LineRef | null) => a?.axis === b?.axis && a?.index === b?.index

/**
 * 분할 미리보기 — 이미지를 화면에 맞춰 그리고 분할선·조각 번호를 겹쳐 표시(저장 결과에는 포함되지 않음).
 * 이미지는 원본 좌표 Group(배율 적용), 분할선·번호는 화면 좌표 레이어에 그려 두께·크기가 배율과 무관하게 일정하다.
 * 분할선은 드래그로 옮긴다(세로선 = 좌우, 가로선 = 위아래). 누른 뒤에는 window 포인터 이벤트로 따라가
 * 캔버스 밖으로 나가도 드래그가 끊기지 않는다.
 */
export function SplitCanvas({ canvas, width, height, lines, pieces, onLineChange }: SplitCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [checker] = useState(createCheckerPattern)
  const [hover, setHover] = useState<LineRef | null>(null)
  const [active, setActive] = useState<LineRef | null>(null)

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

  const zoom = size.width && size.height ? fitZoom(width, height, size.width, size.height) : 1
  const pos = centerPosition(width, height, size.width, size.height, zoom)
  const sx = (x: number) => pos.x + x * zoom
  const sy = (y: number) => pos.y + y * zoom

  // 드래그 중 최신 배율·위치·콜백을 이벤트 핸들러에서 쓰기 위한 ref
  const latest = useRef({ zoom, pos, width, height, onLineChange })
  latest.current = { zoom, pos, width, height, onLineChange }

  useEffect(() => {
    if (!active) return
    const handleMove = (e: PointerEvent) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const { zoom: z, pos: p, width: w, height: h, onLineChange: change } = latest.current
      const fraction =
        active.axis === 'xs' ? (e.clientX - rect.left - p.x) / z / w : (e.clientY - rect.top - p.y) / z / h
      change(active.axis, active.index, fraction)
    }
    const end = () => setActive(null)
    // 드래그 중에는 포인터가 선 밖으로 나가도 커서 유지
    const prevCursor = document.body.style.cursor
    document.body.style.cursor = CURSOR[active.axis]
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      document.body.style.cursor = prevCursor
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [active])

  // 표시 위치 = 실제 저장 경계(정수 px)와 동일
  const xEdges = edgesOf(lines.xs, width).slice(1, -1)
  const yEdges = edgesOf(lines.ys, height).slice(1, -1)
  const highlighted = active ?? hover
  const cursor = highlighted ? CURSOR[highlighted.axis] : undefined

  // hover(커서·강조)는 마우스 전용. Konva는 stage를 벗어날 때 도형에 mouseleave를 보낸다(pointerleave 아님)
  const lineHandlers = (ref: LineRef) => ({
    onMouseEnter: () => setHover(ref),
    onMouseLeave: () => setHover((h) => (sameLine(h, ref) ? null : h)),
    onPointerDown: (e: Konva.KonvaEventObject<PointerEvent>) => {
      // Konva는 마우스·터치 이벤트를 pointer 이벤트로 넘겨준다 — 마우스는 왼쪽 버튼만
      const evt = e.evt as MouseEvent | TouchEvent
      if ('button' in evt && evt.button !== 0) return
      evt.preventDefault()
      setActive(ref)
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
      role="img"
      aria-label={`분할 미리보기 — ${pieces.length}조각. 분할선을 드래그해 조각 크기를 조절할 수 있습니다.`}
    >
      {size.width > 0 && size.height > 0 && (
        <Stage width={size.width} height={size.height} onMouseLeave={() => setHover(null)}>
          <Layer imageSmoothingEnabled={zoom < 2} listening={false}>
            <Group x={pos.x} y={pos.y} scaleX={zoom} scaleY={zoom}>
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
    </div>
  )
}
