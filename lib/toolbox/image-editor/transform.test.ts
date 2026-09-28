import { describe, expect, it } from 'vitest'
import {
  MAX_SIDE,
  linkedDimension,
  normalizeAngle,
  resolveResize,
  rotatedBounds,
  validateOutputSize,
} from './transform'

describe('normalizeAngle', () => {
  it('-180 < a <= 180', () => {
    expect(normalizeAngle(0)).toBe(0)
    expect(normalizeAngle(270)).toBe(-90)
    expect(normalizeAngle(-270)).toBe(90)
    expect(normalizeAngle(180)).toBe(180)
    expect(normalizeAngle(-180)).toBe(180)
    expect(normalizeAngle(450)).toBe(90)
  })
})

describe('rotatedBounds', () => {
  it('0°·180°는 그대로, 90°·-90°는 가로·세로 교환 (오차 없이 정수)', () => {
    expect(rotatedBounds(301, 200, 0)).toEqual({ width: 301, height: 200 })
    expect(rotatedBounds(301, 200, 180)).toEqual({ width: 301, height: 200 })
    expect(rotatedBounds(301, 200, 90)).toEqual({ width: 200, height: 301 })
    expect(rotatedBounds(301, 200, -90)).toEqual({ width: 200, height: 301 })
    expect(rotatedBounds(301, 200, 270)).toEqual({ width: 200, height: 301 })
  })

  it('임의 각도는 이미지가 잘리지 않도록 올림', () => {
    // 100×100을 45° 회전 → 대각선 141.42… → 142
    expect(rotatedBounds(100, 100, 45)).toEqual({ width: 142, height: 142 })
    // 300×200을 30° 회전 → 300cos30+200sin30 = 359.8 / 300sin30+200cos30 = 323.2
    expect(rotatedBounds(300, 200, 30)).toEqual({ width: 360, height: 324 })
  })
})

describe('validateOutputSize', () => {
  it('정상 범위', () => {
    expect(validateOutputSize({ width: 1, height: 1 })).toBeNull()
    expect(validateOutputSize({ width: 4096, height: 4096 })).toBeNull()
    expect(validateOutputSize({ width: MAX_SIDE, height: 1000 })).toBeNull()
  })

  it('0·음수·NaN, 변 길이 초과, 픽셀 수 초과 거부', () => {
    expect(validateOutputSize({ width: 0, height: 10 })).not.toBeNull()
    expect(validateOutputSize({ width: NaN, height: 10 })).not.toBeNull()
    expect(validateOutputSize({ width: MAX_SIDE + 1, height: 1 })).toContain('한 변')
    expect(validateOutputSize({ width: 6000, height: 4000 })).toContain('1,670만')
  })
})

describe('resize 입력 계산', () => {
  const original = { width: 1920, height: 1080 }

  it('px는 반올림, %는 원본 기준', () => {
    expect(resolveResize(original, 'px', 800.4, 450.6)).toEqual({ width: 800, height: 451 })
    expect(resolveResize(original, 'percent', 50, 50)).toEqual({ width: 960, height: 540 })
    expect(resolveResize(original, 'percent', 200, 100)).toEqual({ width: 3840, height: 1080 })
  })

  it('비율 유지 연동', () => {
    expect(linkedDimension(original, 'px', 'width', 960)).toBe(540)
    expect(linkedDimension(original, 'px', 'height', 540)).toBe(960)
    expect(linkedDimension({ width: 300, height: 200 }, 'px', 'width', 150)).toBe(100)
    expect(linkedDimension(original, 'percent', 'width', 75)).toBe(75)
    // 아주 작은 값도 최소 1px
    expect(linkedDimension(original, 'px', 'width', 1)).toBe(1)
  })
})
