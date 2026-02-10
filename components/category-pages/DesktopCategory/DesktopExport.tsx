'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import type { DesktopWallpaperPost } from '@/lib/desktop-schemas'
import type { DesktopEditorData, DesktopElement } from '@/lib/desktop-schemas'
import { getCalendarNaturalSize, toCalendarRgba } from '@/lib/desktop-schemas'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns'
import { isKoreanHoliday } from '@/lib/korean-holidays'

const getImageSrc = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http') && url.includes('backblazeb2.com')) {
    return `/api/posts/images?url=${encodeURIComponent(url)}`
  }
  return url
}

function buildExportCalendar(
  year: number,
  month: number,
  style: {
    fontSize?: number
    color?: string
    backgroundColor?: string
    backgroundOpacity?: number
    sundayColor?: string
    holidayColor?: string
    saturdayColor?: string
    todayCircleColor?: string
  },
  renderScale: number = 1,
  maxWidthPx?: number,
  maxHeightPx?: number
) {
  const sundayColor = style.sundayColor ?? '#ec5851'
  const holidayColor = style.holidayColor ?? '#ec5851'
  const saturdayColor = style.saturdayColor ?? '#8196f7'
  const todayCircleColor = style.todayCircleColor ?? '#8196f7'
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
  // renderScale을 fontSize에 미리 적용하여 CSS transform 없이 크기 조정
  const fs = (style.fontSize || 14) * renderScale
  const color = style.color || '#333'
  // 배경: 설정한 투명도를 그대로 반영 (rgba 유지)
  const bg = toCalendarRgba(style.backgroundColor || '#ffffff', style.backgroundOpacity)
  // 에디터(MiniCalendar)와 동일한 패딩 계산
  const cellPadding = Math.max(4, Math.round(fs * 0.4))
  const outerPadding = Math.max(10, Math.round(fs * 0.7))
  const circleSize = Math.round(fs * 1.4)
  // 고정값도 renderScale 적용
  const borderRadius = Math.round(12 * renderScale)
  const titleMb = Math.round(12 * renderScale)

  const getWeekdayColor = (i: number) => (i === 0 ? sundayColor : i === 6 ? saturdayColor : color)
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

  // box-shadow 제거 (html2canvas에서 렌더링 아티팩트 발생). 컨테이너 넘침 방지를 위해 max-width/max-height 적용
  const rootExtra =
    maxWidthPx != null && maxHeightPx != null
      ? `max-width:${maxWidthPx}px;max-height:${maxHeightPx}px;overflow:hidden;box-sizing:border-box;`
      : ''
  let html = `<div style="${rootExtra}padding:${outerPadding}px;background:${bg};color:${color};border-radius:${borderRadius}px;font-size:${fs}px;font-family:Pretendard,system-ui,-apple-system,sans-serif">`
  html += `<div style="text-align:center;font-weight:700;margin-bottom:${titleMb}px;font-size:${fs * 1.15}px;letter-spacing:-0.025em">${year}년 ${month}월</div>`
  html += `<table style="width:100%;border-collapse:collapse;font-size:${fs}px"><thead><tr>`
  weekdayNames.forEach((w, i) => {
    html += `<th style="padding:${cellPadding}px;font-size:${fs}px;font-weight:600;color:${getWeekdayColor(i)}">${w}</th>`
  })
  html += '</tr></thead><tbody>'
  const cx = circleSize / 2
  const r = circleSize / 2 - 0.5

  weeks.forEach((week) => {
    html += '<tr>'
    week.forEach((date) => {
      const isCurrentMonth = isSameMonth(date, d)
      const opacity = isCurrentMonth ? 1 : 0.45
      const dateColor = getDateColor(date, isCurrentMonth)
      const isTodayDate = isToday(date)
      const circleFill = isTodayDate ? todayCircleColor : 'transparent'
      const textFill = isTodayDate ? 'white' : dateColor
      const dayNum = format(date, 'd')
      // SVG로 원·텍스트 그리기: html2canvas에서 CSS 정렬이 틀어지는 문제 회피
      html += `<td style="padding:${cellPadding}px;vertical-align:middle;opacity:${opacity};text-align:center">`
      html += `<svg width="${circleSize}" height="${circleSize}" viewBox="0 0 ${circleSize} ${circleSize}" style="display:block;margin:0 auto;vertical-align:middle"><circle cx="${cx}" cy="${cx}" r="${r}" fill="${circleFill}"/><text x="${cx}" y="${cx}" text-anchor="middle" dominant-baseline="central" fill="${textFill}" font-size="${fs}" font-weight="500" font-family="Pretendard,sans-serif">${dayNum}</text></svg>`
      html += `</td>`
    })
    html += '</tr>'
  })
  html += '</tbody></table></div>'
  return html
}

interface DesktopExportProps {
  wallpaper: DesktopWallpaperPost
  editorData: DesktopEditorData
  canvasRef: React.RefObject<HTMLDivElement | null>
}

export function DesktopExport({ wallpaper, editorData, canvasRef }: DesktopExportProps) {
  const [exporting, setExporting] = useState<'png' | 'jpg' | null>(null)
  const [highRes, setHighRes] = useState(false)

  const bg = editorData.selectedBackground
  const bgUrl =
    bg === 'windows'
      ? wallpaper.backgroundUrlWindows || wallpaper.backgroundUrlMac
      : wallpaper.backgroundUrlMac || wallpaper.backgroundUrlWindows
  const width = bg === 'windows' ? wallpaper.widthWindows : wallpaper.widthMac
  const height = bg === 'windows' ? wallpaper.heightWindows : wallpaper.heightMac

  const capture = useCallback(
    async (format: 'png' | 'jpg'): Promise<HTMLCanvasElement | null> => {
      await document.fonts.ready

      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.zIndex = '-1'
      document.body.appendChild(container)

      const exportDiv = document.createElement('div')
      exportDiv.style.position = 'relative'
      exportDiv.style.overflow = 'hidden'
      exportDiv.style.width = `${width}px`
      exportDiv.style.height = `${height}px`

      const bgImg = document.createElement('img')
      bgImg.src = getImageSrc(bgUrl!)
      bgImg.crossOrigin = 'anonymous'
      bgImg.style.position = 'absolute'
      bgImg.style.inset = '0'
      bgImg.style.width = '100%'
      bgImg.style.height = '100%'
      bgImg.style.objectFit = 'cover'
      exportDiv.appendChild(bgImg)

      editorData.elements.forEach((el: DesktopElement) => {
        const elDiv = document.createElement('div')
        elDiv.style.position = 'absolute'
        elDiv.style.left = `${el.x}px`
        elDiv.style.top = `${el.y}px`
        elDiv.style.zIndex = '10'

        if (el.type === 'title' || el.type === 'description') {
          const s = (el.textStyle || {}) as { fontFamily?: string; fontSize?: number; color?: string; fontWeight?: string }
          elDiv.style.fontFamily = s.fontFamily || 'Pretendard, sans-serif'
          elDiv.style.fontSize = `${s.fontSize || 24}px`
          elDiv.style.color = s.color || '#333'
          elDiv.style.fontWeight = String(s.fontWeight || 'normal')
          elDiv.style.whiteSpace = el.type === 'description' ? 'pre-wrap' : 'nowrap'
          elDiv.textContent = el.value || (el.type === 'title' ? '제목' : '설명')
        } else if (el.type === 'calendar' && el.calendarStyle) {
          const cs = el.calendarStyle
          // 에디터(DesktopElementRender)와 동일한 동적 자연크기 계산
          const w = el.width ?? 220
          const h = el.height ?? 200
          const elFs = cs.fontSize ?? 14
          const { width: naturalW, height: naturalH } = getCalendarNaturalSize(cs.year, cs.month, elFs)
          const rawScale = Math.min(w / naturalW, h / naturalH)
          // 실제 렌더가 계산값을 넘어 우측/하단 잘림 방지: 스케일을 넉넉히 줄이고, 루트에 max 크기 고정
          const fitScale = Math.min(rawScale * 0.88, 1)
          const scaledW = Math.floor(naturalW * fitScale)
          const scaledH = Math.floor(naturalH * fitScale)

          elDiv.style.width = `${w}px`
          elDiv.style.height = `${h}px`
          elDiv.style.overflow = 'hidden'
          elDiv.style.display = 'flex'
          elDiv.style.alignItems = 'center'
          elDiv.style.justifyContent = 'center'

          const inner = document.createElement('div')
          inner.style.width = `${Math.min(scaledW + 4, w)}px`
          inner.style.height = `${Math.min(scaledH + 4, h)}px`
          inner.style.overflow = 'hidden'
          inner.style.flexShrink = '0'
          inner.innerHTML = buildExportCalendar(cs.year, cs.month, {
            fontSize: cs.fontSize,
            color: cs.color,
            backgroundColor: cs.backgroundColor,
            backgroundOpacity: cs.backgroundOpacity,
            sundayColor: cs.sundayColor,
            holidayColor: cs.holidayColor,
            saturdayColor: cs.saturdayColor,
            todayCircleColor: cs.todayCircleColor,
          }, fitScale, scaledW, scaledH)
          elDiv.appendChild(inner)
        }
        exportDiv.appendChild(elDiv)
      })

      container.appendChild(exportDiv)

      const images = container.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve()
              else {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              }
            })
        )
      )
      await new Promise((r) => setTimeout(r, 100))

      const scale = highRes ? 2 : 1
      try {
        const canvas = await html2canvas(exportDiv, {
          useCORS: true,
          allowTaint: false,
          scale,
          backgroundColor: format === 'jpg' ? '#FFFFFF' : null,
          logging: false,
        })
        return canvas
      } finally {
        document.body.removeChild(container)
      }
    },
    [editorData, width, height, bgUrl, highRes]
  )

  const download = useCallback(
    async (fmt: 'png' | 'jpg') => {
      setExporting(fmt)
      try {
        const canvas = await capture(fmt)
        if (!canvas) throw new Error('캡처에 실패했습니다.')
        const mime = fmt === 'png' ? 'image/png' : 'image/jpeg'
        const dataUrl = canvas.toDataURL(mime, fmt === 'jpg' ? 0.92 : undefined)
        const a = document.createElement('a')
        const name = `바탕화면_${wallpaper.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${format(new Date(), 'yyyyMMdd')}.${fmt}`
        a.download = name
        a.href = dataUrl
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (e) {
        toast.error(`${fmt.toUpperCase()} 다운로드 중 오류가 발생했습니다.`)
      } finally {
        setExporting(null)
      }
    },
    [capture, wallpaper.title]
  )

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">내보내기</h3>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={highRes}
            onChange={(e) => setHighRes(e.target.checked)}
          />
          고해상도 (2x)
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => download('png')}
          disabled={!!exporting}
          className="h-10 min-h-10 flex items-center justify-center"
        >
          {exporting === 'png' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="text-xs">PNG</span>
          )}
        </Button>
        <Button
          onClick={() => download('jpg')}
          disabled={!!exporting}
          className="h-10 min-h-10 flex items-center justify-center"
        >
          {exporting === 'jpg' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="text-xs">JPG</span>
          )}
        </Button>
      </div>
    </div>
  )
}
