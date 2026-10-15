/**
 * Excel 화면 미리보기용 시트 모델(순수) — styles.xml·테마·시트 XML → 칸 위치·서식·표시 값. 그리기는 `render-xlsx.ts`.
 * 숫자 표시 서식(쉼표·통화·회계·백분율·날짜·시간)은 **미리보기에만** 적용한다 — 텍스트 추출(`office.ts` `readSheetRows`)은 원래 숫자를 유지한다.
 * 조건부 서식·차트·그림·표 스타일·틀 고정·메모는 그리지 않는다(P4-R2 범위 밖).
 */
import { columnIndex, elementChildren, formatNumber, parseXml } from './office'

/** 미리보기로 그리는 시트 크기 상한(추출은 전체) — 사용자 결정 2026-10-15 */
export const PREVIEW_MAX_ROWS = 500
export const PREVIEW_MAX_COLS = 100

/* ───────────── 색 ───────────── */

/** 테마 색 번호 순서(lt1·dk1·lt2·dk2·강조 1~6·하이퍼링크·열어 본 하이퍼링크) — 테마 파일이 없을 때 쓰는 Office 기본 테마 */
const THEME_ORDER = ['lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink']
const DEFAULT_THEME = ['FFFFFF', '000000', 'E7E6E6', '44546A', '4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47', '0563C1', '954F72']

/** 예전 색 번호(indexed) 0~63. 64는 시스템 글자색(검정), 65는 시스템 배경색(흰색) */
export const DEFAULT_INDEXED_COLORS = [
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080',
  '9999FF', '993366', 'FFFFCC', 'CCFFFF', '660066', 'FF8080', '0066CC', 'CCCCFF',
  '000080', 'FF00FF', 'FFFF00', '00FFFF', '800080', '800000', '008080', '0000FF',
  '00CCFF', 'CCFFFF', 'CCFFCC', 'FFFF99', '99CCFF', 'FF99CC', 'CC99FF', 'FFCC99',
  '3366FF', '33CCCC', '99CC00', 'FFCC00', 'FF9900', 'FF6600', '666699', '969696',
  '003366', '339966', '003300', '333300', '993300', '993366', '333399', '333333',
]

const HEX6 = /^[0-9a-f]{6}$/i

/** theme1.xml → 테마 색 12개(엑셀 번호 순서) */
export function readThemeColors(xml: string | null): string[] {
  if (!xml) return DEFAULT_THEME
  const scheme = parseXml(xml).getElementsByTagName('a:clrScheme')[0]
  if (!scheme) return DEFAULT_THEME
  return THEME_ORDER.map((tag, i) => {
    const color = elementChildren(scheme).find((e) => e.tagName === `a:${tag}`)
    const value = color && elementChildren(color)[0]
    const hex = value ? (value.tagName === 'a:sysClr' ? value.getAttribute('lastClr') : value.getAttribute('val')) : null
    return hex && HEX6.test(hex) ? hex.toUpperCase() : DEFAULT_THEME[i]
  })
}

/** 밝기 조정(tint, -1~1) — 엑셀과 같이 HSL의 L만 바꾼다 */
export function applyTint(hex: string, tint: number): string {
  const n = parseInt(hex, 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h /= 6
  }
  l = tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let rgb: number[]
  if (s === 0) rgb = [l, l, l]
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    rgb = [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)]
  }
  return rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

export interface ColorContext {
  theme: string[]
  indexed: string[]
}

/** `<color rgb|theme|indexed tint>` → `#RRGGBB`(자동·알 수 없음은 undefined) */
export function resolveColor(el: Element | undefined, ctx: ColorContext): string | undefined {
  if (!el) return undefined
  const auto = el.getAttribute('auto')
  if (auto === '1' || auto === 'true') return undefined
  let hex: string | undefined
  const rgb = el.getAttribute('rgb')
  const theme = el.getAttribute('theme')
  const indexed = el.getAttribute('indexed')
  if (rgb && /^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(rgb)) hex = rgb.slice(-6)
  else if (theme !== null) hex = ctx.theme[Number(theme)]
  else if (indexed !== null) {
    const i = Number(indexed)
    hex = i === 64 ? '000000' : i === 65 ? 'FFFFFF' : ctx.indexed[i]
  }
  if (!hex || !HEX6.test(hex)) return undefined
  const tint = Number(el.getAttribute('tint') ?? 0)
  return `#${(tint ? applyTint(hex, tint) : hex).toUpperCase()}`
}

/* ───────────── 서식(styles.xml) ───────────── */

export interface CellFont {
  name: string
  /** pt */
  size: number
  bold: boolean
  italic: boolean
  underline: 'single' | 'double' | null
  strike: boolean
  color?: string
}

export interface BorderSide {
  style: string
  color: string
}

export type BorderEdge = 'left' | 'right' | 'top' | 'bottom'
export type CellBorder = Partial<Record<BorderEdge, BorderSide>>

export interface CellXf {
  /** 표시 서식 문자열(기본 서식 번호는 문자열로 풀어 둔다) */
  numFmt: string
  font: number
  /** 채우기 색(없으면 undefined) */
  fill?: string
  border: number
  horizontal: string
  vertical: string
  wrap: boolean
  indent: number
}

export interface WorkbookStyles {
  fonts: CellFont[]
  borders: CellBorder[]
  xfs: CellXf[]
}

/** 기본 서식 번호 → 서식 문자열(한국어 Excel 기준). 없는 번호는 일반 */
const BUILTIN_FORMATS: Record<number, string> = {
  0: 'General',
  1: '0',
  2: '0.00',
  3: '#,##0',
  4: '#,##0.00',
  9: '0%',
  10: '0.00%',
  11: '0.00E+00',
  14: 'yyyy-mm-dd',
  15: 'd-mmm-yy',
  16: 'd-mmm',
  17: 'mmm-yy',
  18: 'h:mm AM/PM',
  19: 'h:mm:ss AM/PM',
  20: 'h:mm',
  21: 'h:mm:ss',
  22: 'yyyy-mm-dd h:mm',
  // 한국어 Excel 지역 서식(파일에 서식 문자열 없이 번호만 저장되는 경우)
  27: 'yyyy"년" m"월"',
  28: 'm"월" d"일"',
  29: 'm"월" d"일"',
  30: 'mm-dd-yy',
  31: 'yyyy"년" m"월" d"일"',
  32: 'h"시" mm"분"',
  33: 'h"시" mm"분" ss"초"',
  34: 'yyyy-mm-dd',
  35: 'yyyy-mm-dd',
  36: 'yyyy"년" m"월"',
  37: '#,##0 ;(#,##0)',
  38: '#,##0 ;[Red](#,##0)',
  39: '#,##0.00;(#,##0.00)',
  40: '#,##0.00;[Red](#,##0.00)',
  41: '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-',
  42: '_-"₩"* #,##0_-;-"₩"* #,##0_-;_-"₩"* "-"_-;_-@_-',
  43: '_-* #,##0.00_-;-* #,##0.00_-;_-* "-"??_-;_-@_-',
  44: '_-"₩"* #,##0.00_-;-"₩"* #,##0.00_-;_-"₩"* "-"??_-;_-@_-',
  45: 'mm:ss',
  46: '[h]:mm:ss',
  47: 'mm:ss.0',
  48: '##0.0E+0',
  49: '@',
  50: 'yyyy-mm-dd',
  51: 'm"월" d"일"',
  52: 'yyyy"년" m"월"',
  53: 'm"월" d"일"',
  54: 'm"월" d"일"',
  55: 'yyyy"년" m"월"',
  56: 'm"월" d"일"',
  57: 'yyyy-mm-dd',
  58: 'm"월" d"일"',
}

const DEFAULT_FONT: CellFont = { name: '맑은 고딕', size: 11, bold: false, italic: false, underline: null, strike: false }
const DEFAULT_XF: CellXf = { numFmt: 'General', font: 0, border: 0, horizontal: 'general', vertical: 'bottom', wrap: false, indent: 0 }

const child = (el: Element, tag: string) => elementChildren(el).find((e) => e.tagName === tag)
const flag = (el: Element | undefined) => !!el && el.getAttribute('val') !== '0' && el.getAttribute('val') !== 'false'

/** styles.xml → 글꼴·테두리·셀 서식(xf) 표 */
export function readWorkbookStyles(xml: string | null, theme: string[]): WorkbookStyles {
  if (!xml) return { fonts: [DEFAULT_FONT], borders: [{}], xfs: [DEFAULT_XF] }
  const doc = parseXml(xml)
  const root = doc.documentElement
  const indexed = [...DEFAULT_INDEXED_COLORS]
  const custom = doc.getElementsByTagName('indexedColors')[0]
  if (custom) {
    elementChildren(custom).forEach((c, i) => {
      const rgb = c.getAttribute('rgb')
      if (rgb && /^[0-9a-f]{6,8}$/i.test(rgb)) indexed[i] = rgb.slice(-6)
    })
  }
  const ctx: ColorContext = { theme, indexed }
  const list = (tag: string) => {
    const box = child(root, tag)
    return box ? elementChildren(box) : []
  }

  const fonts = list('fonts').map((f): CellFont => {
    const u = child(f, 'u')
    const uVal = u?.getAttribute('val') ?? 'single'
    return {
      name: child(f, 'name')?.getAttribute('val') ?? DEFAULT_FONT.name,
      size: Number(child(f, 'sz')?.getAttribute('val') ?? 11) || 11,
      bold: flag(child(f, 'b')),
      italic: flag(child(f, 'i')),
      underline: !u || uVal === 'none' ? null : uVal.startsWith('double') ? 'double' : 'single',
      strike: flag(child(f, 'strike')),
      color: resolveColor(child(f, 'color'), ctx),
    }
  })

  const fills = list('fills').map((f): string | undefined => {
    const pattern = child(f, 'patternFill')
    if (pattern) {
      const type = pattern.getAttribute('patternType') ?? 'none'
      if (type === 'none') return undefined
      // 무늬 채우기는 전경색으로 근사(gray125 기본 채우기처럼 색이 없으면 그리지 않음)
      return resolveColor(child(pattern, 'fgColor'), ctx) ?? (type === 'solid' ? undefined : resolveColor(child(pattern, 'bgColor'), ctx))
    }
    const gradient = child(f, 'gradientFill')
    const stop = gradient && child(gradient, 'stop')
    return stop ? resolveColor(child(stop, 'color'), ctx) : undefined
  })

  const borders = list('borders').map((b): CellBorder => {
    const out: CellBorder = {}
    const sides: [BorderEdge, string[]][] = [
      ['left', ['left', 'start']],
      ['right', ['right', 'end']],
      ['top', ['top']],
      ['bottom', ['bottom']],
    ]
    for (const [edge, tags] of sides) {
      const el = elementChildren(b).find((e) => tags.includes(e.tagName))
      const style = el?.getAttribute('style')
      if (el && style && style !== 'none') out[edge] = { style, color: resolveColor(child(el, 'color'), ctx) ?? '#000000' }
    }
    return out
  })

  const numFmts = new Map<number, string>()
  for (const f of list('numFmts')) numFmts.set(Number(f.getAttribute('numFmtId')), f.getAttribute('formatCode') ?? 'General')

  const xfs = list('cellXfs').map((xf): CellXf => {
    const id = Number(xf.getAttribute('numFmtId') ?? 0)
    const align = child(xf, 'alignment')
    return {
      numFmt: numFmts.get(id) ?? BUILTIN_FORMATS[id] ?? 'General',
      font: Number(xf.getAttribute('fontId') ?? 0),
      fill: fills[Number(xf.getAttribute('fillId') ?? 0)],
      border: Number(xf.getAttribute('borderId') ?? 0),
      horizontal: align?.getAttribute('horizontal') ?? 'general',
      vertical: align?.getAttribute('vertical') ?? 'bottom',
      wrap: align?.getAttribute('wrapText') === '1' || align?.getAttribute('wrapText') === 'true',
      indent: Number(align?.getAttribute('indent') ?? 0) || 0,
    }
  })

  return { fonts: fonts.length ? fonts : [DEFAULT_FONT], borders: borders.length ? borders : [{}], xfs: xfs.length ? xfs : [DEFAULT_XF] }
}

/* ───────────── 표시 서식 ───────────── */

export interface FormattedValue {
  text: string
  /** 서식의 색 지정(`[Red]` 등) */
  color?: string
  /** 회계 서식의 채움(`*`) — [왼쪽, 오른쪽]으로 나눠 칸 양 끝에 붙인다(₩ 기호는 왼쪽, 숫자는 오른쪽) */
  split?: [string, string]
}

const FORMAT_COLORS: Record<string, string> = {
  black: '#000000',
  blue: '#0000FF',
  cyan: '#00FFFF',
  green: '#00FF00',
  magenta: '#FF00FF',
  red: '#FF0000',
  white: '#FFFFFF',
  yellow: '#FFFF00',
}

/** 서식 문자열을 구역(;)으로 나눈다 — 따옴표·대괄호·이스케이프 안의 ;는 무시 */
export function splitFormatSections(code: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  let bracket = false
  for (let i = 0; i < code.length; i++) {
    const ch = code[i]
    if (ch === '\\' && !quoted) {
      cur += ch + (code[i + 1] ?? '')
      i++
      continue
    }
    if (ch === '"') quoted = !quoted
    else if (!quoted && ch === '[') bracket = true
    else if (!quoted && ch === ']') bracket = false
    if (ch === ';' && !quoted && !bracket) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

type Token = { kind: 'lit'; text: string } | { kind: 'fill' } | { kind: 'code'; text: string }

/** 구역 → 글자 조각. 따옴표·`\x`는 글자, `_x`는 공백, `*x`는 채움, 대괄호(색·통화·조건)는 따로 처리 */
function tokenize(section: string): { tokens: Token[]; color?: string; condition?: [string, number] } {
  const tokens: Token[] = []
  let color: string | undefined
  let condition: [string, number] | undefined
  const lit = (text: string) => {
    const last = tokens[tokens.length - 1]
    if (last?.kind === 'lit') last.text += text
    else tokens.push({ kind: 'lit', text })
  }
  for (let i = 0; i < section.length; i++) {
    const ch = section[i]
    if (ch === '"') {
      const end = section.indexOf('"', i + 1)
      lit(section.slice(i + 1, end < 0 ? undefined : end))
      i = end < 0 ? section.length : end
    } else if (ch === '\\') {
      lit(section[i + 1] ?? '')
      i++
    } else if (ch === '_') {
      lit(' ')
      i++
    } else if (ch === '*') {
      tokens.push({ kind: 'fill' })
      i++
    } else if (ch === '[') {
      const end = section.indexOf(']', i)
      const inner = section.slice(i + 1, end < 0 ? undefined : end)
      i = end < 0 ? section.length : end
      const lower = inner.toLowerCase()
      if (FORMAT_COLORS[lower]) color = FORMAT_COLORS[lower]
      else if (inner.startsWith('$')) {
        // 통화·지역 [$₩-412] → ₩, [$-412] → 없음
        const symbol = inner.slice(1).split('-')[0]
        if (symbol) lit(symbol)
      } else if (/^(<=|>=|<>|<|>|=)/.test(inner)) {
        const m = inner.match(/^(<=|>=|<>|<|>|=)\s*(-?[\d.]+)/)
        if (m) condition = [m[1], Number(m[2])]
      } else if (/^(h+|m+|s+)$/i.test(inner)) tokens.push({ kind: 'code', text: `[${lower}]` })
      // 그 밖(Color10, DBNum 등)은 무시
    } else tokens.push({ kind: 'code', text: ch })
  }
  // 이어진 code 글자를 하나로 합친다
  const merged: Token[] = []
  for (const t of tokens) {
    const last = merged[merged.length - 1]
    if (t.kind === 'code' && last?.kind === 'code' && !t.text.startsWith('[')) last.text += t.text
    else merged.push(t)
  }
  return { tokens: merged, color, condition }
}

const isDateCode = (codes: string) => /[ydhs]|\[h|\[m|\[s|aaa/i.test(codes) || (/m/i.test(codes) && !/[0#?]/.test(codes))

const testCondition = ([op, v]: [string, number], n: number) =>
  op === '<' ? n < v : op === '<=' ? n <= v : op === '>' ? n > v : op === '>=' ? n >= v : op === '<>' ? n !== v : n === v

/** 같은 구역 선택 규칙 — 양수/음수/0(/글자). 구역이 하나면 음수는 앞에 -를 붙인다 */
function pickSection(sections: string[], n: number): { section: string; abs: boolean; sign: boolean } {
  const parsed = sections.map((s) => tokenize(s))
  if (parsed.some((p) => p.condition)) {
    const numeric = sections.slice(0, 3)
    for (let i = 0; i < numeric.length; i++) {
      const c = parsed[i].condition
      if (c && testCondition(c, n)) return { section: sections[i], abs: n < 0, sign: false }
    }
    const fallback = numeric.findIndex((_, i) => !parsed[i].condition)
    if (fallback >= 0) return { section: sections[fallback], abs: n < 0, sign: n < 0 }
    return { section: 'General', abs: false, sign: false }
  }
  if (n < 0 && sections.length >= 2) return { section: sections[1], abs: true, sign: false }
  if (n === 0 && sections.length >= 3) return { section: sections[2], abs: false, sign: false }
  return { section: sections[0], abs: n < 0, sign: n < 0 }
}

/** 일반 서식 — 정수는 그대로, 소수는 유효숫자 11자리(엑셀 기본 칸 너비 기준) */
function formatGeneral(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e11) return String(n)
  if (Math.abs(n) >= 1e11 || (n !== 0 && Math.abs(n) < 1e-9)) {
    const [m, e] = n.toExponential(5).split('e')
    return `${m.replace(/\.?0+$/, '')}E${Number(e) < 0 ? '-' : '+'}${String(Math.abs(Number(e))).padStart(2, '0')}`
  }
  return formatNumber(String(Number(n.toPrecision(11))))
}

/** 숫자 자리 표시(0 # ? , .) 부분 서식 */
function formatDigits(value: number, pattern: string, percent: number): string {
  let p = pattern
  let v = value * 100 ** percent
  // 끝 쉼표는 1,000 단위 나누기
  while (/[0#?],$/.test(p)) {
    p = p.slice(0, -1)
    v /= 1000
  }
  const exp = p.match(/[Ee][+-]/)
  if (exp) {
    const [mant, expDigits] = p.split(/[Ee][+-]/)
    const decimals = (mant.split('.')[1] ?? '').replace(/[^0#?]/g, '').length
    const [m, e] = v.toExponential(decimals).split('e')
    const en = Number(e)
    const sign = en < 0 ? '-' : exp[0][1] === '+' ? '+' : ''
    return `${m}E${sign}${String(Math.abs(en)).padStart(expDigits.replace(/[^0]/g, '').length, '0')}`
  }
  const grouping = /[0#?],[0#?]/.test(p)
  const [intPat, fracPat] = p.split('.')
  const maxFrac = (fracPat ?? '').replace(/[^0#?]/g, '').length
  const minFrac = (fracPat ?? '').replace(/[^0]/g, '').length
  const minInt = intPat.replace(/[^0]/g, '').length
  let [i, f = ''] = v.toFixed(maxFrac).split('.')
  while (f.length > minFrac && f.endsWith('0')) f = f.slice(0, -1)
  if (i === '0' && minInt === 0) i = ''
  i = i.padStart(minInt, '0')
  if (grouping) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fracPat !== undefined ? `${i}.${f}` : i
}

/** 정수를 자리 표시에 오른쪽부터 채운다 — 남는 앞자리는 첫 자리 표시 앞에 붙인다 */
function fillDigitPattern(value: number, pattern: string): string {
  let digits = String(value)
  const out: string[] = []
  const first = pattern.search(/[0#?]/)
  for (let i = pattern.length - 1; i >= 0; i--) {
    const ch = pattern[i]
    if (!/[0#?]/.test(ch)) {
      // 남은 숫자도 없고 앞에 0 자리도 없으면 구분 글자는 생략
      if (digits || /0/.test(pattern.slice(0, i))) out.unshift(ch)
      continue
    }
    if (digits) {
      out.unshift(i === first ? digits : digits.slice(-1))
      digits = i === first ? '' : digits.slice(0, -1)
    } else if (ch === '0') out.unshift('0')
    else if (ch === '?') out.unshift(' ')
  }
  return out.join('')
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

/** 날짜·시간 서식. 일련번호는 1900 체계(date1904면 1462일 더함) */
function formatDate(serial: number, tokens: Token[], date1904: boolean): string {
  const codeText = tokens.map((t) => (t.kind === 'code' ? t.text : '')).join('')
  const fracDigits = codeText.match(/s+\.(0+)/i)?.[1].length ?? 0
  const days = serial + (date1904 ? 1462 : 0)
  // 표시 자리에 맞춰 반올림(초 단위, 소수 초 표시가 있으면 그만큼)
  const unit = 1000 / 10 ** fracDigits
  const ms = Math.round((days * 86400000) / unit) * unit
  const d = new Date(ms - 25569 * 86400000)
  const elapsedMs = Math.round((serial * 86400000) / unit) * unit
  const hour12 = /AM\/PM|A\/P|오전\/오후/i.test(codeText)
  const pad = (v: number, n = 2) => String(v).padStart(n, '0')

  // code 조각을 날짜 기호로 나눈다
  type Part = { kind: 'lit'; text: string } | { kind: 'sym'; text: string }
  const parts: Part[] = []
  for (const t of tokens) {
    if (t.kind === 'lit') parts.push({ kind: 'lit', text: t.text })
    else if (t.kind === 'code') {
      const re = /\[[hms]+\]|AM\/PM|A\/P|y+|m+|d+|h+|s+|a{3,}|\.0+|e+|g+|./gi
      for (const m of t.text.match(re) ?? []) {
        if (/^(\[[hms]+\]|AM\/PM|A\/P|y+|m+|d+|h+|s+|a{3,}|\.0+)$/i.test(m)) parts.push({ kind: 'sym', text: m })
        else parts.push({ kind: 'lit', text: m })
      }
    }
  }
  // m은 앞에 h, 뒤에 s가 오면 분
  const syms = parts.map((p, i) => ({ p, i })).filter((x) => x.p.kind === 'sym')
  const isMinute = (idx: number) => {
    const pos = syms.findIndex((x) => x.i === idx)
    const prev = syms[pos - 1]?.p.text.toLowerCase() ?? ''
    const next = syms[pos + 1]?.p.text.toLowerCase() ?? ''
    return prev.startsWith('h') || prev.startsWith('[h') || next.startsWith('s') || next.startsWith('[s')
  }

  return parts
    .map((part, idx) => {
      if (part.kind === 'lit') return part.text
      const s = part.text
      const lower = s.toLowerCase()
      const H = d.getUTCHours()
      if (lower.startsWith('[h')) return pad(Math.floor(elapsedMs / 3600000), lower.length - 2)
      if (lower.startsWith('[m')) return pad(Math.floor(elapsedMs / 60000), lower.length - 2)
      if (lower.startsWith('[s')) return pad(Math.floor(elapsedMs / 1000), lower.length - 2)
      if (lower === 'am/pm') return H < 12 ? 'AM' : 'PM'
      if (lower === 'a/p') return H < 12 ? 'A' : 'P'
      if (lower.startsWith('.')) return `.${pad(Math.floor((ms % 1000) / unit), fracDigits)}`
      if (lower[0] === 'y') return lower.length <= 2 ? pad(d.getUTCFullYear() % 100) : String(d.getUTCFullYear())
      if (lower[0] === 'm' && isMinute(idx)) return lower.length >= 2 ? pad(d.getUTCMinutes()) : String(d.getUTCMinutes())
      if (lower[0] === 'm') {
        const mon = d.getUTCMonth()
        if (lower.length === 1) return String(mon + 1)
        if (lower.length === 2) return pad(mon + 1)
        if (lower.length === 3) return MONTHS[mon].slice(0, 3)
        if (lower.length === 5) return MONTHS[mon][0]
        return MONTHS[mon]
      }
      if (lower[0] === 'd') {
        if (lower.length === 1) return String(d.getUTCDate())
        if (lower.length === 2) return pad(d.getUTCDate())
        if (lower.length === 3) return DAYS[d.getUTCDay()].slice(0, 3)
        return DAYS[d.getUTCDay()]
      }
      if (lower[0] === 'a') return lower.length === 3 ? DAYS_KO[d.getUTCDay()] : `${DAYS_KO[d.getUTCDay()]}요일`
      if (lower[0] === 'h') {
        const h = hour12 ? H % 12 || 12 : H
        return lower.length >= 2 ? pad(h) : String(h)
      }
      if (lower[0] === 's') return lower.length >= 2 ? pad(d.getUTCSeconds()) : String(d.getUTCSeconds())
      return s
    })
    .join('')
}

/** 숫자 칸 표시 값 — 해석하지 못한 서식은 일반 서식으로 */
export function formatCellNumber(value: number, code: string, date1904 = false): FormattedValue {
  if (!code || /^general$/i.test(code.trim())) return { text: formatGeneral(value) }
  try {
    const sections = splitFormatSections(code)
    const { section, abs, sign } = pickSection(sections, value)
    if (/^general$/i.test(section.trim())) return { text: (sign ? '-' : '') + formatGeneral(Math.abs(value)) }
    const { tokens, color } = tokenize(section)
    const codes = tokens.map((t) => (t.kind === 'code' ? t.text : '')).join('')
    const n = abs ? Math.abs(value) : value
    let text: string
    if (isDateCode(codes)) {
      if (value < 0) return { text: formatGeneral(value) }
      text = formatDate(value, tokens, date1904)
    } else if (codes.includes('@')) {
      return { text: formatGeneral(value) }
    } else {
      const percent = (codes.match(/%/g) ?? []).length
      // 자리 표시 앞뒤의 글자는 그대로, 사이의 글자(전화번호 형식 등)는 지원하지 않음 → 일반
      const out: string[] = []
      let numberDone = false
      for (const t of tokens) {
        if (t.kind === 'lit') out.push(t.text)
        else if (t.kind === 'fill') out.push('\u0000')
        else {
          const m = t.text.match(/^([^0#?.,]*)([0#?.,]*(?:[Ee][+-][0#]+)?[0#?.,]*)(.*)$/)
          const [, before = '', digits = '', after = ''] = m ?? []
          if (/[0#?]/.test(after) && /^[0#?\-\s()/]+$/.test(t.text)) {
            // 자리 표시 사이에 글자가 있는 정수 서식(전화번호 000-0000-0000 등)
            if (numberDone) return { text: formatGeneral(value) }
            numberDone = true
            out.push(fillDigitPattern(Math.round(Math.abs(n)), t.text))
          } else if (digits && /[0#?]/.test(digits)) {
            if (numberDone || /[0#?]/.test(after)) return { text: formatGeneral(value) }
            numberDone = true
            out.push(before, formatDigits(Math.abs(n), digits, percent), after)
          } else if (/general/i.test(t.text)) out.push(t.text.replace(/general/i, formatGeneral(Math.abs(n))))
          else out.push(t.text)
        }
      }
      text = out.join('')
      if (sign) {
        const fill = text.indexOf('\u0000')
        // 회계처럼 채움이 있으면 숫자 쪽(채움 뒤)에, 아니면 맨 앞에 붙인다
        text = fill >= 0 ? `${text.slice(0, fill + 1)}-${text.slice(fill + 1)}` : `-${text}`
      }
    }
    const fill = text.indexOf('\u0000')
    if (fill >= 0) {
      const left = text.slice(0, fill).trimEnd()
      const right = text.slice(fill + 1).replace(/\u0000/g, '')
      return { text: `${left}${right}`.trim(), color, split: [left.trimStart(), right.trim()] }
    }
    return { text: text.replace(/\s+$/, ''), color }
  } catch {
    return { text: formatGeneral(value) }
  }
}

/** 글자 칸 표시 값 — 서식에 글자 구역(`@`)이 있으면 앞뒤 글자를 붙인다(`@"님"` 등) */
export function formatCellText(value: string, code: string): FormattedValue {
  const sections = splitFormatSections(code)
  const section = sections.length >= 4 ? sections[3] : sections.length === 1 && sections[0].includes('@') ? sections[0] : null
  if (!section) return { text: value }
  const { tokens, color } = tokenize(section)
  const text = tokens.map((t) => (t.kind === 'lit' ? t.text : t.kind === 'code' ? t.text.replace(/@/g, value) : '')).join('')
  return { text: text.trim() === '' ? value : text.replace(/^ +| +$/g, ''), color }
}

/* ───────────── 시트 모델 ───────────── */

export type CellKind = 'number' | 'text' | 'bool' | 'error'

export interface SheetCell {
  r: number
  c: number
  /** 화면에 보일 글자(빈 칸은 '') */
  text: string
  kind: CellKind
  style: number
  color?: string
  split?: [string, string]
}

/** 0부터 번호, 끝 포함 */
export interface CellRange {
  r1: number
  c1: number
  r2: number
  c2: number
}

export interface SheetModel {
  rows: number
  cols: number
  /** 열 왼쪽 x(px) — 길이 cols + 1, 마지막은 전체 너비. 숨긴 열은 너비 0 */
  colX: number[]
  /** 행 위쪽 y(px) — 길이 rows + 1 */
  rowY: number[]
  /** 그릴 범위 안의 칸(값 또는 채우기·테두리가 있는 칸) */
  cells: Map<number, SheetCell>
  merges: CellRange[]
  /** 칸이 속한 병합 영역 */
  mergeAt: Map<number, CellRange>
  /** 행·열 전체 서식(칸 요소가 없는 자리의 채우기용) */
  rowStyles: Map<number, number>
  colStyles: Map<number, number>
  showGrid: boolean
  showHeaders: boolean
  /** 상한을 넘어 일부만 그렸는가 */
  truncated: { rows: boolean; cols: boolean }
}

export const cellKey = (r: number, c: number) => r * 20000 + c

/** 열 번호(0부터) → 이름(A, B, … AA) */
export function columnName(index: number): string {
  let n = index + 1
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/** `B5` → { r: 4, c: 1 } */
export function parseCellRef(ref: string): { r: number; c: number } | null {
  const m = ref.match(/^\$?([A-Z]+)\$?(\d+)$/i)
  if (!m) return null
  return { r: Number(m[2]) - 1, c: columnIndex(m[1]) }
}

/** 열 너비(문자 수 단위) → px. 기본 글꼴 숫자 폭(mdw)은 맑은 고딕 11pt 8px, Calibri 11pt 7px */
export const columnWidthPx = (width: number, mdw: number) => Math.max(0, Math.trunc(width * mdw + 0.5))
/** 행 높이 pt → px(96dpi) */
export const rowHeightPx = (pt: number) => Math.round((pt * 4) / 3)

/** 기본 글꼴의 숫자 폭(px) — 한글 글꼴은 8, 그 밖은 7(11pt 기준, 크기에 비례) */
export function maxDigitWidth(font: CellFont): number {
  const cjk = /맑은|돋움|굴림|바탕|궁서|나눔|malgun|gulim|dotum|batang|gungsuh|nanum|gothic|mincho|simsun|ming/i.test(font.name)
  return Math.max(5, Math.round(((cjk ? 8 : 7) * font.size) / 11))
}

export interface SheetContext {
  shared: string[]
  styles: WorkbookStyles
  date1904: boolean
  /** 기본 글꼴 숫자 폭(px) */
  mdw: number
  maxRows?: number
  maxCols?: number
}

const hasDecoration = (styles: WorkbookStyles, s: number) => {
  const xf = styles.xfs[s]
  if (!xf) return false
  const b = styles.borders[xf.border]
  return !!xf.fill || !!(b && (b.left || b.right || b.top || b.bottom))
}

/** 시트 XML → 미리보기 모델. 그리는 범위는 A1부터 값·채우기·테두리·병합이 있는 마지막 칸까지(서식만 있는 빈 칸 제외) */
export function readSheetModel(xml: string, ctx: SheetContext): SheetModel {
  const maxRows = ctx.maxRows ?? PREVIEW_MAX_ROWS
  const maxCols = ctx.maxCols ?? PREVIEW_MAX_COLS
  const doc = parseXml(xml)
  const root = doc.documentElement
  const { styles } = ctx

  const view = doc.getElementsByTagName('sheetView')[0]
  const showGrid = view?.getAttribute('showGridLines') !== '0' && view?.getAttribute('showGridLines') !== 'false'
  const showHeaders = view?.getAttribute('showRowColHeaders') !== '0' && view?.getAttribute('showRowColHeaders') !== 'false'

  const format = child(root, 'sheetFormatPr')
  const defaultColWidth = format?.getAttribute('defaultColWidth')
  const baseColWidth = Number(format?.getAttribute('baseColWidth') ?? 8)
  const defaultColPx = defaultColWidth ? columnWidthPx(Number(defaultColWidth), ctx.mdw) : baseColWidth === 8 && ctx.mdw === 7 ? 64 : baseColWidth * ctx.mdw + 5
  const defaultRowPx = rowHeightPx(Number(format?.getAttribute('defaultRowHeight') ?? 15) || 15)

  // 열 너비·숨김·서식(상한까지만)
  const colPx = new Map<number, number>()
  const colStyles = new Map<number, number>()
  const cols = child(root, 'cols')
  for (const col of cols ? elementChildren(cols) : []) {
    const min = Number(col.getAttribute('min') ?? 1) - 1
    const max = Math.min(Number(col.getAttribute('max') ?? min + 1) - 1, maxCols - 1)
    const hidden = col.getAttribute('hidden') === '1' || col.getAttribute('hidden') === 'true'
    const width = col.getAttribute('width')
    const style = col.getAttribute('style')
    for (let c = min; c <= max; c++) {
      if (hidden) colPx.set(c, 0)
      else if (width !== null) colPx.set(c, columnWidthPx(Number(width), ctx.mdw))
      if (style !== null && hasDecoration(styles, Number(style))) colStyles.set(c, Number(style))
    }
  }

  const rowPx = new Map<number, number>()
  const rowStyles = new Map<number, number>()
  const cells = new Map<number, SheetCell>()
  let lastRow = -1
  let lastCol = -1
  const sheetData = child(root, 'sheetData')
  let nextRow = 0
  for (const row of sheetData ? elementChildren(sheetData).filter((e) => e.tagName === 'row') : []) {
    const r = row.getAttribute('r') ? Number(row.getAttribute('r')) - 1 : nextRow
    nextRow = r + 1
    if (r < maxRows) {
      const hidden = row.getAttribute('hidden') === '1' || row.getAttribute('hidden') === 'true'
      const ht = row.getAttribute('ht')
      if (hidden) rowPx.set(r, 0)
      else if (ht !== null) rowPx.set(r, rowHeightPx(Number(ht)))
      const rs = row.getAttribute('s')
      if (rs !== null && (row.getAttribute('customFormat') === '1' || row.getAttribute('customFormat') === 'true') && hasDecoration(styles, Number(rs))) rowStyles.set(r, Number(rs))
    }
    let nextCol = 0
    for (const c of elementChildren(row).filter((e) => e.tagName === 'c')) {
      const ref = c.getAttribute('r')
      const col = ref ? (parseCellRef(ref)?.c ?? nextCol) : nextCol
      nextCol = col + 1
      const style = Number(c.getAttribute('s') ?? 0)
      const xf = styles.xfs[style] ?? styles.xfs[0]
      const type = c.getAttribute('t')
      const v = child(c, 'v')?.textContent ?? ''
      let cell: Omit<SheetCell, 'r' | 'c' | 'style'> = { text: '', kind: 'text' }
      if (type === 's') cell = { ...formatCellText(ctx.shared[Number(v)] ?? '', xf.numFmt), kind: 'text' }
      else if (type === 'inlineStr') cell = { ...formatCellText(Array.from(c.getElementsByTagName('t')).map((t) => t.textContent ?? '').join(''), xf.numFmt), kind: 'text' }
      else if (type === 'str') cell = { ...formatCellText(v, xf.numFmt), kind: 'text' }
      else if (type === 'b') cell = { text: v === '1' ? 'TRUE' : v === '0' ? 'FALSE' : v, kind: 'bool' }
      else if (type === 'e') cell = { text: v, kind: 'error' }
      else if (type === 'd') cell = { text: v, kind: 'number' }
      else if (v !== '' && Number.isFinite(Number(v))) cell = { ...formatCellNumber(Number(v), xf.numFmt, ctx.date1904), kind: 'number' }
      else if (v !== '') cell = { text: v, kind: 'text' }
      if (cell.text === '' && !hasDecoration(styles, style)) continue
      lastRow = Math.max(lastRow, r)
      lastCol = Math.max(lastCol, col)
      if (r < maxRows && col < maxCols) cells.set(cellKey(r, col), { r, c: col, style, ...cell })
    }
  }

  const merges: CellRange[] = []
  const mergeCells = child(root, 'mergeCells')
  for (const m of mergeCells ? elementChildren(mergeCells) : []) {
    const [a, b] = (m.getAttribute('ref') ?? '').split(':')
    const p = a ? parseCellRef(a) : null
    const q = b ? parseCellRef(b) : null
    if (!p || !q) continue
    const range = { r1: Math.min(p.r, q.r), c1: Math.min(p.c, q.c), r2: Math.max(p.r, q.r), c2: Math.max(p.c, q.c) }
    if (range.r1 === range.r2 && range.c1 === range.c2) continue
    // 글자·채우기·테두리가 없는 빈 병합은 보이지 않으므로 그리는 범위에 넣지 않는다
    if (!cells.has(cellKey(range.r1, range.c1))) continue
    lastRow = Math.max(lastRow, range.r2)
    lastCol = Math.max(lastCol, range.c2)
    if (range.r1 < maxRows && range.c1 < maxCols) merges.push({ ...range, r2: Math.min(range.r2, maxRows - 1), c2: Math.min(range.c2, maxCols - 1) })
  }

  const rows = Math.min(lastRow + 1, maxRows)
  const colsCount = Math.min(lastCol + 1, maxCols)
  const colX = [0]
  for (let c = 0; c < colsCount; c++) colX.push(colX[c] + (colPx.get(c) ?? defaultColPx))
  const rowY = [0]
  for (let r = 0; r < rows; r++) rowY.push(rowY[r] + (rowPx.get(r) ?? defaultRowPx))

  const mergeAt = new Map<number, CellRange>()
  for (const m of merges) for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) mergeAt.set(cellKey(r, c), m)

  return {
    rows,
    cols: colsCount,
    colX,
    rowY,
    cells,
    merges,
    mergeAt,
    rowStyles,
    colStyles,
    showGrid,
    showHeaders,
    truncated: { rows: lastRow + 1 > maxRows, cols: lastCol + 1 > maxCols },
  }
}

/** 가로 정렬 — 일반(general)은 숫자 오른쪽, 참/거짓·오류 가운데, 글자 왼쪽 */
export function effectiveHorizontal(cell: SheetCell, xf: CellXf): string {
  if (xf.horizontal !== 'general') return xf.horizontal
  return cell.kind === 'number' ? 'right' : cell.kind === 'text' ? 'left' : 'center'
}

/**
 * 글자 영역(px) — 줄 바꿈이 없는 글자 칸은 Excel처럼 옆 빈 칸으로 넘쳐 보이게 영역을 넓힌다
 * (왼쪽 정렬은 오른쪽으로, 오른쪽 정렬은 왼쪽으로, 가운데는 양쪽 같은 폭). 숫자·병합 칸은 넓히지 않는다.
 */
export function textArea(model: SheetModel, cell: SheetCell, xf: CellXf): { x: number; width: number } {
  const x = model.colX[cell.c]
  const width = model.colX[cell.c + 1] - x
  const align = effectiveHorizontal(cell, xf)
  if (cell.kind !== 'text' || xf.wrap || model.mergeAt.has(cellKey(cell.r, cell.c)) || !['left', 'right', 'center'].includes(align)) return { x, width }
  const free = (c: number) => {
    if (c < 0 || c >= model.cols || model.mergeAt.has(cellKey(cell.r, c))) return false
    const other = model.cells.get(cellKey(cell.r, c))
    return !other || other.text === ''
  }
  let right = cell.c
  while ((align === 'left' || align === 'center') && free(right + 1)) right++
  let left = cell.c
  while ((align === 'right' || align === 'center') && free(left - 1)) left--
  if (align === 'left') return { x, width: model.colX[right + 1] - x }
  if (align === 'right') return { x: model.colX[left], width: model.colX[cell.c + 1] - model.colX[left] }
  const extra = Math.min(x - model.colX[left], model.colX[right + 1] - (x + width))
  return { x: x - extra, width: width + extra * 2 }
}
