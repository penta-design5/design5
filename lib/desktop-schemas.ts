import { z } from 'zod'

// 요소 타입
export const elementTypeSchema = z.enum(['title', 'description', 'calendar'])
export type ElementType = z.infer<typeof elementTypeSchema>

// 제목/설명 요소 스타일
export const textElementStyleSchema = z.object({
  fontFamily: z.string().default('Pretendard, sans-serif'),
  fontSize: z.number().min(8).max(120).default(24),
  color: z.string().default('#333333'),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('normal'),
})

// 캘린더 요소 스타일
export const calendarElementStyleSchema = z.object({
  year: z.number().min(2000).max(2100),
  month: z.number().min(1).max(12),
  fontSize: z.number().min(8).max(48).default(14),
  color: z.string().default('#333333'),
  backgroundColor: z.string().default('#ffffff'),
  backgroundOpacity: z.number().min(0).max(1).default(0.9),
  theme: z.enum(['default', 'minimal', 'dark']).default('default'),
  // 요일/오늘 색상 (사용자 지정)
  sundayColor: z.string().default('#ec5851'),
  holidayColor: z.string().default('#ec5851'),
  saturdayColor: z.string().default('#8196f7'),
  todayCircleColor: z.string().default('#8196f7'),
})

/** hex → { r, g, b } */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace(/^#/, '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return { r: 255, g: 255, b: 255 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

/** rgba(...) 또는 rgb(...) 문자열에서 r,g,b 추출 */
function parseRgbaRgb(str: string): { r: number; g: number; b: number; a?: number } | null {
  const rgba = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/i)
  if (!rgba) return null
  const a = str.startsWith('rgba') ? parseFloat(str.replace(/^.*,\s*([\d.]+)\s*\)/, '$1')) : undefined
  return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a }
}

/**
 * 캘린더 배경용 rgba 문자열 계산.
 * backgroundColor가 hex이면 backgroundOpacity 사용, 기존 rgba 문자열이면 호환 유지.
 */
export function toCalendarRgba(backgroundColor: string, backgroundOpacity?: number): string {
  if (backgroundColor.startsWith('#')) {
    const { r, g, b } = hexToRgb(backgroundColor)
    const a = backgroundOpacity ?? 0.9
    return `rgba(${r},${g},${b},${a})`
  }
  const parsed = parseRgbaRgb(backgroundColor)
  if (parsed) {
    const a = backgroundOpacity ?? parsed.a ?? 0.9
    return `rgba(${parsed.r},${parsed.g},${parsed.b},${a})`
  }
  return backgroundColor || 'rgba(255,255,255,0.9)'
}

/** rgba 문자열에서 hex 추출 (속성 패널 표시용) */
export function calendarBgToHex(backgroundColor: string): string {
  if (backgroundColor.startsWith('#')) return backgroundColor
  const p = parseRgbaRgb(backgroundColor)
  if (!p) return '#ffffff'
  const r = p.r.toString(16).padStart(2, '0')
  const g = p.g.toString(16).padStart(2, '0')
  const b = p.b.toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

/** rgba 문자열에서 0~1 투명도 추출 */
export function calendarBgToOpacity(backgroundColor: string, fallback?: number): number {
  if (backgroundColor.startsWith('#')) return fallback ?? 0.9
  const p = parseRgbaRgb(backgroundColor)
  return p?.a ?? fallback ?? 0.9
}

// 데스크톱 요소 스키마 (style은 type에 따라 textElementStyleSchema | calendarElementStyleSchema)
export const desktopElementSchema = z.object({
  id: z.string(),
  type: elementTypeSchema,
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(20).optional(),
  height: z.number().min(20).optional(),
  value: z.string().optional(), // 제목/설명 텍스트
  textStyle: textElementStyleSchema.optional(),
  calendarStyle: calendarElementStyleSchema.optional(),
})
export type DesktopElement = z.infer<typeof desktopElementSchema>

/** 요소별 바운딩 박스 (정렬·리사이즈용) */
export interface DesktopElementBounds {
  x: number
  y: number
  width: number
  height: number
}

export function getDesktopElementBounds(
  el: DesktopElement,
  _canvasWidth?: number,
  _canvasHeight?: number
): DesktopElementBounds {
  if (el.type === 'title' || el.type === 'description') {
    const fs = (el.textStyle as { fontSize?: number } | undefined)?.fontSize ?? (el.type === 'title' ? 32 : 18)
    const width = el.width ?? 400
    const lineHeight = 1.3
    const lines = el.type === 'description' ? Math.max(1, (el.value ?? '').split('\n').length) : 1
    const height = fs * lineHeight * lines
    return { x: el.x, y: el.y, width, height }
  }
  if (el.type === 'calendar') {
    const w = el.width ?? 220
    const h = el.height ?? 200
    return { x: el.x, y: el.y, width: w, height: h }
  }
  return { x: el.x, y: el.y, width: 400, height: 40 }
}

/**
 * 캘린더 요소의 자연 크기(natural size)를 동적 계산
 * 월별 주 수에 따라 높이가 달라지며, fontSize에 따라 너비/높이가 비례합니다.
 * 에디터(DesktopCanvas)와 내보내기(DesktopExport) 양쪽에서 동일한 계산을 사용합니다.
 */
export function getCalendarNaturalSize(year: number, month: number, fontSize: number) {
  // 해당 월의 주 수 계산 (일요일 시작)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const numWeeks = Math.ceil((firstDayOfWeek + daysInMonth) / 7)

  const fs = fontSize
  const cellPadding = Math.max(4, Math.round(fs * 0.4))
  const outerPadding = Math.max(10, Math.round(fs * 0.7))
  const circleSize = Math.round(fs * 1.4)

  // 너비: 외부패딩 + 7열 * (셀패딩*2 + 원크기) + 여유
  const width = outerPadding * 2 + 7 * (cellPadding * 2 + circleSize) + 24

  // 높이: 외부패딩 + 제목 + 헤더행 + 데이터행 * 주수 + 여유
  const titleHeight = Math.ceil(fs * 1.15 * 1.5) + 12 // font-size*line-height + margin-bottom
  const headerHeight = cellPadding * 2 + Math.ceil(fs * 1.4)
  const rowHeight = cellPadding * 2 + circleSize
  const height = outerPadding * 2 + titleHeight + headerHeight + numWeeks * rowHeight + 8

  return { width, height, numWeeks }
}

// 배경 선택
export const selectedBackgroundSchema = z.enum(['windows', 'mac'])
export type SelectedBackground = z.infer<typeof selectedBackgroundSchema>

// 사용자 편집 데이터
export const desktopEditorDataSchema = z.object({
  selectedBackground: selectedBackgroundSchema.default('windows'),
  elements: z.array(desktopElementSchema).default([]),
})
export type DesktopEditorData = z.infer<typeof desktopEditorDataSchema>

// 저장된 프리셋 (localStorage)
export interface SavedDesktopPreset {
  id: string
  name: string
  createdAt: string
  wallpaperId: string
  wallpaperTitle: string
  data: DesktopEditorData
}

// localStorage 키
export const STORAGE_KEYS = {
  PRESETS: 'desktop-editor-presets',
  AUTOSAVE: 'desktop-editor-autosave',
} as const

// 캘린더 테마 프리셋 (react-day-picker classNames / CSS 변수용)
export const CALENDAR_THEMES = {
  default: {
    root: 'rounded-lg border bg-white shadow-sm p-2',
    day: 'rounded-md hover:bg-accent',
    day_button: 'h-8 w-8',
    selected: 'bg-primary text-primary-foreground',
    today: 'bg-accent font-semibold',
    outside: 'text-muted-foreground opacity-50',
    weekday: 'text-muted-foreground text-xs font-medium',
  },
  minimal: {
    root: 'rounded-lg p-2',
    day: 'rounded-md hover:bg-muted/50',
    day_button: 'h-8 w-8 font-light',
    selected: 'bg-foreground text-background',
    today: 'border border-foreground',
    outside: 'text-muted-foreground/40',
    weekday: 'text-muted-foreground/80 text-xs',
  },
  dark: {
    root: 'rounded-lg bg-neutral-900/90 text-neutral-100 p-2 border border-neutral-700',
    day: 'rounded-md hover:bg-neutral-700',
    day_button: 'h-8 w-8',
    selected: 'bg-neutral-100 text-neutral-900',
    today: 'bg-neutral-600 text-white',
    outside: 'text-neutral-500 opacity-50',
    weekday: 'text-neutral-400 text-xs',
  },
} as const

export type CalendarThemeKey = keyof typeof CALENDAR_THEMES

// localStorage 유틸리티
export const desktopStorageUtils = {
  getAllPresets: (): SavedDesktopPreset[] => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.PRESETS) : null
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  getPresetsByWallpaperId: (wallpaperId: string): SavedDesktopPreset[] => {
    return desktopStorageUtils.getAllPresets().filter((p) => p.wallpaperId === wallpaperId)
  },

  savePreset: (preset: SavedDesktopPreset): boolean => {
    try {
      const all = desktopStorageUtils.getAllPresets()
      const updated = [...all.filter((p) => p.id !== preset.id), preset]
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(updated))
      }
      return true
    } catch {
      return false
    }
  },

  deletePreset: (presetId: string): boolean => {
    try {
      const all = desktopStorageUtils.getAllPresets().filter((p) => p.id !== presetId)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(all))
      }
      return true
    } catch {
      return false
    }
  },

  saveAutosave: (wallpaperId: string, data: DesktopEditorData): boolean => {
    try {
      const key = `${STORAGE_KEYS.AUTOSAVE}-${wallpaperId}`
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data))
      }
      return true
    } catch {
      return false
    }
  },

  getAutosave: (wallpaperId: string): DesktopEditorData | null => {
    try {
      const key = `${STORAGE_KEYS.AUTOSAVE}-${wallpaperId}`
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },
}

// 바탕화면 게시물 타입 (DB 응답용)
export interface DesktopWallpaperPost {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  backgroundUrlWindows: string | null
  backgroundUrlMac: string | null
  widthWindows: number
  heightWindows: number
  widthMac: number
  heightMac: number
  authorId: string
  createdAt: Date
  updatedAt: Date
}
