import { describe, expect, it } from 'vitest'
import {
  HIGHLIGHTER_WIDTH_FACTOR,
  applyStyle,
  bakeScale,
  boxFromDrag,
  createAnnotationId,
  defaultDrawStyle,
  duplicateAnnotation,
  isNegligible,
  removeAnnotation,
  reorderAnnotation,
  snapLineEnd,
  styleFromAnnotation,
  updateAnnotation,
  type Annotation,
  type BoxAnnotation,
  type StrokeAnnotation,
  type TextAnnotation,
} from './annotations'

const base = { rotation: 0, opacity: 1, color: '#ff0000' }
const line: StrokeAnnotation = { ...base, id: 'l', type: 'line', x: 10, y: 10, points: [0, 0, 100, 50], strokeWidth: 4 }
const hl: StrokeAnnotation = { ...base, id: 'h', type: 'highlighter', x: 0, y: 0, points: [0, 0, 10, 0], strokeWidth: 16 }
const rect: BoxAnnotation = { ...base, id: 'r', type: 'rect', x: 5, y: 5, width: 40, height: 20, strokeWidth: 3, filled: false }
const text: TextAnnotation = { ...base, id: 't', type: 'text', x: 0, y: 0, text: '안녕', fontSize: 30, font: 'gothic', bold: true, background: 'none' }

describe('defaultDrawStyle', () => {
  it('이미지 크기에 비례, 범위 제한', () => {
    expect(defaultDrawStyle(1000, 800).strokeWidth).toBe(4)
    expect(defaultDrawStyle(1000, 800).fontSize).toBe(40)
    expect(defaultDrawStyle(100, 100).strokeWidth).toBe(2)
    expect(defaultDrawStyle(100, 100).fontSize).toBe(12)
    expect(defaultDrawStyle(20000, 100).strokeWidth).toBe(40)
  })
})

describe('createAnnotationId', () => {
  it('중복 없음', () => {
    const ids = new Set(Array.from({ length: 500 }, createAnnotationId))
    expect(ids.size).toBe(500)
  })
})

describe('snapLineEnd', () => {
  const s = { x: 0, y: 0 }
  it('가까운 45° 방향으로, 길이 유지', () => {
    expect(snapLineEnd(s, { x: 100, y: 10 })).toEqual({ x: Math.hypot(100, 10), y: 0 })
    const d = snapLineEnd(s, { x: 100, y: 90 })
    expect(d.x).toBeCloseTo(d.y)
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(Math.hypot(100, 90))
    expect(snapLineEnd(s, { x: -5, y: 100 })).toEqual({ x: 0, y: Math.hypot(5, 100) })
    expect(snapLineEnd(s, s)).toEqual(s)
  })
})

describe('boxFromDrag', () => {
  it('어느 방향으로 끌어도 정규화', () => {
    expect(boxFromDrag({ x: 50, y: 50 }, { x: 10, y: 80 }, false)).toEqual({ x: 10, y: 50, width: 40, height: 30 })
  })
  it('Shift: 짧은 변 기준 정사각형, 드래그 방향 유지', () => {
    expect(boxFromDrag({ x: 50, y: 50 }, { x: 10, y: 80 }, true)).toEqual({ x: 20, y: 50, width: 30, height: 30 })
    expect(boxFromDrag({ x: 0, y: 0 }, { x: 100, y: 40 }, true)).toEqual({ x: 0, y: 0, width: 40, height: 40 })
  })
})

describe('isNegligible', () => {
  it('클릭 수준 도형·빈 텍스트 판별', () => {
    expect(isNegligible({ ...line, points: [0, 0, 1, 1] })).toBe(true)
    expect(isNegligible(line)).toBe(false)
    expect(isNegligible({ ...rect, width: 1, height: 1 })).toBe(true)
    expect(isNegligible({ ...rect, width: 1, height: 30 })).toBe(false)
    expect(isNegligible({ ...text, text: '  ' })).toBe(true)
    expect(isNegligible(text)).toBe(false)
  })
})

describe('bakeScale', () => {
  it('선: 점 좌표에 반영 / 상자: 크기에 반영(굵기 유지) / 텍스트: 글자 크기에 반영', () => {
    expect(bakeScale(line, 2, 0.5).points).toEqual([0, 0, 200, 25])
    const r = bakeScale(rect, 1.5, 2)
    expect([r.width, r.height, r.strokeWidth]).toEqual([60, 40, 3])
    expect(bakeScale(text, 2, 2).fontSize).toBe(60)
  })
})

describe('style ↔ annotation', () => {
  const panel = defaultDrawStyle(1000, 1000)
  it('형광펜은 실제 굵기 / 배율로 패널에 표시하고, 적용 시 다시 곱함', () => {
    expect(styleFromAnnotation(hl, panel).strokeWidth).toBe(16 / HIGHLIGHTER_WIDTH_FACTOR)
    expect((applyStyle(hl, { strokeWidth: 5 }) as StrokeAnnotation).strokeWidth).toBe(5 * HIGHLIGHTER_WIDTH_FACTOR)
  })
  it('해당 없는 속성은 무시', () => {
    const t = applyStyle(text, { strokeWidth: 99, color: '#00ff00', fontSize: 50 }) as TextAnnotation
    expect([t.color, t.fontSize]).toEqual(['#00ff00', 50])
    expect('strokeWidth' in t).toBe(false)
    const b = applyStyle(rect, { filled: true, fontSize: 10 }) as BoxAnnotation
    expect(b.filled).toBe(true)
    expect('fontSize' in b).toBe(false)
  })
  it('텍스트 스타일 반영', () => {
    expect(styleFromAnnotation({ ...text, background: 'black' }, panel).textBackground).toBe('black')
  })
  it('글꼴: 기본 고딕, 패널 ↔ 텍스트 주석 반영', () => {
    expect(panel.textFont).toBe('gothic')
    expect(styleFromAnnotation({ ...text, font: 'gungseo' }, panel).textFont).toBe('gungseo')
    expect((applyStyle(text, { textFont: 'myeongjo' }) as TextAnnotation).font).toBe('myeongjo')
    // 텍스트가 아닌 개체에는 글꼴 속성이 생기지 않음
    expect('font' in applyStyle(rect, { textFont: 'gulim' })).toBe(false)
  })
})

describe('list ops', () => {
  const list: Annotation[] = [line, rect, text]
  it('update / remove는 새 배열', () => {
    const u = updateAnnotation(list, 'r', (a) => ({ ...a, x: 99 }))
    expect(u).not.toBe(list)
    expect(u[1].x).toBe(99)
    expect(list[1].x).toBe(5)
    expect(removeAnnotation(list, 'l').map((a) => a.id)).toEqual(['r', 't'])
  })
  it('순서 이동(끝이면 그대로)', () => {
    expect(reorderAnnotation(list, 'l', 1).map((a) => a.id)).toEqual(['r', 'l', 't'])
    expect(reorderAnnotation(list, 't', -1).map((a) => a.id)).toEqual(['l', 't', 'r'])
    expect(reorderAnnotation(list, 't', 1)).toBe(list)
    expect(reorderAnnotation(list, 'l', -1)).toBe(list)
  })
  it('복제: 새 id + 위치 이동', () => {
    const d = duplicateAnnotation(rect, 20)
    expect(d.id).not.toBe(rect.id)
    expect([d.x, d.y, d.type]).toEqual([25, 25, 'rect'])
  })
})
