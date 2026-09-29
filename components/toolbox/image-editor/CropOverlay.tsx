'use client'

import { useEffect, useRef } from 'react'
import { Layer, Line, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { clampCropRect, setCropField, type CropRect } from '@/lib/toolbox/image-editor/crop'
import type { Size } from '@/lib/toolbox/image-editor/transform'

interface CropOverlayProps {
  size: Size
  rect: CropRect
  /** 고정 비율(가로/세로). null이면 자유 */
  ratio: number | null
  zoom: number
  onChange: (rect: CropRect) => void
  /** 터치 기기(pointer: coarse) — 핸들을 손가락으로 잡기 쉽게 키움 */
  coarse?: boolean
}

type TransformerBox = Parameters<NonNullable<Konva.TransformerConfig['boundBoxFunc']>>[0]

const SHADE = 'rgba(0, 0, 0, 0.5)'
const GUIDE = 'rgba(255, 255, 255, 0.7)'
const ALL_ANCHORS = ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']
const CORNER_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
/** 화면상 최소 크기(px) — 핸들이 겹쳐 조작할 수 없게 되는 것 방지 (터치는 핸들이 커서 더 크게) */
const MIN_SCREEN_SIZE = 8
const MIN_SCREEN_SIZE_COARSE = 48

/**
 * 자르기 상자 (Stage 좌표 = 원본 이미지 px 좌표).
 * 바깥 어둡게 + 삼분할 가이드 + 이동/8방향 크기 조절(비율 고정 시 모서리 4개만).
 */
export function CropOverlay({ size, rect, ratio, zoom, onChange, coarse = false }: CropOverlayProps) {
  const minScreenSize = coarse ? MIN_SCREEN_SIZE_COARSE : MIN_SCREEN_SIZE
  const rectRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (!rectRef.current || !transformerRef.current) return
    transformerRef.current.nodes([rectRef.current])
    transformerRef.current.getLayer()?.batchDraw()
  }, [])

  const right = rect.x + rect.width
  const bottom = rect.y + rect.height
  const strokeWidth = 1 / zoom

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const next = clampCropRect({ x: node.x(), y: node.y(), width: rect.width, height: rect.height }, size)
    node.position({ x: next.x, y: next.y })
    onChange(next)
  }

  const readTransformed = (): CropRect | null => {
    const node = rectRef.current
    if (!node) return null
    const width = node.width() * node.scaleX()
    const height = node.height() * node.scaleY()
    node.scale({ x: 1, y: 1 })
    const next = clampCropRect({ x: node.x(), y: node.y(), width, height }, size)
    node.setAttrs(next)
    return next
  }

  const handleTransform = () => {
    const next = readTransformed()
    if (next) onChange(next)
  }

  const handleTransformEnd = () => {
    const next = readTransformed()
    if (!next) return
    // 반올림으로 생긴 비율 오차 보정
    onChange(ratio === null ? next : setCropField(next, 'width', next.width, ratio, size))
  }

  /** 이미지 경계를 넘거나 너무 작아지는 변형은 무시 (절대 좌표 기준) */
  const boundBoxFunc = (oldBox: TransformerBox, newBox: TransformerBox) => {
    const layer = transformerRef.current?.getLayer()
    if (!layer) return newBox
    const transform = layer.getAbsoluteTransform()
    const topLeft = transform.point({ x: 0, y: 0 })
    const bottomRight = transform.point({ x: size.width, y: size.height })
    const tolerance = 0.5
    if (
      newBox.width < minScreenSize ||
      newBox.height < minScreenSize ||
      newBox.x < topLeft.x - tolerance ||
      newBox.y < topLeft.y - tolerance ||
      newBox.x + newBox.width > bottomRight.x + tolerance ||
      newBox.y + newBox.height > bottomRight.y + tolerance
    ) {
      return oldBox
    }
    return newBox
  }

  const setCursor = (e: Konva.KonvaEventObject<MouseEvent>, cursor: string) => {
    const container = e.target.getStage()?.container()
    if (container) container.style.cursor = cursor
  }

  return (
    <Layer>
      {/* 바깥 어둡게 (상·하·좌·우) */}
      <Rect listening={false} x={0} y={0} width={size.width} height={rect.y} fill={SHADE} />
      <Rect listening={false} x={0} y={bottom} width={size.width} height={size.height - bottom} fill={SHADE} />
      <Rect listening={false} x={0} y={rect.y} width={rect.x} height={rect.height} fill={SHADE} />
      <Rect listening={false} x={right} y={rect.y} width={size.width - right} height={rect.height} fill={SHADE} />

      {/* 삼분할 가이드 */}
      {[1, 2].map((i) => (
        <Line
          key={`v${i}`}
          listening={false}
          points={[rect.x + (rect.width * i) / 3, rect.y, rect.x + (rect.width * i) / 3, bottom]}
          stroke={GUIDE}
          strokeWidth={strokeWidth}
        />
      ))}
      {[1, 2].map((i) => (
        <Line
          key={`h${i}`}
          listening={false}
          points={[rect.x, rect.y + (rect.height * i) / 3, right, rect.y + (rect.height * i) / 3]}
          stroke={GUIDE}
          strokeWidth={strokeWidth}
        />
      ))}

      <Rect
        ref={rectRef}
        name="crop-box"
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill="rgba(0,0,0,0)"
        draggable
        onDragMove={handleDragMove}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={(e) => setCursor(e, 'move')}
        onMouseLeave={(e) => setCursor(e, '')}
      />
      <Transformer
        ref={transformerRef}
        rotateEnabled={false}
        flipEnabled={false}
        keepRatio={ratio !== null}
        enabledAnchors={ratio !== null ? CORNER_ANCHORS : ALL_ANCHORS}
        boundBoxFunc={boundBoxFunc}
        borderStroke="#ffffff"
        borderStrokeWidth={1.5}
        anchorSize={coarse ? 22 : 10}
        anchorStroke="#4f46e5"
        anchorFill="#ffffff"
        anchorCornerRadius={2}
        ignoreStroke
      />
    </Layer>
  )
}
