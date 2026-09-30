'use client'

import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Image as KonvaImage, Rect, Line, Circle, Text } from 'react-konva'
import { createCheckerPattern } from '@/lib/toolbox/common/canvas'
import { centerPosition, fitZoom } from '@/lib/toolbox/common/view'
import type { Piece } from '@/lib/toolbox/image-splitter/grid'

interface SplitCanvasProps {
  canvas: HTMLCanvasElement
  width: number
  height: number
  pieces: Piece[]
}

const INDIGO = '#4f46e5'
const BADGE_RADIUS = 15

/**
 * 분할 미리보기 — 이미지를 화면에 맞춰 그리고 분할선·조각 번호를 겹쳐 표시(저장 결과에는 포함되지 않음).
 * 이미지는 원본 좌표 Group(배율 적용), 분할선·번호는 화면 좌표 레이어에 그려 두께·크기가 배율과 무관하게 일정하다.
 */
export function SplitCanvas({ canvas, width, height, pieces }: SplitCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [checker] = useState(createCheckerPattern)

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

  // 내부 분할선 = 조각 경계 중 이미지 가장자리가 아닌 것
  const xEdges = [...new Set(pieces.map((p) => p.x))].filter((x) => x > 0)
  const yEdges = [...new Set(pieces.map((p) => p.y))].filter((y) => y > 0)

  return (
    <div ref={containerRef} className="absolute inset-0" role="img" aria-label={`분할 미리보기 — ${pieces.length}조각`}>
      {size.width > 0 && size.height > 0 && (
        <Stage width={size.width} height={size.height} listening={false}>
          <Layer imageSmoothingEnabled={zoom < 2}>
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
            <Rect x={sx(0)} y={sy(0)} width={width * zoom} height={height * zoom} stroke={INDIGO} strokeWidth={1} opacity={0.5} />
            {xEdges.map((x) => (
              <Group key={`x${x}`}>
                <Line points={[sx(x), sy(0), sx(x), sy(height)]} stroke="rgba(255,255,255,0.9)" strokeWidth={3} />
                <Line points={[sx(x), sy(0), sx(x), sy(height)]} stroke={INDIGO} strokeWidth={1} opacity={0.6} />
              </Group>
            ))}
            {yEdges.map((y) => (
              <Group key={`y${y}`}>
                <Line points={[sx(0), sy(y), sx(width), sy(y)]} stroke="rgba(255,255,255,0.9)" strokeWidth={3} />
                <Line points={[sx(0), sy(y), sx(width), sy(y)]} stroke={INDIGO} strokeWidth={1} opacity={0.6} />
              </Group>
            ))}
            {pieces.map((p) => {
              // 조각이 화면에서 작으면 배지도 작게
              const r = Math.max(7, Math.min(BADGE_RADIUS, (Math.min(p.width, p.height) * zoom) / 3))
              return (
                <Group key={p.index} x={sx(p.x + p.width / 2)} y={sy(p.y + p.height / 2)} name="piece-badge">
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
          </Layer>
        </Stage>
      )}
    </div>
  )
}
