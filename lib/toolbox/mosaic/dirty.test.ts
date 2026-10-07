import { describe, expect, it } from 'vitest'
import { MAX_DIRTY_RECTS, blurUsesLowRes, intersectRect, planDirtyRects, rectDifference } from './dirty'
import { createRegion } from './regions'
import { DEFAULT_REGION_SETTINGS, type Rect, type Region } from './types'

const SIZE = { width: 100, height: 80 }
const region = (rect: Rect, patch: Partial<Region> = {}): Region => ({ ...createRegion(rect, DEFAULT_REGION_SETTINGS), ...patch })
const area = (rects: Rect[]) => rects.reduce((n, r) => n + r.width * r.height, 0)

/** 사각형 목록이 덮는 픽셀 집합 */
function mask(rects: Rect[]) {
  const set = new Set<number>()
  for (const r of rects) for (let y = r.y; y < r.y + r.height; y++) for (let x = r.x; x < r.x + r.width; x++) set.add(y * 1000 + x)
  return set
}

describe('intersectRect', () => {
  it('겹치는 부분만, 겹치지 않으면 null(맞닿기만 해도 null)', () => {
    expect(intersectRect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toEqual({ x: 5, y: 5, width: 5, height: 5 })
    expect(intersectRect({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 5, height: 5 })).toBeNull()
  })
})

describe('rectDifference — a에서 b를 뺀 나머지', () => {
  const cases: [string, Rect, Rect][] = [
    ['오른쪽 아래로 겹침(이동)', { x: 0, y: 0, width: 50, height: 40 }, { x: 3, y: 2, width: 50, height: 40 }],
    ['b가 a 안에 완전히 들어감', { x: 0, y: 0, width: 50, height: 40 }, { x: 10, y: 10, width: 20, height: 10 }],
    ['겹치지 않음', { x: 0, y: 0, width: 10, height: 10 }, { x: 30, y: 30, width: 5, height: 5 }],
    ['a가 b 안에 완전히 들어감', { x: 10, y: 10, width: 5, height: 5 }, { x: 0, y: 0, width: 50, height: 50 }],
    ['한 변만 다름(크기 조절)', { x: 5, y: 5, width: 40, height: 30 }, { x: 5, y: 5, width: 45, height: 30 }],
  ]
  for (const [name, a, b] of cases) {
    it(`${name}: 조각이 서로 겹치지 않고 a − b를 정확히 덮는다`, () => {
      const pieces = rectDifference(a, b)
      const expected = new Set([...mask([a])].filter((p) => !mask([b]).has(p)))
      const got = mask(pieces)
      expect(got).toEqual(expected)
      expect(area(pieces)).toBe(expected.size) // 겹치는 조각이 없으면 넓이 합 = 집합 크기
    })
  }
})

describe('planDirtyRects — 부분 갱신 계획', () => {
  it('같은 목록이면 다시 그릴 곳 없음', () => {
    const r = [region({ x: 0, y: 0, width: 20, height: 20 })]
    expect(planDirtyRects(r, r, SIZE)).toEqual([])
  })

  it('사각형을 옮기면 차이 띠만(전체 영역보다 훨씬 작음)', () => {
    const a = region({ x: 10, y: 10, width: 60, height: 50 })
    const b = { ...a, x: 13, y: 12 }
    const dirty = planDirtyRects([a], [b], SIZE)
    expect(dirty).not.toBeNull()
    // 대칭 차 넓이 = 2 × (60×50 − 겹침 57×48) = 2 × 264
    expect(area(dirty as Rect[])).toBe(2 * (60 * 50 - 57 * 48))
    expect(area(dirty as Rect[])).toBeLessThan(60 * 50 / 4)
  })

  it('패턴·강도·모양이 바뀌면 이전·새 영역 전체', () => {
    const a = region({ x: 10, y: 10, width: 30, height: 30 })
    expect(planDirtyRects([a], [{ ...a, strength: 50 }], SIZE)).toEqual([
      { x: 10, y: 10, width: 30, height: 30 },
      { x: 10, y: 10, width: 30, height: 30 },
    ])
    expect(planDirtyRects([a], [{ ...a, shape: 'ellipse' }], SIZE)).toHaveLength(2)
  })

  it('타원은 위치만 바뀌어도 외접 사각형 전체(경계가 곡선이라 띠 계산을 쓰지 않음)', () => {
    const a = region({ x: 10, y: 10, width: 30, height: 30 }, { shape: 'ellipse' })
    expect(planDirtyRects([a], [{ ...a, x: 12 }], SIZE)).toEqual([
      { x: 10, y: 10, width: 30, height: 30 },
      { x: 12, y: 10, width: 30, height: 30 },
    ])
  })

  it('영역 추가·삭제는 그 영역 범위만', () => {
    const a = region({ x: 0, y: 0, width: 10, height: 10 })
    const b = region({ x: 50, y: 50, width: 20, height: 10 })
    expect(planDirtyRects([a], [a, b], SIZE)).toEqual([{ x: 50, y: 50, width: 20, height: 10 }])
    expect(planDirtyRects([a, b], [a], SIZE)).toEqual([{ x: 50, y: 50, width: 20, height: 10 }])
  })

  it('남은 영역의 겹침 순서가 바뀌면 전체를 다시 그린다(null)', () => {
    const a = region({ x: 0, y: 0, width: 10, height: 10 })
    const b = region({ x: 5, y: 5, width: 10, height: 10 })
    expect(planDirtyRects([a, b], [b, a], SIZE)).toBeNull()
  })

  it('바뀐 부분이 너무 많으면 전체를 다시 그린다(null)', () => {
    const many = Array.from({ length: MAX_DIRTY_RECTS + 1 }, (_, i) => region({ x: i, y: 0, width: 1, height: 1 }))
    expect(planDirtyRects(many, [], SIZE)).toBeNull()
  })

  it('블러가 줄인 해상도로 계산되는 큰 영역과 겹치면 전체를 다시 그린다(null), 작은 블러는 부분 갱신', () => {
    const big = { width: 4096, height: 4096 }
    const largeBlur = region({ x: 0, y: 0, width: 3000, height: 3000 }, { pattern: 'blur', strength: 22 })
    expect(blurUsesLowRes(largeBlur, big)).toBe(true)
    expect(planDirtyRects([largeBlur], [{ ...largeBlur, x: 4 }], big)).toBeNull()
    const smallBlur = region({ x: 100, y: 100, width: 300, height: 300 }, { pattern: 'blur', strength: 22 })
    expect(blurUsesLowRes(smallBlur, big)).toBe(false)
    expect(planDirtyRects([smallBlur], [{ ...smallBlur, x: 104 }], big)).not.toBeNull()
  })
})
