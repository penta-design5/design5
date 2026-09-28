'use client'

import { Arrow, Ellipse, Label, Line, Rect, Tag, Text } from 'react-konva'
import type Konva from 'konva'
import type { Annotation } from '@/lib/toolbox/image-editor/annotations'
import { boxConfig, strokeConfig, textConfigs } from '@/lib/toolbox/image-editor/annotation-render'

export interface AnnotationShapeEvents {
  draggable?: boolean
  listening?: boolean
  visible?: boolean
  /** 선택하기 쉽도록 넓힌 히트 영역(원본 px) */
  hitStrokeWidth?: number
  onPointerDown?: (e: Konva.KonvaEventObject<PointerEvent>) => void
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void
  onDblClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDblTap?: (e: Konva.KonvaEventObject<TouchEvent>) => void
}

/**
 * 주석 1개 렌더링 — 속성은 내보내기와 같은 `annotation-render.ts` 함수에서 가져온다.
 * Konva 노드 id = 주석 id (Transformer 연결용), name = 'annotation'.
 */
export function AnnotationShape({ annotation: a, hitStrokeWidth, ...events }: { annotation: Annotation } & AnnotationShapeEvents) {
  const node = { id: a.id, name: 'annotation', ...events }

  switch (a.type) {
    case 'arrow':
      return <Arrow {...(strokeConfig(a) as Konva.ArrowConfig)} {...node} hitStrokeWidth={Math.max(a.strokeWidth, hitStrokeWidth ?? 0)} />
    case 'pen':
    case 'highlighter':
    case 'line':
      return <Line {...strokeConfig(a)} {...node} hitStrokeWidth={Math.max(a.strokeWidth, hitStrokeWidth ?? 0)} />
    case 'rect':
      return <Rect {...boxConfig(a)} {...node} hitStrokeWidth={Math.max(a.strokeWidth, hitStrokeWidth ?? 0)} />
    case 'ellipse':
      return <Ellipse {...(boxConfig(a) as Konva.EllipseConfig)} {...node} hitStrokeWidth={Math.max(a.strokeWidth, hitStrokeWidth ?? 0)} />
    case 'text': {
      const configs = textConfigs(a)
      return (
        <Label {...configs.label} {...node}>
          <Tag {...configs.tag} />
          <Text {...configs.text} />
        </Label>
      )
    }
  }
}
