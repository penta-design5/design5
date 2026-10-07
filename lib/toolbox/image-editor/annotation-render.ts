import Konva from 'konva'
import { ANNOTATION_FONT_FAMILY, TEXT_FONT_STACKS } from '@/lib/toolbox/common/text-style'
import type { Annotation, BoxAnnotation, StrokeAnnotation, TextAnnotation } from './annotations'
import type { EditorDoc } from './types'

/**
 * 주석 → Konva 속성. 화면(react-konva)과 내보내기(오프스크린 Konva)가 **같은 함수**를 써서 결과가 어긋나지 않게 한다.
 * 브라우저 전용(konva) — 클라이언트 컴포넌트에서만 import.
 */

const TEXT_BACKGROUND_COLOR = { white: '#ffffff', black: '#000000' } as const

const common = (a: Annotation) => ({ x: a.x, y: a.y, rotation: a.rotation, opacity: a.opacity })

export function strokeConfig(a: StrokeAnnotation) {
  return {
    ...common(a),
    points: a.points,
    stroke: a.color,
    strokeWidth: a.strokeWidth,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    tension: a.type === 'pen' || a.type === 'highlighter' ? 0.4 : 0,
    // 형광펜: 곱하기 합성 → 아래 이미지가 비쳐 보임 (베이스 이미지와 같은 레이어여야 함)
    globalCompositeOperation: a.type === 'highlighter' ? ('multiply' as const) : ('source-over' as const),
    strokeScaleEnabled: false,
    ...(a.type === 'arrow'
      ? { fill: a.color, pointerLength: a.strokeWidth * 4, pointerWidth: a.strokeWidth * 4 }
      : {}),
  }
}

export function boxConfig(a: BoxAnnotation) {
  const shape = {
    ...common(a),
    stroke: a.color,
    strokeWidth: a.strokeWidth,
    strokeScaleEnabled: false,
    fill: a.filled ? a.color : undefined,
  }
  return a.type === 'ellipse'
    ? { ...shape, radiusX: a.width / 2, radiusY: a.height / 2 }
    : { ...shape, width: a.width, height: a.height }
}

export function textConfigs(a: TextAnnotation) {
  const hasBackground = a.background !== 'none'
  return {
    label: common(a),
    tag: {
      fill: hasBackground ? TEXT_BACKGROUND_COLOR[a.background as 'white' | 'black'] : undefined,
      cornerRadius: hasBackground ? a.fontSize * 0.15 : 0,
    },
    text: {
      text: a.text,
      fontSize: a.fontSize,
      fontFamily: TEXT_FONT_STACKS[a.font] ?? ANNOTATION_FONT_FAMILY,
      fontStyle: a.bold ? 'bold' : 'normal',
      fill: a.color,
      padding: hasBackground ? a.fontSize * 0.3 : 0,
      lineHeight: 1.25,
    },
  }
}

/** 내보내기·flatten용 Konva 노드 생성 */
export function createAnnotationNode(a: Annotation): Konva.Shape | Konva.Group {
  switch (a.type) {
    case 'arrow':
      return new Konva.Arrow(strokeConfig(a) as Konva.ArrowConfig)
    case 'pen':
    case 'highlighter':
    case 'line':
      return new Konva.Line(strokeConfig(a))
    case 'rect':
      return new Konva.Rect(boxConfig(a))
    case 'ellipse':
      return new Konva.Ellipse(boxConfig(a) as Konva.EllipseConfig)
    case 'text': {
      const configs = textConfigs(a)
      const label = new Konva.Label(configs.label)
      label.add(new Konva.Tag(configs.tag))
      label.add(new Konva.Text(configs.text))
      return label
    }
  }
}

/**
 * 베이스 이미지 + 주석을 원본 해상도 캔버스 하나로 합성.
 * 주석이 없으면 베이스 캔버스를 그대로 반환한다(불변 취급이므로 공유 가능).
 */
export function renderComposite(doc: EditorDoc): HTMLCanvasElement {
  if (doc.annotations.length === 0) return doc.canvas
  const container = document.createElement('div')
  const stage = new Konva.Stage({ container, width: doc.width, height: doc.height })
  try {
    const layer = new Konva.Layer()
    stage.add(layer)
    layer.add(new Konva.Image({ image: doc.canvas, width: doc.width, height: doc.height }))
    for (const annotation of doc.annotations) layer.add(createAnnotationNode(annotation))
    return layer.toCanvas({ x: 0, y: 0, width: doc.width, height: doc.height, pixelRatio: 1 })
  } finally {
    stage.destroy()
  }
}
