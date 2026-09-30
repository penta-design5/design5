import { describe, expect, it } from 'vitest'
import { normalizeAngle, rotatedBounds } from './transform'

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
