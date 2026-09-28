/**
 * 주석(그리기·도형·텍스트) 데이터 모델 — Konva 노드가 아닌 직렬화 가능한 순수 데이터.
 * 히스토리 스냅샷(EditorDoc)에 배열로 들어가며, 편집은 항상 새 배열/객체로 교체한다(불변).
 * 좌표·굵기·글자 크기는 모두 **원본 이미지 px** 기준(화면 줌과 무관).
 * 렌더링(화면·내보내기 공용 속성)은 `annotation-render.ts`.
 */

export type DrawTool = 'pen' | 'highlighter' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'text'
export type EditorTool = 'select' | DrawTool

export type TextBackground = 'none' | 'white' | 'black'

/** 텍스트 글꼴 — PC에 설치된 한글 시스템 글꼴 사용(스택: annotation-render.ts `TEXT_FONT_STACKS`) */
export type TextFont = 'gothic' | 'myeongjo' | 'gulim' | 'gungseo'

export const TEXT_FONTS: { value: TextFont; label: string }[] = [
  { value: 'gothic', label: '고딕' },
  { value: 'myeongjo', label: '명조' },
  { value: 'gulim', label: '굴림' },
  { value: 'gungseo', label: '궁서' },
]

interface AnnotationBase {
  id: string
  x: number
  y: number
  rotation: number
  /** 0~1 */
  opacity: number
  color: string
}

/** 펜·형광펜·직선·화살표 — points는 (x, y) 기준 상대 좌표 [x1, y1, x2, y2, ...] */
export interface StrokeAnnotation extends AnnotationBase {
  type: 'pen' | 'highlighter' | 'line' | 'arrow'
  points: number[]
  strokeWidth: number
}

/** 사각형: (x, y) = 좌상단 / 원: (x, y) = 중심. width·height는 전체 크기(원은 지름) */
export interface BoxAnnotation extends AnnotationBase {
  type: 'rect' | 'ellipse'
  width: number
  height: number
  strokeWidth: number
  filled: boolean
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text'
  text: string
  fontSize: number
  font: TextFont
  bold: boolean
  background: TextBackground
}

export type Annotation = StrokeAnnotation | BoxAnnotation | TextAnnotation

/** 새 주석에 쓰는 스타일 (패널 설정). 형광펜 실제 굵기 = strokeWidth × HIGHLIGHTER_WIDTH_FACTOR */
export interface DrawStyle {
  color: string
  strokeWidth: number
  opacity: number
  filled: boolean
  fontSize: number
  textFont: TextFont
  bold: boolean
  textBackground: TextBackground
}

export const HIGHLIGHTER_WIDTH_FACTOR = 4

export const COLOR_PRESETS = ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff']

export const TOOL_LABELS: Record<EditorTool, string> = {
  select: '선택',
  pen: '펜',
  highlighter: '형광펜',
  line: '직선',
  arrow: '화살표',
  rect: '사각형',
  ellipse: '원',
  text: '텍스트',
}

/** 도구 단축키 (수정 키 없이, 입력창 밖에서) */
export const TOOL_SHORTCUTS: Record<string, EditorTool> = {
  v: 'select',
  p: 'pen',
  h: 'highlighter',
  l: 'line',
  a: 'arrow',
  r: 'rect',
  o: 'ellipse',
  t: 'text',
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** 이미지 크기에 맞춘 기본 스타일 — 작은 이미지엔 가는 선, 큰 이미지엔 굵은 선 */
export function defaultDrawStyle(width: number, height: number): DrawStyle {
  const longSide = Math.max(width, height)
  return {
    color: COLOR_PRESETS[0],
    strokeWidth: clamp(Math.round(longSide / 250), 2, 40),
    opacity: 1,
    filled: false,
    fontSize: clamp(Math.round(longSide / 25), 12, 200),
    textFont: 'gothic',
    bold: true,
    textBackground: 'none',
  }
}

let idCounter = 0
export function createAnnotationId(): string {
  idCounter += 1
  return `a${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// ---------- 드래그 → 도형 기하 ----------

export interface Point {
  x: number
  y: number
}

/** Shift: 선 끝점을 45° 단위로 스냅 (길이 유지) */
export function snapLineEnd(start: Point, end: Point): Point {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length === 0) return end
  const step = Math.PI / 4
  const angle = Math.round(Math.atan2(dy, dx) / step) * step
  const round = (v: number) => (Math.abs(v) < 1e-9 ? 0 : v)
  return { x: start.x + round(Math.cos(angle) * length), y: start.y + round(Math.sin(angle) * length) }
}

/** 드래그 시작·끝 → 정규화된 상자(좌상단 + 양수 크기). square면 짧은 변 기준 정사각형(드래그 방향 유지) */
export function boxFromDrag(start: Point, end: Point, square: boolean) {
  let dx = end.x - start.x
  let dy = end.y - start.y
  if (square) {
    const side = Math.min(Math.abs(dx), Math.abs(dy))
    dx = Math.sign(dx || 1) * side
    dy = Math.sign(dy || 1) * side
  }
  return {
    x: Math.min(start.x, start.x + dx),
    y: Math.min(start.y, start.y + dy),
    width: Math.abs(dx),
    height: Math.abs(dy),
  }
}

/** 너무 작은(사실상 클릭만 한) 도형인지 */
export function isNegligible(annotation: Annotation, minSize = 2): boolean {
  if (annotation.type === 'text') return annotation.text.trim() === ''
  if (!('points' in annotation)) return annotation.width < minSize && annotation.height < minSize
  const xs = annotation.points.filter((_, i) => i % 2 === 0)
  const ys = annotation.points.filter((_, i) => i % 2 === 1)
  return Math.max(...xs) - Math.min(...xs) < minSize && Math.max(...ys) - Math.min(...ys) < minSize
}

// ---------- 변형(Transformer) 결과를 데이터에 반영 ----------

/** Transformer의 scale을 데이터 크기에 굽는다(선 굵기는 유지). */
export function bakeScale<T extends Annotation>(annotation: T, scaleX: number, scaleY: number): T {
  switch (annotation.type) {
    case 'rect':
    case 'ellipse':
      return {
        ...annotation,
        width: Math.max(1, annotation.width * Math.abs(scaleX)),
        height: Math.max(1, annotation.height * Math.abs(scaleY)),
      }
    case 'text':
      return { ...annotation, fontSize: Math.max(4, annotation.fontSize * Math.abs(scaleY)) }
    default:
      return {
        ...annotation,
        points: annotation.points.map((v, i) => v * (i % 2 === 0 ? scaleX : scaleY)),
      }
  }
}

// ---------- 스타일 ↔ 주석 ----------

/** 선택한 주석의 스타일을 패널 값으로 (패널 기본값과 병합) */
export function styleFromAnnotation(annotation: Annotation, base: DrawStyle): DrawStyle {
  const style: DrawStyle = { ...base, color: annotation.color, opacity: annotation.opacity }
  if (annotation.type === 'text') {
    return {
      ...style,
      fontSize: annotation.fontSize,
      textFont: annotation.font,
      bold: annotation.bold,
      textBackground: annotation.background,
    }
  }
  if (annotation.type === 'rect' || annotation.type === 'ellipse') {
    return { ...style, strokeWidth: annotation.strokeWidth, filled: annotation.filled }
  }
  const width =
    annotation.type === 'highlighter' ? annotation.strokeWidth / HIGHLIGHTER_WIDTH_FACTOR : annotation.strokeWidth
  return { ...style, strokeWidth: Math.round(width * 10) / 10 }
}

/** 패널에서 바뀐 스타일 일부를 주석에 적용 (해당 없는 속성은 무시) */
export function applyStyle(annotation: Annotation, patch: Partial<DrawStyle>): Annotation {
  const next = { ...annotation } as Annotation
  if (patch.color !== undefined) next.color = patch.color
  if (patch.opacity !== undefined) next.opacity = patch.opacity
  if (next.type === 'text') {
    if (patch.fontSize !== undefined) next.fontSize = patch.fontSize
    if (patch.textFont !== undefined) next.font = patch.textFont
    if (patch.bold !== undefined) next.bold = patch.bold
    if (patch.textBackground !== undefined) next.background = patch.textBackground
  } else if (next.type === 'rect' || next.type === 'ellipse') {
    if (patch.strokeWidth !== undefined) next.strokeWidth = patch.strokeWidth
    if (patch.filled !== undefined) next.filled = patch.filled
  } else if (patch.strokeWidth !== undefined) {
    next.strokeWidth = next.type === 'highlighter' ? patch.strokeWidth * HIGHLIGHTER_WIDTH_FACTOR : patch.strokeWidth
  }
  return next
}

// ---------- 목록 조작 (불변) ----------

export const updateAnnotation = (list: Annotation[], id: string, update: (a: Annotation) => Annotation) =>
  list.map((a) => (a.id === id ? update(a) : a))

export const removeAnnotation = (list: Annotation[], id: string) => list.filter((a) => a.id !== id)

/** 한 칸 앞으로(+1) / 뒤로(-1). 끝이면 그대로 */
export function reorderAnnotation(list: Annotation[], id: string, direction: 1 | -1): Annotation[] {
  const index = list.findIndex((a) => a.id === id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/** 복제본 (살짝 어긋난 위치, 새 id) */
export function duplicateAnnotation(annotation: Annotation, offset: number): Annotation {
  return { ...annotation, id: createAnnotationId(), x: annotation.x + offset, y: annotation.y + offset }
}
