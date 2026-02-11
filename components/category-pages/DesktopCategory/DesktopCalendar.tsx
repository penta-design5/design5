'use client'

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns'
import { isKoreanHoliday } from '@/lib/korean-holidays'
import type { CalendarThemeKey } from '@/lib/desktop-schemas'

export interface DesktopCalendarProps {
  year: number
  month: number
  fontSize: number
  color: string
  backgroundColor: string
  theme: CalendarThemeKey | string
  scale?: number
  sundayColor?: string
  holidayColor?: string
  saturdayColor?: string
  todayCircleColor?: string
}

/**
 * 편집 화면용 캘린더 — buildExportCalendar(내보내기)와 **동일한 table + SVG 구조**
 * padding, circleSize, fontSize 계산이 완전히 같으므로 편집↔다운로드 이미지가 일치합니다.
 */
export function DesktopCalendar({
  year,
  month,
  fontSize,
  color,
  backgroundColor,
  theme: _theme,
  scale = 1,
  sundayColor = '#ec5851',
  holidayColor = '#ec5851',
  saturdayColor = '#8196f7',
  todayCircleColor = '#8196f7',
}: DesktopCalendarProps) {
  const fs = fontSize * scale
  const cellPadding = Math.max(4, Math.round(fs * 0.4))
  const outerPadding = Math.max(10, Math.round(fs * 0.7))
  const circleSize = Math.round(fs * 1.4)
  const titleMb = Math.round(12 * scale)
  const borderRadius = Math.round(12 * scale)
  const captionFontSize = fs * 1.15
  const svgSize = circleSize + 2  // SVG를 1px씩 여유 두어 원 가장자리 잘림 방지
  const cx = svgSize / 2
  const r = circleSize / 2 - 0.5

  const d = new Date(year, month - 1, 1)
  const start = startOfWeek(startOfMonth(d), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(d), { weekStartsOn: 0 })
  const days: Date[] = []
  let day = start
  while (day <= end) {
    days.push(day)
    day = addDays(day, 1)
  }
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const weekdayNames = ['일', '월', '화', '수', '목', '금', '토']

  const getWeekdayColor = (i: number) =>
    i === 0 ? sundayColor : i === 6 ? saturdayColor : color

  const getDateColor = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return color
    if (isKoreanHoliday(date)) return holidayColor
    const dow = date.getDay()
    if (dow === 0) return sundayColor
    if (dow === 6) return saturdayColor
    return color
  }

  const today = new Date()
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  return (
    <div
      style={{
        padding: outerPadding,
        background: backgroundColor,
        color,
        borderRadius,
        fontSize: fs,
        fontFamily: 'Pretendard, system-ui, -apple-system, sans-serif',
        pointerEvents: 'none',
        userSelect: 'none',
        overflow: 'hidden',
        border: '1px solid rgba(200,200,200,0.3)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
      }}
    >
      {/* 제목 */}
      <div
        style={{
          textAlign: 'center',
          fontWeight: 700,
          marginBottom: titleMb,
          fontSize: captionFontSize,
          letterSpacing: '-0.025em',
        }}
      >
        {year}년 {month}월
      </div>

      {/* 테이블 — buildExportCalendar와 동일 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs }}>
        <thead>
          <tr>
            {weekdayNames.map((w, i) => (
              <th
                key={w}
                style={{
                  padding: cellPadding,
                  fontSize: fs,
                  fontWeight: 600,
                  color: getWeekdayColor(i),
                }}
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((date, di) => {
                const isCurrentMonth = isSameMonth(date, d)
                const opacity = isCurrentMonth ? 1 : 0.45
                const dateColor = getDateColor(date, isCurrentMonth)
                const isTodayDate = isToday(date)
                const circleFill = isTodayDate ? todayCircleColor : 'transparent'
                const textFill = isTodayDate ? 'white' : dateColor
                const dayNum = format(date, 'd')

                return (
                  <td
                    key={di}
                    style={{
                      padding: cellPadding,
                      verticalAlign: 'middle',
                      opacity,
                      textAlign: 'center',
                    }}
                  >
                    {/* SVG 원 + 텍스트 — buildExportCalendar와 동일 */}
                    <svg
                      width={svgSize}
                      height={svgSize}
                      viewBox={`0 0 ${svgSize} ${svgSize}`}
                      style={{ display: 'block', margin: '0 auto', verticalAlign: 'middle' }}
                    >
                      <circle cx={cx} cy={cx} r={r} fill={circleFill} />
                      <text
                        x={cx}
                        y={cx}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={textFill}
                        fontSize={fs}
                        fontWeight={500}
                        fontFamily="Pretendard, sans-serif"
                      >
                        {dayNum}
                      </text>
                    </svg>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
