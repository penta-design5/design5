/** KST 캘린더 기준 마감일 표시 (DB dueDate는 DATE, 시간 없음) */

const SEOUL = 'Asia/Seoul'

/** 오늘 날짜 YYYY-MM-DD (서울) */
export function getTodayYmdSeoul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Prisma @db.Date 로 읽은 Date → YYYY-MM-DD (UTC 날짜 성분 사용) */
export function dueDateToYmd(due: Date): string {
  const y = due.getUTCFullYear()
  const m = String(due.getUTCMonth() + 1).padStart(2, '0')
  const d = String(due.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseYmdUtc(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** 마감일까지 남은 캘린더 일수 (음수면 마감 지남) */
export function calendarDaysUntilDue(due: Date, now: Date = new Date()): number {
  const dueY = dueDateToYmd(due)
  const todayY = getTodayYmdSeoul(now)
  const diffMs = parseYmdUtc(dueY) - parseYmdUtc(todayY)
  return Math.round(diffMs / 86400000)
}

/** "2026년 4월 10일 (5일 전)" / "(마감)" 등 */
export function formatDueDateLine(due: Date, now: Date = new Date()): string {
  const y = due.getUTCFullYear()
  const m = due.getUTCMonth() + 1
  const day = due.getUTCDate()
  const datePart = `${y}년 ${m}월 ${day}일`

  const diff = calendarDaysUntilDue(due, now)
  if (diff < 0) {
    return `${datePart} (마감)`
  }
  if (diff === 0) {
    return `${datePart} (오늘 마감)`
  }
  return `${datePart} (${diff}일 전)`
}
