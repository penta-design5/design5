/**
 * 한국 공휴일 판별 (일/월 형식: 1-31, 1-12)
 * - 고정 공휴일: 신정, 삼일절, 어린이날, 현충일, 광복절, 개천절, 한글날, 크리스마스
 * - 음력 공휴일: 설날, 추석, 부처님오신날 (연도별 매핑)
 */
const FIXED_HOLIDAYS: [number, number][] = [
  [1, 1],   // 신정
  [3, 1],   // 삼일절
  [5, 5],   // 어린이날
  [6, 6],   // 현충일
  [8, 15],  // 광복절
  [10, 3],  // 개천절
  [10, 9],  // 한글날
  [12, 25], // 크리스마스
]

// 음력 공휴일 (연도 -> [월, 일][] 형태, 월은 1-12)
const LUNAR_HOLIDAYS: Record<number, [number, number][]> = {
  2024: [[2, 9], [2, 10], [2, 11], [2, 12], [5, 15], [9, 16], [9, 17], [9, 18]], // 설날, 부처님오신날, 추석
  2025: [[1, 28], [1, 29], [1, 30], [5, 5], [10, 5], [10, 6], [10, 7], [10, 8]], // 설날(1/28-30), 부처님오신날, 추석
  2026: [[2, 16], [2, 17], [2, 18], [5, 24], [9, 24], [9, 25], [9, 26]], // 설날, 부처님오신날, 추석
  2027: [[2, 6], [2, 7], [2, 8], [5, 13], [9, 14], [9, 15], [9, 16]], // 설날, 부처님오신날, 추석
  2028: [[1, 26], [1, 27], [1, 28], [5, 2], [10, 2], [10, 3], [10, 4]], // 설날, 부처님오신날, 추석
  2029: [[2, 12], [2, 13], [2, 14], [5, 20], [9, 21], [9, 22], [9, 23]], // 설날, 부처님오신날, 추석
  2030: [[2, 2], [2, 3], [2, 4], [5, 9], [9, 11], [9, 12], [9, 13]], // 설날, 부처님오신날, 추석
}

export function isKoreanHoliday(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()

  for (const [m, d] of FIXED_HOLIDAYS) {
    if (month === m && day === d) return true
  }

  const lunar = LUNAR_HOLIDAYS[year]
  if (lunar) {
    for (const [m, d] of lunar) {
      if (month === m && day === d) return true
    }
  }
  return false
}

export function getDayOfWeek(date: Date): number {
  return date.getDay() // 0=일, 6=토
}
