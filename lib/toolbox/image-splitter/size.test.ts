import { describe, expect, it } from 'vitest'
import { matchingPreset, parsePx, presetError, scaledSize } from './size'

describe('사진 크기 프리셋', () => {
  it('배율 크기(반올림)', () => {
    expect(scaledSize({ width: 409, height: 416 }, 2)).toEqual({ width: 818, height: 832 })
    expect(scaledSize({ width: 333, height: 101 }, 3)).toEqual({ width: 999, height: 303 })
  })

  it('상한(약 1,670만 px)을 넘는 배율은 사유를 돌려준다', () => {
    expect(presetError({ width: 2000, height: 2000 }, 2)).toBeNull() // 4000×4000 = 1,600만
    expect(presetError({ width: 2000, height: 2000 }, 3)).toMatch(/1,670만/)
    expect(presetError({ width: 6000, height: 10 }, 3)).toMatch(/16,384px/) // 한 변 18,000
  })

  it('현재 크기와 일치하는 프리셋', () => {
    const original = { width: 400, height: 300 }
    expect(matchingPreset(original, original)?.label).toBe('원본 크기')
    expect(matchingPreset(original, { width: 1200, height: 900 })?.label).toBe('3배')
    expect(matchingPreset(original, { width: 500, height: 300 })).toBeNull()
  })
})

describe('parsePx', () => {
  it('정수만 허용', () => {
    expect(parsePx(' 640 ')).toBe(640)
    expect(parsePx('')).toBeNaN()
    expect(parsePx('12.5')).toBeNaN()
    expect(parsePx('-3')).toBeNaN()
    expect(parsePx('1e3')).toBeNaN()
  })
})
