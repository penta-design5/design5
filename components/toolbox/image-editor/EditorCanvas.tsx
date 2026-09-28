'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer, Group, Image as KonvaImage, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { cn } from '@/lib/utils'
import type { EditorDoc } from '@/lib/toolbox/image-editor/types'
import { ZOOM_STEP } from '@/lib/toolbox/image-editor/constants'
import { centerPosition, clampZoom, fitZoom, zoomAroundPoint } from '@/lib/toolbox/image-editor/view'
import { rotatedBounds } from '@/lib/toolbox/image-editor/transform'
import type { CropRect } from '@/lib/toolbox/image-editor/crop'
import {
  HIGHLIGHTER_WIDTH_FACTOR,
  bakeScale,
  boxFromDrag,
  createAnnotationId,
  isNegligible,
  snapLineEnd,
  type Annotation,
  type DrawStyle,
  type EditorTool,
  type Point,
  type TextAnnotation,
  type TextFont,
} from '@/lib/toolbox/image-editor/annotations'
import { TEXT_FONT_STACKS } from '@/lib/toolbox/image-editor/annotation-render'
import { AnnotationShape } from './AnnotationShape'
import { CropOverlay } from './CropOverlay'

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
  /** 자유 회전 미리보기(적용 전). angle 0이면 표시 안 함. fill null = 투명 */
  rotationPreview?: { angle: number; fill: string | null }
  /** 자르기 모드 — 지정 시 자르기 상자 표시, 주석 조작 비활성 */
  crop?: { rect: CropRect; ratio: number | null; onChange: (rect: CropRect) => void } | null
  tool: EditorTool
  drawStyle: DrawStyle
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAddAnnotation: (annotation: Annotation) => void
  onUpdateAnnotation: (annotation: Annotation) => void
  onRemoveAnnotation: (id: string) => void
}

interface ViewState {
  zoom: number
  x: number
  y: number
}

/** 텍스트 입력 중 상태 (id가 null이면 새 텍스트) */
interface TextEditState {
  id: string | null
  x: number
  y: number
  text: string
  fontSize: number
  font: TextFont
  color: string
  bold: boolean
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

const TEXT_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
const ALL_ANCHORS = ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']
/** 화면상 선택 히트 영역 최소 폭(px) */
const HIT_SCREEN_PX = 12

/**
 * 편집 캔버스 뷰. Stage 전체에 줌/이동 변환을 걸어 모든 노드가 "원본 이미지 좌표"를 공유한다.
 * 콘텐츠 레이어 = 베이스 이미지 + 주석(형광펜 multiply가 이미지와 섞이도록 같은 레이어) + Transformer.
 * 그 위에 자르기 레이어, 워터마크 레이어(P5).
 */
export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(function EditorCanvas(
  {
    doc,
    fitKey,
    onZoomChange,
    rotationPreview,
    crop,
    tool,
    drawStyle,
    selectedId,
    onSelect,
    onAddAnnotation,
    onUpdateAnnotation,
    onRemoveAnnotation,
  },
  ref
) {
  const previewAngle = crop ? 0 : (rotationPreview?.angle ?? 0)
  const previewBounds = previewAngle !== 0 ? rotatedBounds(doc.width, doc.height, previewAngle) : null
  const interactive = !crop && previewAngle === 0
  const drawing = interactive && tool !== 'select'

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<Konva.Group>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<ViewState>({ zoom: 1, x: 0, y: 0 })
  const [checker] = useState(createCheckerPattern)
  const [draft, setDraft] = useState<Annotation | null>(null)
  const dragStart = useRef<Point | null>(null)
  const [textEdit, setTextEditState] = useState<TextEditState | null>(null)
  // 캔버스 클릭과 입력창 blur가 연달아 확정을 호출해도 한 번만 처리되도록 최신 값을 ref로 보관
  const textEditRef = useRef<TextEditState | null>(null)
  const setTextEdit = (next: TextEditState | null) => {
    textEditRef.current = next
    setTextEditState(next)
  }

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

  // ---------- 선택(Transformer) ----------
  const selected = interactive && tool === 'select' ? doc.annotations.find((a) => a.id === selectedId) ?? null : null
  const editingId = textEdit?.id ?? null

  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return
    const node = selected && selected.id !== editingId ? contentRef.current?.findOne(`#${selected.id}`) : null
    transformer.nodes(node ? [node] : [])
    transformer.getLayer()?.batchDraw()
  }, [selected, editingId, doc.annotations])

  // ---------- 텍스트 입력 ----------
  const openTextEditor = (state: TextEditState) => {
    onSelect(null)
    setTextEdit(state)
  }

  const commitTextEdit = (cancel = false) => {
    const edit = textEditRef.current
    setTextEdit(null)
    if (!edit || cancel) return
    const text = edit.text.replace(/\s+$/, '')
    const existing = edit.id ? doc.annotations.find((a) => a.id === edit.id) : null
    if (existing && existing.type === 'text') {
      if (text.trim() === '') onRemoveAnnotation(existing.id)
      else if (text !== existing.text) onUpdateAnnotation({ ...existing, text })
      return
    }
    if (text.trim() === '') return
    const annotation: TextAnnotation = {
      id: createAnnotationId(),
      type: 'text',
      x: edit.x,
      y: edit.y,
      rotation: 0,
      opacity: drawStyle.opacity,
      color: drawStyle.color,
      text,
      fontSize: drawStyle.fontSize,
      font: drawStyle.textFont,
      bold: drawStyle.bold,
      background: drawStyle.textBackground,
    }
    onAddAnnotation(annotation)
  }

  // 자르기·회전 미리보기로 전환되면 입력 중인 텍스트는 확정
  useEffect(() => {
    if (!interactive && textEdit) commitTextEdit()
    // commitTextEdit은 매 렌더 새로 만들어지므로 상태 전환에만 반응
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive])

  // ---------- 그리기 ----------
  const pointerInImage = (): Point | null => contentRef.current?.getRelativePointerPosition() ?? null

  const buildDraft = (start: Point, current: Point, shift: boolean): Annotation | null => {
    const base = { id: 'draft', x: start.x, y: start.y, rotation: 0, opacity: drawStyle.opacity, color: drawStyle.color }
    switch (tool) {
      case 'line':
      case 'arrow': {
        const end = shift ? snapLineEnd(start, current) : current
        return { ...base, type: tool, points: [0, 0, end.x - start.x, end.y - start.y], strokeWidth: drawStyle.strokeWidth }
      }
      case 'rect':
      case 'ellipse': {
        const box = boxFromDrag(start, current, shift)
        const position = tool === 'ellipse' ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : { x: box.x, y: box.y }
        return { ...base, ...position, type: tool, width: box.width, height: box.height, strokeWidth: drawStyle.strokeWidth, filled: drawStyle.filled }
      }
      default:
        return null
    }
  }

  const handlePointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (e.evt.button !== undefined && e.evt.button !== 0) return
    if (textEditRef.current) {
      commitTextEdit()
      return
    }
    if (!interactive) return

    if (tool === 'select') {
      // 빈 곳(스테이지) 클릭 → 선택 해제 (드래그하면 화면 이동)
      if (e.target === e.target.getStage()) onSelect(null)
      return
    }

    const point = pointerInImage()
    if (!point) return

    if (tool === 'text') {
      const target = e.target.findAncestor('.annotation', true) ?? (e.target.hasName('annotation') ? e.target : null)
      const hit = target ? doc.annotations.find((a) => a.id === target.id()) : null
      if (hit && hit.type === 'text') {
        openTextEditor({ id: hit.id, x: hit.x, y: hit.y, text: hit.text, fontSize: hit.fontSize, font: hit.font, color: hit.color, bold: hit.bold })
      } else {
        openTextEditor({ id: null, x: point.x, y: point.y, text: '', fontSize: drawStyle.fontSize, font: drawStyle.textFont, color: drawStyle.color, bold: drawStyle.bold })
      }
      e.evt.preventDefault()
      return
    }

    dragStart.current = point
    if (tool === 'pen' || tool === 'highlighter') {
      setDraft({
        id: 'draft',
        type: tool,
        x: point.x,
        y: point.y,
        rotation: 0,
        opacity: drawStyle.opacity,
        color: drawStyle.color,
        points: [0, 0],
        strokeWidth: tool === 'highlighter' ? drawStyle.strokeWidth * HIGHLIGHTER_WIDTH_FACTOR : drawStyle.strokeWidth,
      })
    } else {
      setDraft(buildDraft(point, point, e.evt.shiftKey))
    }
  }

  const handlePointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
    const start = dragStart.current
    if (!start || !draft) return
    const point = pointerInImage()
    if (!point) return
    if (draft.type === 'pen' || draft.type === 'highlighter') {
      const px = point.x - start.x
      const py = point.y - start.y
      const lx = draft.points[draft.points.length - 2]
      const ly = draft.points[draft.points.length - 1]
      // 화면상 1px 미만 이동은 점을 추가하지 않음(점 폭증 방지)
      if (Math.hypot(px - lx, py - ly) * view.zoom < 1) return
      setDraft({ ...draft, points: [...draft.points, px, py] })
    } else {
      setDraft(buildDraft(start, point, e.evt.shiftKey))
    }
  }

  const finishDrawing = useCallback(() => {
    const current = draft
    dragStart.current = null
    setDraft(null)
    if (current && !isNegligible(current)) onAddAnnotation({ ...current, id: createAnnotationId() })
  }, [draft, onAddAnnotation])

  // 캔버스 밖에서 버튼을 놓아도 그리기를 끝낸다
  useEffect(() => {
    if (!draft) return
    window.addEventListener('pointerup', finishDrawing)
    return () => window.removeEventListener('pointerup', finishDrawing)
  }, [draft, finishDrawing])

  // ---------- 이동·변형 결과 반영 ----------
  const handleAnnotationDragEnd = (annotation: Annotation) => (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true // 스테이지 팬 처리로 번지지 않게
    onUpdateAnnotation({ ...annotation, x: e.target.x(), y: e.target.y() })
  }

  const handleAnnotationTransformEnd = (annotation: Annotation) => (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scale({ x: 1, y: 1 })
    onUpdateAnnotation(bakeScale({ ...annotation, x: node.x(), y: node.y(), rotation: node.rotation() }, scaleX, scaleY))
  }

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

  const hitStrokeWidth = HIT_SCREEN_PX / view.zoom
  const annotationsListening = interactive && (tool === 'select' || tool === 'text')

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 touch-none',
        drawing ? (tool === 'text' ? 'cursor-text' : 'cursor-crosshair') : 'cursor-grab active:cursor-grabbing'
      )}
    >
      {size.width > 0 && size.height > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          x={view.x}
          y={view.y}
          scaleX={view.zoom}
          scaleY={view.zoom}
          draggable={!drawing && !draft}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {/* 확대 시(200% 이상) 픽셀이 뭉개지지 않도록 스무딩 끔 */}
          <Layer imageSmoothingEnabled={view.zoom < 2 || previewAngle !== 0}>
            {previewBounds && (
              // 자유 회전 미리보기: 결과 캔버스(bounding box) 영역
              <Rect
                listening={false}
                x={(doc.width - previewBounds.width) / 2}
                y={(doc.height - previewBounds.height) / 2}
                width={previewBounds.width}
                height={previewBounds.height}
                {...(rotationPreview?.fill
                  ? { fill: rotationPreview.fill }
                  : {
                      fillPatternImage: checker as unknown as HTMLImageElement,
                      fillPatternScale: { x: 1 / view.zoom, y: 1 / view.zoom },
                    })}
              />
            )}
            {/* 이미지 + 주석 — 회전 미리보기 시 중심 기준으로 함께 회전 */}
            <Group
              ref={contentRef}
              x={doc.width / 2}
              y={doc.height / 2}
              offsetX={doc.width / 2}
              offsetY={doc.height / 2}
              rotation={previewAngle}
            >
              {!previewBounds && (
                <Rect
                  listening={false}
                  width={doc.width}
                  height={doc.height}
                  fillPatternImage={checker as unknown as HTMLImageElement}
                  fillPatternScale={{ x: 1 / view.zoom, y: 1 / view.zoom }}
                />
              )}
              <KonvaImage listening={false} image={doc.canvas} width={doc.width} height={doc.height} />
              {doc.annotations.map((annotation) => (
                <AnnotationShape
                  key={annotation.id}
                  annotation={annotation}
                  listening={annotationsListening}
                  draggable={interactive && tool === 'select'}
                  visible={annotation.id !== editingId}
                  hitStrokeWidth={hitStrokeWidth}
                  onPointerDown={(e) => {
                    if (tool !== 'select') return
                    e.cancelBubble = true
                    onSelect(annotation.id)
                  }}
                  onDragEnd={handleAnnotationDragEnd(annotation)}
                  onTransformEnd={handleAnnotationTransformEnd(annotation)}
                  onDblClick={() => {
                    if (annotation.type === 'text' && tool === 'select') {
                      openTextEditor({ id: annotation.id, x: annotation.x, y: annotation.y, text: annotation.text, fontSize: annotation.fontSize, font: annotation.font, color: annotation.color, bold: annotation.bold })
                    }
                  }}
                  onDblTap={() => {
                    if (annotation.type === 'text' && tool === 'select') {
                      openTextEditor({ id: annotation.id, x: annotation.x, y: annotation.y, text: annotation.text, fontSize: annotation.fontSize, font: annotation.font, color: annotation.color, bold: annotation.bold })
                    }
                  }}
                />
              ))}
              {draft && <AnnotationShape annotation={draft} listening={false} />}
            </Group>
            <Transformer
              ref={transformerRef}
              flipEnabled={false}
              rotateEnabled
              ignoreStroke
              keepRatio={selected?.type === 'text'}
              enabledAnchors={selected?.type === 'text' ? TEXT_ANCHORS : ALL_ANCHORS}
              borderStroke="#4f46e5"
              anchorStroke="#4f46e5"
              anchorFill="#ffffff"
              anchorSize={9}
              anchorCornerRadius={2}
              boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 4 || Math.abs(newBox.height) < 4 ? oldBox : newBox)}
            />
          </Layer>
          {crop && <CropOverlay size={doc} rect={crop.rect} ratio={crop.ratio} zoom={view.zoom} onChange={crop.onChange} />}
          {/* P5: 워터마크 레이어 */}
          <Layer listening={false} />
        </Stage>
      )}

      {textEdit && (
        <textarea
          aria-label="텍스트 입력"
          autoFocus
          value={textEdit.text}
          placeholder="텍스트 입력"
          onChange={(e) => setTextEdit({ ...textEdit, text: e.target.value })}
          onBlur={() => commitTextEdit()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              commitTextEdit(true)
            } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              commitTextEdit()
            }
          }}
          rows={Math.max(1, textEdit.text.split('\n').length)}
          className="absolute z-10 resize-none overflow-hidden whitespace-pre border border-dashed border-[var(--penta-indigo)] bg-white/40 p-0 outline-none"
          style={{
            left: view.x + textEdit.x * view.zoom,
            top: view.y + textEdit.y * view.zoom,
            fontSize: textEdit.fontSize * view.zoom,
            lineHeight: 1.25,
            fontFamily: TEXT_FONT_STACKS[textEdit.font],
            fontWeight: textEdit.bold ? 700 : 400,
            color: textEdit.color,
            minWidth: Math.max(40, textEdit.fontSize * view.zoom * 4),
            // 한글은 글자 폭이 약 1em이라 em 기준으로 넉넉히 (배경이 투명해 넓어도 무방)
            width: `${Math.max(2, ...textEdit.text.split('\n').map((l) => l.length + 1))}em`,
          }}
        />
      )}
    </div>
  )
})
