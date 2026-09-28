import { describe, expect, it } from 'vitest'
import { aspectRatioOf, clampCropRect, fitAspect, fullCropRect, isFullCrop, setCropField } from './crop'

const size = { width: 400, height: 300 }

describe('aspectRatioOf', () => {
  it('프리셋별 비율', () => {
    expect(aspectRatioOf('free', size)).toBeNull()
    expect(aspectRatioOf('original', size)).toBeCloseTo(4 / 3)
    expect(aspectRatioOf('1:1', size)).toBe(1)
    expect(aspectRatioOf('16:9', size)).toBeCloseTo(16 / 9)
    expect(aspectRatioOf('9:16', size)).toBeCloseTo(9 / 16)
  })
})

describe('clampCropRect', () => {
  it('정수 반올림 + 이미지 안으로', () => {
    expect(clampCropRect({ x: 10.4, y: 20.6, width: 100.5, height: 50.2 }, size)).toEqual({ x: 10, y: 21, width: 101, height: 50 })
    expect(clampCropRect({ x: -20, y: -5, width: 100, height: 100 }, size)).toEqual({ x: 0, y: 0, width: 100, height: 100 })
    // 오른쪽 아래로 넘치면 위치를 밀어 넣음
    expect(clampCropRect({ x: 350, y: 280, width: 100, height: 100 }, size)).toEqual({ x: 300, y: 200, width: 100, height: 100 })
    // 이미지보다 크면 크기를 먼저 줄임, 최소 1px
    expect(clampCropRect({ x: 0, y: 0, width: 900, height: 0 }, size)).toEqual({ x: 0, y: 0, width: 400, height: 1 })
  })

  it('전체 영역 판별', () => {
    expect(isFullCrop(fullCropRect(size), size)).toBe(true)
    expect(isFullCrop({ x: 0, y: 0, width: 399, height: 300 }, size)).toBe(false)
  })
})

describe('fitAspect', () => {
  it('비율에 맞는 가장 큰 영역을 현재 중심에', () => {
    // 1:1 → 300×300, 전체 중심 기준 x=50
    expect(fitAspect(fullCropRect(size), 1, size)).toEqual({ x: 50, y: 0, width: 300, height: 300 })
    // 16:9 → 400×225, y=(300-225)/2=37.5 → 38
    expect(fitAspect(fullCropRect(size), 16 / 9, size)).toEqual({ x: 0, y: 38, width: 400, height: 225 })
    // 중심이 가장자리 쪽이면 이미지 안으로 밀어 넣음
    expect(fitAspect({ x: 0, y: 0, width: 20, height: 20 }, 1, size)).toEqual({ x: 0, y: 0, width: 300, height: 300 })
  })

  it('자유 비율은 그대로(정리만)', () => {
    expect(fitAspect({ x: 10, y: 10, width: 50, height: 60 }, null, size)).toEqual({ x: 10, y: 10, width: 50, height: 60 })
  })
})

describe('setCropField', () => {
  const rect = { x: 50, y: 50, width: 200, height: 100 }

  it('위치 변경: 들어가면 그대로, 넘치면 위치는 유지하고 크기를 줄임', () => {
    expect(setCropField(rect, 'x', 150, null, size)).toEqual({ ...rect, x: 150 })
    expect(setCropField(rect, 'x', 300, null, size)).toEqual({ ...rect, x: 300, width: 100 })
    expect(setCropField(rect, 'y', -10, null, size)).toEqual({ ...rect, y: 0 })
    expect(setCropField(rect, 'y', 250, null, size)).toEqual({ ...rect, y: 250, height: 50 })
    // 이미지 끝을 넘는 위치는 마지막 픽셀까지(최소 1px 남김)
    expect(setCropField(rect, 'x', 999, null, size)).toEqual({ ...rect, x: 399, width: 1 })
  })

  it('전체 영역에서 X→Y 순서로 입력해도 입력값 유지', () => {
    let r = fullCropRect(size)
    r = setCropField(r, 'x', 200, null, size)
    r = setCropField(r, 'y', 150, null, size)
    expect(r).toEqual({ x: 200, y: 150, width: 200, height: 150 })
  })

  it('비율 고정 중 위치 변경으로 넘치면 비율을 지키며 축소', () => {
    // 1:1 200×200 at (0,0) → x=300 → 너비 100 → 높이 100
    expect(setCropField({ x: 0, y: 0, width: 200, height: 200 }, 'x', 300, 1, size)).toEqual({ x: 300, y: 0, width: 100, height: 100 })
  })

  it('자유 비율: 한 변만 변경', () => {
    expect(setCropField(rect, 'width', 120, null, size)).toEqual({ ...rect, width: 120 })
    expect(setCropField(rect, 'height', 1000, null, size)).toEqual({ x: 50, y: 0, width: 200, height: 300 })
  })

  it('비율 고정: 다른 변 연동 + 넘치면 비율 유지하며 축소', () => {
    expect(setCropField(rect, 'width', 160, 16 / 9, size)).toEqual({ x: 50, y: 50, width: 160, height: 90 })
    expect(setCropField(rect, 'height', 150, 1, size)).toEqual({ x: 50, y: 50, width: 150, height: 150 })
    // 1:1에서 너비 400 → 높이 300까지만 → 300×300
    expect(setCropField(rect, 'width', 400, 1, size)).toEqual({ x: 50, y: 0, width: 300, height: 300 })
  })

  it('숫자가 아니면 변경 없음', () => {
    expect(setCropField(rect, 'width', NaN, null, size)).toBe(rect)
  })
})
