import { describe, it, expect } from 'vitest'
import { isKoreanHoliday, getDayOfWeek } from '@/lib/korean-holidays'

describe('korean-holidays', () => {
  describe('isKoreanHoliday', () => {
    it('고정 공휴일(신정)을 인식한다', () => {
      expect(isKoreanHoliday(new Date(2026, 0, 1))).toBe(true) // 1월 1일
    })

    it('고정 공휴일(어린이날)을 인식한다', () => {
      expect(isKoreanHoliday(new Date(2026, 4, 5))).toBe(true) // 5월 5일
    })

    it('연도별 음력 공휴일(2026 설날)을 인식한다', () => {
      expect(isKoreanHoliday(new Date(2026, 1, 16))).toBe(true) // 2월 16일
    })

    it('공휴일이 아닌 날은 false를 반환한다', () => {
      expect(isKoreanHoliday(new Date(2026, 0, 2))).toBe(false) // 1월 2일
    })

    it('매핑되지 않은 연도의 음력 공휴일은 false다', () => {
      expect(isKoreanHoliday(new Date(2099, 1, 16))).toBe(false)
    })
  })

  describe('getDayOfWeek', () => {
    it('Date.getDay()와 동일한 값을 반환한다 (0=일)', () => {
      const d = new Date(2026, 0, 4) // 2026-01-04 일요일
      expect(getDayOfWeek(d)).toBe(0)
      expect(getDayOfWeek(d)).toBe(d.getDay())
    })
  })
})
