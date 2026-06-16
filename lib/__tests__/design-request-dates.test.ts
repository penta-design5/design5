import { describe, it, expect } from 'vitest'
import {
  getTodayYmdSeoul,
  dueDateToYmd,
  calendarDaysUntilDue,
  formatDueDateLine,
} from '@/lib/design-request-dates'

describe('design-request-dates', () => {
  describe('getTodayYmdSeoul', () => {
    it('UTC 자정을 서울(+9) 기준 같은 날짜로 변환한다', () => {
      // 2026-06-16T00:00:00Z → 서울 09:00 → 2026-06-16
      expect(getTodayYmdSeoul(new Date('2026-06-16T00:00:00Z'))).toBe('2026-06-16')
    })

    it('UTC 늦은 밤은 서울 기준 다음 날이 된다', () => {
      // 2026-06-16T20:00:00Z → 서울 익일 05:00 → 2026-06-17
      expect(getTodayYmdSeoul(new Date('2026-06-16T20:00:00Z'))).toBe('2026-06-17')
    })
  })

  describe('dueDateToYmd', () => {
    it('UTC 날짜 성분으로 YYYY-MM-DD를 만든다', () => {
      expect(dueDateToYmd(new Date('2026-04-10T00:00:00Z'))).toBe('2026-04-10')
    })

    it('월/일을 0으로 패딩한다', () => {
      expect(dueDateToYmd(new Date('2026-01-05T00:00:00Z'))).toBe('2026-01-05')
    })
  })

  describe('calendarDaysUntilDue', () => {
    const now = new Date('2026-04-10T01:00:00Z') // 서울 2026-04-10 10:00

    it('미래 마감일은 양수 일수를 반환한다', () => {
      expect(calendarDaysUntilDue(new Date('2026-04-15T00:00:00Z'), now)).toBe(5)
    })

    it('오늘 마감은 0을 반환한다', () => {
      expect(calendarDaysUntilDue(new Date('2026-04-10T00:00:00Z'), now)).toBe(0)
    })

    it('지난 마감일은 음수를 반환한다', () => {
      expect(calendarDaysUntilDue(new Date('2026-04-08T00:00:00Z'), now)).toBe(-2)
    })
  })

  describe('formatDueDateLine', () => {
    const now = new Date('2026-04-10T01:00:00Z')

    it('미래 마감일은 "N일 전"으로 표시한다', () => {
      expect(formatDueDateLine(new Date('2026-04-15T00:00:00Z'), now)).toBe(
        '2026년 4월 15일 (5일 전)'
      )
    })

    it('오늘 마감은 "(오늘 마감)"으로 표시한다', () => {
      expect(formatDueDateLine(new Date('2026-04-10T00:00:00Z'), now)).toBe(
        '2026년 4월 10일 (오늘 마감)'
      )
    })

    it('지난 마감은 "(마감)"으로 표시한다', () => {
      expect(formatDueDateLine(new Date('2026-04-08T00:00:00Z'), now)).toBe(
        '2026년 4월 8일 (마감)'
      )
    })
  })
})
