'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva'
import type Konva from 'konva'
import type { EditorDoc } from '@/lib/toolbox/image-editor/types'
import { ZOOM_STEP } from '@/lib/toolbox/image-editor/constants'
import { centerPosition, clampZoom, fitZoom, zoomAroundPoint } from '@/lib/toolbox/image-editor/view'

export interface EditorCanvasHandle {
  fit: () => void
  zoomIn: () => void
  zoomOut: () => void
  actualSize: () => void
}

interface EditorCanvasProps {
  doc: EditorDoc
  /** 값이 바뀌면 화면 맞춤을 다시 수행(새 이미지 로드 등) */
  fitKey: number
  onZoomChange: (zoom: number) => void
}

interface ViewState {
  zoom: number
  x: number
  y: number
}

/** 투명 영역 표시용 체크무늬 패턴 (8px 칸) */
function createCheckerPattern(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 16, 16)
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(0, 0, 8, 8)
    ctx.fillRect(8, 8, 8, 8)
  }
  return canvas
}

/**
 * 편집 캔버스 뷰. Stage 전체에 줌/이동 변환을 걸어 모든 레이어가 "원본 이미지 좌표"를 공유한다.
 * 레이어: 베이스(체크무늬 + 이미지) / 주석(P4) / 워터마크(P5)
 */
export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(function EditorCanvas(
  { doc, fitKey, onZoomChange },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<ViewState>({ zoom: 1, x: 0, y: 0 })
  const [checker] = useState(createCheckerPattern)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fit = useCallback(() => {
    if (!size.width || !size.height) return
    const zoom = fitZoom(doc.width, doc.height, size.width, size.height)
    setView({ zoom, ...centerPosition(doc.width, doc.height, size.width, size.height, zoom) })
  }, [doc.width, doc.height, size.width, size.height])

  const zoomTo = useCallback(
    (nextZoomRaw: number, anchor?: { x: number; y: number }) => {
      setView((prev) => {
        const nextZoom = clampZoom(nextZoomRaw)
        const point = anchor ?? { x: size.width / 2, y: size.height / 2 }
        return { zoom: nextZoom, ...zoomAroundPoint(prev, prev.zoom, nextZoom, point) }
      })
    },
    [size.width, size.height]
  )

  // 새 이미지·이미지 크기 변경·뷰포트 크기 변경 시 화면 맞춤
  useEffect(() => {
    fit()
  }, [fit, fitKey])

  useEffect(() => {
    onZoomChange(view.zoom)
  }, [view.zoom, onZoomChange])

  useImperativeHandle(
    ref,
    () => ({
      fit,
      zoomIn: () => zoomTo(view.zoom * ZOOM_STEP),
      zoomOut: () => zoomTo(view.zoom / ZOOM_STEP),
      actualSize: () =>
        setView({ zoom: 1, ...centerPosition(doc.width, doc.height, size.width, size.height, 1) }),
    }),
    [fit, zoomTo, view.zoom, doc.width, doc.height, size.width, size.height]
  )

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const pointer = e.target.getStage()?.getPointerPosition()
    // 트랙패드(작은 delta)와 마우스 휠(큰 delta) 모두 자연스럽게 — 지수 배율
    zoomTo(view.zoom * Math.exp(-e.evt.deltaY * 0.0015), pointer ?? undefined)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage()
    if (!stage || e.target !== stage) return
    setView((prev) => ({ ...prev, x: stage.x(), y: stage.y() }))
  }

  return (
    <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing">
      {size.width > 0 && size.height > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          x={view.x}
          y={view.y}
          scaleX={view.zoom}
          scaleY={view.zoom}
          draggable
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
        >
          {/* 확대 시(200% 이상) 픽셀이 뭉개지지 않도록 스무딩 끔 */}
          <Layer listening={false} imageSmoothingEnabled={view.zoom < 2}>
            <Rect
              width={doc.width}
              height={doc.height}
              fillPatternImage={checker as unknown as HTMLImageElement}
              fillPatternScale={{ x: 1 / view.zoom, y: 1 / view.zoom }}
            />
            <KonvaImage image={doc.canvas} width={doc.width} height={doc.height} />
          </Layer>
          {/* P4: 주석 레이어 */}
          <Layer />
          {/* P5: 워터마크 레이어 */}
          <Layer listening={false} />
        </Stage>
      )}
    </div>
  )
})
