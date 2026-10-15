/**
 * PowerPoint 화면 미리보기용 계산(순수) — 테마 색·색 변형, 글자 서식 이어받기, 도형 경로, 글머리 기호·자동 번호. 그리기는 `render-pptx.ts`.
 * 단위: EMU(1px = 9,525 EMU, 96dpi), 글자 크기는 1/100pt, 각도는 1/60,000도.
 */
import { elementChildren } from './office'

export const EMU_PER_PX = 9525
export const emuToPx = (emu: number) => emu / EMU_PER_PX

/** 미리보기로 그리는 슬라이드 수 상한(추출은 전체) — PDF 50쪽 상한과 같음 */
export const PREVIEW_MAX_SLIDES = 50

export const child = (el: Element | null | undefined, tag: string) => (el ? elementChildren(el).find((e) => e.tagName === tag) : undefined)
export const children = (el: Element | null | undefined, tag: string) => (el ? elementChildren(el).filter((e) => e.tagName === tag) : [])
export const num = (el: Element | null | undefined, attr: string): number | undefined => {
  const v = el?.getAttribute(attr)
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/* ───────────── 테마 ───────────── */

export interface PptxTheme {
  /** dk1·lt1·dk2·lt2·accent1~6·hlink·folHlink → RRGGBB */
  colors: Record<string, string>
  /** 주 글꼴(+mj)·본문 글꼴(+mn) — 라틴·동아시아 */
  fonts: { major: { latin: string; ea: string }; minor: { latin: string; ea: string } }
  /** 선 스타일 굵기(EMU) — lnRef idx 1부터 */
  lineWidths: number[]
}

const DEFAULT_COLORS: Record<string, string> = {
  dk1: '000000', lt1: 'FFFFFF', dk2: '44546A', lt2: 'E7E6E6',
  accent1: '4472C4', accent2: 'ED7D31', accent3: 'A5A5A5', accent4: 'FFC000', accent5: '5B9BD5', accent6: '70AD47',
  hlink: '0563C1', folHlink: '954F72',
}

export function readPptxTheme(doc: Document | null): PptxTheme {
  const colors = { ...DEFAULT_COLORS }
  const fonts = { major: { latin: 'Calibri Light', ea: '' }, minor: { latin: 'Calibri', ea: '' } }
  const lineWidths = [9525, 25400, 38100]
  if (!doc) return { colors, fonts, lineWidths }
  const scheme = doc.getElementsByTagName('a:clrScheme')[0]
  for (const el of scheme ? elementChildren(scheme) : []) {
    const name = el.tagName.replace(/^a:/, '')
    const v = elementChildren(el)[0]
    const hex = v ? (v.tagName === 'a:sysClr' ? v.getAttribute('lastClr') : v.getAttribute('val')) : null
    if (hex && /^[0-9a-f]{6}$/i.test(hex)) colors[name] = hex.toUpperCase()
  }
  for (const [key, tag] of [['major', 'a:majorFont'], ['minor', 'a:minorFont']] as const) {
    const f = doc.getElementsByTagName(tag)[0]
    if (!f) continue
    fonts[key].latin = child(f, 'a:latin')?.getAttribute('typeface') || fonts[key].latin
    const ea = child(f, 'a:ea')?.getAttribute('typeface')
    // 동아시아 글꼴이 비어 있으면 한국어 글꼴 목록(a:font script="Hang")
    const hang = children(f, 'a:font').find((x) => x.getAttribute('script') === 'Hang')?.getAttribute('typeface')
    fonts[key].ea = ea || hang || ''
  }
  const lnList = doc.getElementsByTagName('a:lnStyleLst')[0]
  if (lnList) {
    const widths = children(lnList, 'a:ln').map((l) => num(l, 'w') ?? 9525)
    if (widths.length) lineWidths.splice(0, lineWidths.length, ...widths)
  }
  return { colors, fonts, lineWidths }
}

/* ───────────── 색 ───────────── */

export interface ColorContext {
  theme: PptxTheme
  /** 색 이름 대응(bg1 → lt1, tx1 → dk1 …) — 마스터 clrMap(슬라이드가 덮어쓸 수 있음) */
  clrMap: Record<string, string>
  /** phClr(스타일 참조 색) */
  phClr?: string
}

export const DEFAULT_CLR_MAP: Record<string, string> = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' }

export function readClrMap(el: Element | undefined): Record<string, string> {
  if (!el) return { ...DEFAULT_CLR_MAP }
  const map: Record<string, string> = { ...DEFAULT_CLR_MAP }
  for (const attr of Array.from(el.attributes)) map[attr.name] = attr.value
  return map
}

const PRESET_COLORS: Record<string, string> = {
  black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', gray: '808080', grey: '808080',
  darkGray: 'A9A9A9', lightGray: 'D3D3D3', orange: 'FFA500', purple: '800080', navy: '000080', silver: 'C0C0C0', cyan: '00FFFF', magenta: 'FF00FF',
}

type RGB = [number, number, number]
const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as RGB
}
const rgbToHex = (rgb: RGB) => rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()

function rgbToHsl([r, g, b]: RGB): RGB {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h /= 6
  return [h, s, l]
}

function hslToRgb([h, s, l]: RGB): RGB {
  if (s === 0) return [l, l, l]
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)]
}

/** sRGB ↔ 선형 — PowerPoint의 tint·shade는 선형 색 공간에서 계산한다 */
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const fromLinear = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

/** 색 hex에 tint(밝게, 0~1 — 1이면 원래 색) 적용 — 기본 표 스타일 등 */
export function tintHex(hex: string, t: number): string {
  return rgbToHex(hexToRgb(hex).map((c) => fromLinear(toLinear(c) * t + (1 - t))) as RGB)
}

/** 색 변형(lumMod·lumOff·tint·shade·satMod·alpha) 적용 → { hex, alpha } */
export function applyColorMods(hex: string, mods: Element[]): { hex: string; alpha: number } {
  let rgb = hexToRgb(hex)
  let alpha = 1
  for (const m of mods) {
    const v = (num(m, 'val') ?? 0) / 100000
    const name = m.tagName.replace(/^a:/, '')
    if (name === 'lumMod' || name === 'lumOff') {
      const hsl = rgbToHsl(rgb)
      hsl[2] = name === 'lumMod' ? hsl[2] * v : hsl[2] + v
      hsl[2] = Math.min(1, Math.max(0, hsl[2]))
      rgb = hslToRgb(hsl)
    } else if (name === 'satMod') {
      const hsl = rgbToHsl(rgb)
      hsl[1] = Math.min(1, Math.max(0, hsl[1] * v))
      rgb = hslToRgb(hsl)
    } else if (name === 'tint') rgb = rgb.map((c) => fromLinear(toLinear(c) * v + (1 - v))) as RGB
    else if (name === 'shade') rgb = rgb.map((c) => fromLinear(toLinear(c) * v)) as RGB
    else if (name === 'alpha') alpha = v
  }
  return { hex: rgbToHex(rgb), alpha }
}

/** 색 요소(srgbClr·schemeClr·sysClr·prstClr·scrgbClr) → CSS 색. 모르는 색은 undefined */
export function resolveColor(el: Element | undefined, ctx: ColorContext): string | undefined {
  if (!el) return undefined
  const tag = el.tagName.replace(/^a:/, '')
  let hex: string | undefined
  if (tag === 'srgbClr') hex = el.getAttribute('val') ?? undefined
  else if (tag === 'sysClr') hex = el.getAttribute('lastClr') ?? (el.getAttribute('val') === 'window' ? 'FFFFFF' : '000000')
  else if (tag === 'prstClr') hex = PRESET_COLORS[el.getAttribute('val') ?? '']
  else if (tag === 'scrgbClr') {
    const pct = (a: string) => Math.round(((num(el, a) ?? 0) / 100000) * 255).toString(16).padStart(2, '0')
    hex = `${pct('r')}${pct('g')}${pct('b')}`
  } else if (tag === 'schemeClr') {
    const name = el.getAttribute('val') ?? ''
    if (name === 'phClr') hex = ctx.phClr
    else hex = ctx.theme.colors[ctx.clrMap[name] ?? name]
  }
  if (!hex || !/^[0-9a-f]{6}$/i.test(hex)) return undefined
  const { hex: out, alpha } = applyColorMods(hex.toUpperCase(), elementChildren(el))
  if (alpha >= 1) return `#${out}`
  const [r, g, b] = hexToRgb(out).map((v) => Math.round(v * 255))
  return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`
}

const COLOR_TAGS = ['a:srgbClr', 'a:schemeClr', 'a:sysClr', 'a:prstClr', 'a:scrgbClr']
/** 요소 안의 첫 색 요소 */
export const colorChild = (el: Element | undefined) => (el ? elementChildren(el).find((e) => COLOR_TAGS.includes(e.tagName)) : undefined)

/** 원래 색(hex, 변형 전) — 스타일 참조(phClr)용 */
export function baseColorHex(el: Element | undefined, ctx: ColorContext): string | undefined {
  const c = resolveColor(el, ctx)
  if (!c) return undefined
  if (c.startsWith('#')) return c.slice(1)
  const m = c.match(/\d+/g)
  return m ? m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase() : undefined
}

/* ───────────── 글자 서식 이어받기 ───────────── */

export type Spacing = { pct: number } | { pts: number }

export type Bullet = { kind: 'none' } | { kind: 'char'; char: string } | { kind: 'num'; scheme: string; start: number }

export interface RunProps {
  /** pt */
  size?: number
  bold?: boolean
  italic?: boolean
  underline?: 'single' | 'double'
  strike?: boolean
  caps?: boolean
  /** 위·아래 첨자(%) */
  baseline?: number
  color?: string
  latin?: string
  ea?: string
  highlight?: string
}

export interface ParaProps {
  align?: string
  /** px */
  marL?: number
  indent?: number
  lineSpacing?: Spacing
  spaceBefore?: Spacing
  spaceAfter?: Spacing
  bullet?: Bullet
  bulletColor?: string
  /** 글자 크기 대비 비율(1 = 100%) 또는 pt */
  bulletSize?: { pct: number } | { pts: number }
  bulletFont?: string
  run: RunProps
}

const defined = <T extends object>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>

export function mergePara(base: ParaProps, over: ParaProps | undefined): ParaProps {
  if (!over) return base
  return { ...base, ...defined({ ...over, run: undefined }), run: { ...base.run, ...defined(over.run) } }
}

function readSpacing(el: Element | undefined): Spacing | undefined {
  if (!el) return undefined
  const pct = child(el, 'a:spcPct')
  if (pct) return { pct: (num(pct, 'val') ?? 100000) / 100000 }
  const pts = child(el, 'a:spcPts')
  if (pts) return { pts: (num(pts, 'val') ?? 0) / 100 }
  return undefined
}

/** 테마 글꼴 참조(+mj-lt·+mn-ea 등)를 실제 이름으로 */
export function resolveTypeface(face: string | null | undefined, theme: PptxTheme): string | undefined {
  if (!face) return undefined
  const m = face.match(/^\+(mj|mn)-(lt|ea|cs)$/)
  if (!m) return face
  const set = m[1] === 'mj' ? theme.fonts.major : theme.fonts.minor
  return (m[2] === 'ea' ? set.ea : set.latin) || undefined
}

/** rPr·defRPr·endParaRPr → 글자 서식 */
export function readRunProps(el: Element | undefined, ctx: ColorContext): RunProps {
  if (!el) return {}
  const sz = num(el, 'sz')
  const b = el.getAttribute('b')
  const i = el.getAttribute('i')
  const u = el.getAttribute('u')
  const strike = el.getAttribute('strike')
  const cap = el.getAttribute('cap')
  const fill = child(el, 'a:solidFill')
  const hl = child(el, 'a:highlight')
  return defined({
    size: sz !== undefined ? sz / 100 : undefined,
    bold: b === null ? undefined : b === '1' || b === 'true',
    italic: i === null ? undefined : i === '1' || i === 'true',
    underline: u === null ? undefined : u === 'none' ? undefined : u.startsWith('dbl') ? ('double' as const) : ('single' as const),
    strike: strike === null ? undefined : strike !== 'noStrike',
    caps: cap === null ? undefined : cap === 'all',
    baseline: num(el, 'baseline') !== undefined ? num(el, 'baseline')! / 1000 : undefined,
    color: fill ? resolveColor(colorChild(fill), ctx) : child(el, 'a:noFill') ? 'transparent' : undefined,
    latin: resolveTypeface(child(el, 'a:latin')?.getAttribute('typeface'), ctx.theme),
    ea: resolveTypeface(child(el, 'a:ea')?.getAttribute('typeface'), ctx.theme),
    highlight: hl ? resolveColor(colorChild(hl), ctx) : undefined,
  }) as RunProps
}

/** pPr·lvlNpPr → 문단 서식 */
export function readParaProps(el: Element | undefined, ctx: ColorContext): ParaProps {
  if (!el) return { run: {} }
  const marL = num(el, 'marL')
  const indent = num(el, 'indent')
  let bullet: Bullet | undefined
  if (child(el, 'a:buNone')) bullet = { kind: 'none' }
  const buChar = child(el, 'a:buChar')
  if (buChar) bullet = { kind: 'char', char: buChar.getAttribute('char') ?? '•' }
  const buNum = child(el, 'a:buAutoNum')
  if (buNum) bullet = { kind: 'num', scheme: buNum.getAttribute('type') ?? 'arabicPeriod', start: num(buNum, 'startAt') ?? 1 }
  const buClr = child(el, 'a:buClr')
  const buSzPct = child(el, 'a:buSzPct')
  const buSzPts = child(el, 'a:buSzPts')
  const out: ParaProps = {
    ...defined({
      align: el.getAttribute('algn') ?? undefined,
      marL: marL !== undefined ? emuToPx(marL) : undefined,
      indent: indent !== undefined ? emuToPx(indent) : undefined,
      lineSpacing: readSpacing(child(el, 'a:lnSpc')),
      spaceBefore: readSpacing(child(el, 'a:spcBef')),
      spaceAfter: readSpacing(child(el, 'a:spcAft')),
      bullet,
      bulletColor: buClr ? resolveColor(colorChild(buClr), ctx) : undefined,
      bulletSize: buSzPct ? { pct: (num(buSzPct, 'val') ?? 100000) / 100000 } : buSzPts ? { pts: (num(buSzPts, 'val') ?? 0) / 100 } : undefined,
      bulletFont: child(el, 'a:buFont')?.getAttribute('typeface') ?? undefined,
    }),
    run: readRunProps(child(el, 'a:defRPr'), ctx),
  }
  return out
}

/** 목록 스타일(lstStyle·titleStyle 등) → 수준(0~8)별 문단 서식. defPPr는 모든 수준의 바탕 */
export function readListStyle(el: Element | undefined, ctx: ColorContext): ParaProps[] {
  const levels: ParaProps[] = []
  const def = readParaProps(child(el, 'a:defPPr'), ctx)
  for (let i = 0; i < 9; i++) levels.push(mergePara(def, el ? readParaProps(child(el, `a:lvl${i + 1}pPr`), ctx) : undefined))
  return levels
}

/* ───────────── 글머리 기호·자동 번호 ───────────── */

/** Wingdings·Symbol 글꼴의 글머리 문자 → 유니코드(브라우저에 그 글꼴이 없으므로) */
const WINGDINGS: Record<string, string> = {
  l: '●', n: '■', q: '❑', u: '◆', v: '❖', w: '⬥', o: '□', p: '◻', 'Ø': '➢', 'ü': '✔', 'û': '✘', '§': '▪', 'Ÿ': '•', 'è': '➔', 'à': '➔', 'ð': '⇨', 'Ö': '➤', 'ª': '✦', '¨': '◻', 'Q': '✈', 'J': '☺',
}

export function bulletChar(char: string, font?: string): string {
  let c = char
  const code = c.codePointAt(0) ?? 0
  // 기호 글꼴의 개인 영역(U+F0xx) → 원래 문자
  if (code >= 0xf020 && code <= 0xf0ff) c = String.fromCharCode(code - 0xf000)
  if (font && /wingdings/i.test(font)) return WINGDINGS[c] ?? '•'
  if (font && /symbol/i.test(font)) return c === '·' || c === '\u00B7' ? '•' : c === 'Ø' ? '⌀' : c
  return c
}

const toRoman = (n: number) => {
  const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let s = ''
  for (const [v, r] of map) while (n >= v) { s += r; n -= v }
  return s
}
const toAlpha = (n: number) => {
  let s = ''
  while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26) }
  return s
}
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

/** 자동 번호 형식(arabicPeriod·romanUcPeriod·alphaLcParenR·circleNumDbPlain …) → 글자 */
export function autoNumberText(scheme: string, n: number): string {
  let body: string
  if (/^roman(Uc|Lc)/.test(scheme)) body = scheme.startsWith('romanLc') ? toRoman(n).toLowerCase() : toRoman(n)
  else if (/^alpha(Uc|Lc)/.test(scheme)) body = scheme.startsWith('alphaLc') ? toAlpha(n).toLowerCase() : toAlpha(n)
  else if (scheme.startsWith('circleNum')) return CIRCLED[n - 1] ?? `(${n})`
  else body = String(n)
  if (scheme.endsWith('ParenBoth')) return `(${body})`
  if (scheme.endsWith('ParenR')) return `${body})`
  if (scheme.endsWith('Period')) return `${body}.`
  if (scheme.endsWith('Minus')) return `- ${body} -`
  return body
}

/* ───────────── 도형 경로 ───────────── */

const f = (v: number) => Number(v.toFixed(2))

/** 기본 도형(prstGeom) → SVG 경로. open이면 선만(채우기 없음). 모르는 도형은 사각형 */
export function presetPath(prst: string, w: number, h: number, adj: Record<string, number> = {}): { d: string; open?: boolean } {
  const ss = Math.min(w, h)
  const a = (name: string, def: number) => (adj[name] ?? def) / 100000
  const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')} Z`
  const rect = poly([[0, 0], [w, 0], [w, h], [0, h]])
  const ellipse = `M0 ${f(h / 2)} A${f(w / 2)} ${f(h / 2)} 0 1 1 ${f(w)} ${f(h / 2)} A${f(w / 2)} ${f(h / 2)} 0 1 1 0 ${f(h / 2)} Z`
  const roundRect = (r: number) => {
    r = Math.min(r, w / 2, h / 2)
    return `M${f(r)} 0 H${f(w - r)} A${f(r)} ${f(r)} 0 0 1 ${f(w)} ${f(r)} V${f(h - r)} A${f(r)} ${f(r)} 0 0 1 ${f(w - r)} ${f(h)} H${f(r)} A${f(r)} ${f(r)} 0 0 1 0 ${f(h - r)} V${f(r)} A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0 Z`
  }
  switch (prst) {
    case 'rect':
    case 'flowChartProcess':
    case 'wedgeRectCallout':
      return { d: rect }
    case 'roundRect':
    case 'flowChartAlternateProcess':
    case 'wedgeRoundRectCallout':
      return { d: roundRect(ss * a('adj', 16667)) }
    case 'flowChartTerminator':
      return { d: roundRect(ss / 2) }
    case 'ellipse':
    case 'flowChartConnector':
    case 'donut':
    case 'cloud':
    case 'wedgeEllipseCallout':
      return { d: ellipse }
    case 'line':
    case 'straightConnector1':
      return { d: `M0 0 L${f(w)} ${f(h)}`, open: true }
    case 'bentConnector2':
      return { d: `M0 0 L${f(w)} 0 L${f(w)} ${f(h)}`, open: true }
    case 'bentConnector3': {
      const x = w * a('adj1', 50000)
      return { d: `M0 0 L${f(x)} 0 L${f(x)} ${f(h)} L${f(w)} ${f(h)}`, open: true }
    }
    case 'curvedConnector3':
      return { d: `M0 0 C${f(w / 2)} 0 ${f(w / 2)} ${f(h)} ${f(w)} ${f(h)}`, open: true }
    case 'triangle':
    case 'flowChartExtract': {
      const x = w * a('adj', 50000)
      return { d: poly([[x, 0], [w, h], [0, h]]) }
    }
    case 'rtTriangle':
      return { d: poly([[0, 0], [0, h], [w, h]]) }
    case 'diamond':
    case 'flowChartDecision':
      return { d: poly([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]) }
    case 'parallelogram':
    case 'flowChartInputOutput': {
      const o = Math.min(w, ss * a('adj', 25000))
      return { d: poly([[o, 0], [w, 0], [w - o, h], [0, h]]) }
    }
    case 'trapezoid': {
      const o = Math.min(w / 2, ss * a('adj', 25000))
      return { d: poly([[0, h], [o, 0], [w - o, 0], [w, h]]) }
    }
    case 'pentagon':
      return { d: poly([[w / 2, 0], [w, h * 0.382], [w * 0.809, h], [w * 0.191, h], [0, h * 0.382]]) }
    case 'hexagon': {
      const o = Math.min(w / 2, ss * a('adj', 25000))
      return { d: poly([[0, h / 2], [o, 0], [w - o, 0], [w, h / 2], [w - o, h], [o, h]]) }
    }
    case 'octagon': {
      const o = Math.min(w / 2, h / 2, ss * a('adj', 29289))
      return { d: poly([[o, 0], [w - o, 0], [w, o], [w, h - o], [w - o, h], [o, h], [0, h - o], [0, o]]) }
    }
    case 'homePlate': {
      const o = Math.min(w, ss * a('adj', 50000))
      return { d: poly([[0, 0], [w - o, 0], [w, h / 2], [w - o, h], [0, h]]) }
    }
    case 'chevron': {
      const o = Math.min(w, ss * a('adj', 50000))
      return { d: poly([[0, 0], [w - o, 0], [w, h / 2], [w - o, h], [0, h], [o, h / 2]]) }
    }
    case 'plus': {
      const o = ss * a('adj', 25000)
      return { d: poly([[o, 0], [w - o, 0], [w - o, o], [w, o], [w, h - o], [w - o, h - o], [w - o, h], [o, h], [o, h - o], [0, h - o], [0, o], [o, o]]) }
    }
    case 'rightArrow':
    case 'leftArrow': {
      const sh = h * a('adj1', 50000)
      const hl = Math.min(w, ss * a('adj2', 50000))
      const pts: [number, number][] = [[0, (h - sh) / 2], [w - hl, (h - sh) / 2], [w - hl, 0], [w, h / 2], [w - hl, h], [w - hl, (h + sh) / 2], [0, (h + sh) / 2]]
      return { d: poly(prst === 'leftArrow' ? pts.map(([x, y]) => [w - x, y]) : pts) }
    }
    case 'upArrow':
    case 'downArrow': {
      const sw = w * a('adj1', 50000)
      const hl = Math.min(h, ss * a('adj2', 50000))
      const pts: [number, number][] = [[(w - sw) / 2, h], [(w - sw) / 2, hl], [0, hl], [w / 2, 0], [w, hl], [(w + sw) / 2, hl], [(w + sw) / 2, h]]
      return { d: poly(prst === 'downArrow' ? pts.map(([x, y]) => [x, h - y]) : pts) }
    }
    case 'leftRightArrow': {
      const sh = h * a('adj1', 50000)
      const hl = Math.min(w / 2, ss * a('adj2', 50000))
      return { d: poly([[0, h / 2], [hl, 0], [hl, (h - sh) / 2], [w - hl, (h - sh) / 2], [w - hl, 0], [w, h / 2], [w - hl, h], [w - hl, (h + sh) / 2], [hl, (h + sh) / 2], [hl, h]]) }
    }
    case 'star5':
    case 'star4':
    case 'star6':
    case 'star8': {
      const n = Number(prst.slice(4))
      const inner = n === 5 ? 0.382 : n === 4 ? 0.25 : 0.5
      const pts: [number, number][] = []
      for (let i = 0; i < n * 2; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / n
        const r = i % 2 === 0 ? 1 : inner
        pts.push([w / 2 + (w / 2) * r * Math.cos(ang), h / 2 + (h / 2) * r * Math.sin(ang)])
      }
      return { d: poly(pts) }
    }
    case 'arc': {
      const st = ((adj.adj1 ?? 16200000) / 60000) * (Math.PI / 180)
      const en = ((adj.adj2 ?? 0) / 60000) * (Math.PI / 180)
      const rx = w / 2
      const ry = h / 2
      let sweep = en - st
      if (sweep <= 0) sweep += Math.PI * 2
      const p = (t: number) => `${f(rx + rx * Math.cos(t))} ${f(ry + ry * Math.sin(t))}`
      return { d: `M${p(st)} A${f(rx)} ${f(ry)} 0 ${sweep > Math.PI ? 1 : 0} 1 ${p(st + sweep)}`, open: true }
    }
    default:
      return { d: rect }
  }
}

/** 기본 도형 안에서 글자가 놓이는 영역(px) — PowerPoint 도형 정의의 글자 사각형 근사. 모르는 도형은 상자 전체 */
export function presetTextRect(prst: string, w: number, h: number, adj: Record<string, number> = {}): { l: number; t: number; r: number; b: number } {
  const ss = Math.min(w, h)
  const a = (name: string, def: number) => (adj[name] ?? def) / 100000
  switch (prst) {
    case 'ellipse':
    case 'flowChartConnector':
    case 'wedgeEllipseCallout':
    case 'donut':
      return { l: w * 0.1464, t: h * 0.1464, r: w * 0.8536, b: h * 0.8536 }
    case 'roundRect':
    case 'flowChartAlternateProcess':
    case 'wedgeRoundRectCallout': {
      const i = ss * a('adj', 16667) * 0.2929
      return { l: i, t: i, r: w - i, b: h - i }
    }
    case 'triangle': {
      const x = w * a('adj', 50000)
      return { l: x / 2, t: h / 2, r: (x + w) / 2, b: h }
    }
    case 'rtTriangle':
      return { l: w / 12, t: (7 * h) / 12, r: (7 * w) / 12, b: (11 * h) / 12 }
    case 'diamond':
    case 'flowChartDecision':
      return { l: w / 4, t: h / 4, r: (3 * w) / 4, b: (3 * h) / 4 }
    case 'star5':
      return { l: w * 0.2, t: h * 0.38, r: w * 0.8, b: h * 0.79 }
    case 'star4':
    case 'star6':
    case 'star8':
      return { l: w * 0.25, t: h * 0.25, r: w * 0.75, b: h * 0.75 }
    case 'rightArrow': {
      const sh = h * a('adj1', 50000)
      const hl = Math.min(w, ss * a('adj2', 50000))
      return { l: 0, t: (h - sh) / 2, r: w - (hl * sh) / h / 2 - hl / 2, b: (h + sh) / 2 }
    }
    case 'leftArrow': {
      const sh = h * a('adj1', 50000)
      const hl = Math.min(w, ss * a('adj2', 50000))
      return { l: (hl * sh) / h / 2 + hl / 2, t: (h - sh) / 2, r: w, b: (h + sh) / 2 }
    }
    case 'chevron': {
      const o = Math.min(w, ss * a('adj', 50000))
      return { l: o, t: 0, r: w - o, b: h }
    }
    case 'homePlate': {
      const o = Math.min(w, ss * a('adj', 50000))
      return { l: 0, t: 0, r: w - o / 2, b: h }
    }
    case 'hexagon':
    case 'octagon': {
      const o = Math.min(w / 2, ss * a('adj', prst === 'hexagon' ? 25000 : 29289)) / 2
      return { l: o, t: o, r: w - o, b: h - o }
    }
    case 'plus': {
      const o = ss * a('adj', 25000)
      return { l: 0, t: o, r: w, b: h - o }
    }
    default:
      return { l: 0, t: 0, r: w, b: h }
  }
}

/** 사용자 지정 도형(custGeom) → SVG 경로(도형 크기 w×h px에 맞춤). 좌표가 수식이면 0/끝으로 근사 */
export function customGeometryPath(custGeom: Element, w: number, h: number): string {
  const pathLst = child(custGeom, 'a:pathLst')
  let d = ''
  for (const path of children(pathLst, 'a:path')) {
    const pw = num(path, 'w') ?? 0
    const ph = num(path, 'h') ?? 0
    const sx = pw ? w / pw : emuToPx(1)
    const sy = ph ? h / ph : emuToPx(1)
    const coord = (v: string | null, axis: 'x' | 'y') => {
      const n = Number(v)
      if (Number.isFinite(n)) return n * (axis === 'x' ? sx : sy)
      if (v === 'r' || v === 'w' || v === 'b' || v === 'h') return axis === 'x' ? w : h
      return 0
    }
    const pt = (el: Element) => [coord(el.getAttribute('x'), 'x'), coord(el.getAttribute('y'), 'y')] as const
    let cur: readonly [number, number] = [0, 0]
    for (const cmd of elementChildren(path)) {
      const pts = children(cmd, 'a:pt').map(pt)
      switch (cmd.tagName) {
        case 'a:moveTo':
          if (pts[0]) { d += `M${f(pts[0][0])} ${f(pts[0][1])} `; cur = pts[0] }
          break
        case 'a:lnTo':
          if (pts[0]) { d += `L${f(pts[0][0])} ${f(pts[0][1])} `; cur = pts[0] }
          break
        case 'a:cubicBezTo':
          if (pts.length === 3) { d += `C${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' ')} `; cur = pts[2] }
          break
        case 'a:quadBezTo':
          if (pts.length === 2) { d += `Q${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' ')} `; cur = pts[1] }
          break
        case 'a:arcTo': {
          const wR = (num(cmd, 'wR') ?? 0) * sx
          const hR = (num(cmd, 'hR') ?? 0) * sy
          const st = ((num(cmd, 'stAng') ?? 0) / 60000) * (Math.PI / 180)
          const sw = ((num(cmd, 'swAng') ?? 0) / 60000) * (Math.PI / 180)
          if (!wR || !hR || !sw) break
          const cx = cur[0] - wR * Math.cos(st)
          const cy = cur[1] - hR * Math.sin(st)
          const ex = cx + wR * Math.cos(st + sw)
          const ey = cy + hR * Math.sin(st + sw)
          d += `A${f(wR)} ${f(hR)} 0 ${Math.abs(sw) > Math.PI ? 1 : 0} ${sw > 0 ? 1 : 0} ${f(ex)} ${f(ey)} `
          cur = [ex, ey]
          break
        }
        case 'a:close':
          d += 'Z '
          break
      }
    }
  }
  return d.trim()
}

/** 점선 종류 → stroke-dasharray(선 굵기 배수) */
export function dashArray(prstDash: string | null | undefined, width: number): string | undefined {
  const w = Math.max(1, width)
  const pattern: Record<string, number[]> = {
    dash: [4, 3], lgDash: [8, 3], sysDash: [3, 1], dot: [1, 3], sysDot: [1, 1], dashDot: [4, 3, 1, 3], lgDashDot: [8, 3, 1, 3], lgDashDotDot: [8, 3, 1, 3, 1, 3], sysDashDot: [3, 1, 1, 1], sysDashDotDot: [3, 1, 1, 1, 1, 1],
  }
  const p = prstDash ? pattern[prstDash] : undefined
  return p ? p.map((v) => f(v * w)).join(' ') : undefined
}

/* ───────────── 자리 표시자 ───────────── */

export interface Placeholder {
  type: string
  idx?: string
}

export function readPlaceholder(shape: Element): Placeholder | null {
  const nv = elementChildren(shape).find((e) => /^p:nv/.test(e.tagName))
  const ph = nv ? child(child(nv, 'p:nvPr'), 'p:ph') : undefined
  if (!ph) return null
  return { type: ph.getAttribute('type') ?? 'obj', idx: ph.getAttribute('idx') ?? undefined }
}

/** 자리 표시자 종류 → 마스터 글자 스타일(제목·본문·기타) */
export function styleKindOf(ph: Placeholder | null): 'title' | 'body' | 'other' | null {
  if (!ph) return null
  if (ph.type === 'title' || ph.type === 'ctrTitle') return 'title'
  if (['body', 'subTitle', 'obj', 'tbl', 'chart', 'dgm', 'media', 'clipArt', 'pic'].includes(ph.type)) return 'body'
  return 'other'
}

/** 레이아웃·마스터에서 이어받을 자리 표시자 찾기 — 번호(idx) 우선, 없으면 종류(제목류·본문류 묶음) */
export function findPlaceholder(shapes: Element[], ph: Placeholder, byIdx: boolean): Element | undefined {
  const list = shapes.map((s) => ({ s, p: readPlaceholder(s) })).filter((x): x is { s: Element; p: Placeholder } => !!x.p)
  if (byIdx && ph.idx !== undefined) {
    const hit = list.find((x) => x.p.idx === ph.idx)
    if (hit) return hit.s
  }
  const exact = list.find((x) => x.p.type === ph.type)
  if (exact) return exact.s
  const kind = styleKindOf(ph)
  const group = (p: Placeholder) => (p.type === 'title' || p.type === 'ctrTitle' ? 'title' : ['body', 'subTitle', 'obj'].includes(p.type) ? 'body' : p.type)
  return list.find((x) => group(x.p) === (kind === 'title' ? 'title' : kind === 'body' ? 'body' : ph.type))?.s
}
