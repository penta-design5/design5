/**
 * 한글(HWPX) 화면 미리보기용 계산(순수) — header.xml의 글꼴·글자 모양·문단 모양·테두리/배경, 단위 변환, 쪽 나눔 판단. 그리기는 `render-hwpx.ts`.
 * 단위: HWPUNIT = 1/7200인치 → px(96dpi)는 ÷ 75. 글자 크기(height)는 1/100pt.
 * `hp:switch`는 `hp:case`(HwpUnitChar — 실제 HWPUNIT 값)를 따른다(`hp:default`는 예전 형식으로 값이 두 배).
 */
import { elementChildren, parseXml } from './office'

export const hwpToPx = (v: number) => v / 75

/** 미리보기로 그리는 쪽 수 상한(추출은 전체) — PDF 50쪽 상한과 같음 */
export const PREVIEW_MAX_PAGES = 50

/** 자식 요소(hp:switch 안이면 hp:case 쪽에서) */
export function childOf(el: Element | null | undefined, tag: string): Element | undefined {
  if (!el) return undefined
  for (const c of elementChildren(el)) {
    if (c.tagName === tag) return c
    if (c.tagName === 'hp:switch') {
      const branch = elementChildren(c).find((b) => b.tagName === 'hp:case') ?? elementChildren(c).find((b) => b.tagName === 'hp:default')
      const hit = branch && elementChildren(branch).find((b) => b.tagName === tag)
      if (hit) return hit
    }
  }
  return undefined
}

const numAttr = (el: Element | undefined, name: string, def = 0) => {
  const v = Number(el?.getAttribute(name))
  return Number.isFinite(v) && el?.getAttribute(name) !== null && el?.getAttribute(name) !== '' ? v : def
}

/** `#RRGGBB`(또는 `#AARRGGBB`)만 통과 — none·빈 값은 undefined */
export function hwpColor(v: string | null | undefined): string | undefined {
  if (!v) return undefined
  const m = v.match(/^#(?:[0-9a-f]{2})?([0-9a-f]{6})$/i)
  return m ? `#${m[1].toUpperCase()}` : undefined
}

/** 「0.12 mm」 → px(최소 1px) */
export function borderWidthPx(v: string | null | undefined): number {
  const mm = parseFloat(v ?? '') || 0.12
  return Math.max(1, Math.round(((mm * 96) / 25.4) * 10) / 10)
}

/* ───────────── header.xml ───────────── */

export interface HwpFont {
  face: string
  serif: boolean
}

export interface CharStyle {
  /** pt */
  size: number
  color: string
  shade?: string
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  /** 자간(글자 크기 대비 %) */
  spacing: number
  sup: boolean
  sub: boolean
  hangul?: HwpFont
  latin?: HwpFont
}

export interface ParaStyle {
  align: string
  /** px */
  left: number
  right: number
  indent: number
  prev: number
  next: number
  lineSpacing: { type: string; value: number }
  borderFill?: number
  /** 한글 단어 단위 줄 바꿈 */
  keepWord: boolean
}

export type BorderLine = { style: string; width: number; color: string }

export interface BorderFill {
  left?: BorderLine
  right?: BorderLine
  top?: BorderLine
  bottom?: BorderLine
  fill?: string
}

export interface HwpxStyles {
  chars: Map<string, CharStyle>
  paras: Map<string, ParaStyle>
  borderFills: Map<string, BorderFill>
}

const SERIF = /명조|바탕|궁서|batang|myungjo|gungsuh|serif|times/i

/** 테두리 종류 → CSS border-style. NONE은 없음 */
const BORDER_STYLE: Record<string, string> = {
  SOLID: 'solid', DASH: 'dashed', DOT: 'dotted', DASH_DOT: 'dashed', DASH_DOT_DOT: 'dashed', LONG_DASH: 'dashed', CIRCLE: 'dotted',
  DOUBLE_SLIM: 'double', SLIM_THICK: 'double', THICK_SLIM: 'double', SLIM_THICK_SLIM: 'double', WAVE: 'solid', DOUBLE_WAVE: 'double', THICK_3D: 'solid', THICK_3D_REVERS: 'solid', '3D': 'solid', '3D_REVERS': 'solid',
}

export function readHwpxStyles(xml: string): HwpxStyles {
  const doc = parseXml(xml)
  // 언어별 글꼴 목록(id → 이름)
  const fonts: Record<string, Map<string, HwpFont>> = {}
  for (const face of Array.from(doc.getElementsByTagName('hh:fontface'))) {
    const map = new Map<string, HwpFont>()
    for (const f of elementChildren(face).filter((e) => e.tagName === 'hh:font')) {
      const name = f.getAttribute('face') ?? ''
      const family = childOf(f, 'hh:typeInfo')?.getAttribute('familyType') ?? ''
      map.set(f.getAttribute('id') ?? '', { face: name, serif: family === 'FCAT_MYUNGJO' || SERIF.test(name) })
    }
    fonts[face.getAttribute('lang') ?? ''] = map
  }

  const chars = new Map<string, CharStyle>()
  for (const c of Array.from(doc.getElementsByTagName('hh:charPr'))) {
    const ref = childOf(c, 'hh:fontRef')
    const underline = childOf(c, 'hh:underline')?.getAttribute('type') ?? 'NONE'
    const strike = childOf(c, 'hh:strikeout')?.getAttribute('shape') ?? 'NONE'
    chars.set(c.getAttribute('id') ?? '', {
      size: numAttr(c, 'height', 1000) / 100,
      color: hwpColor(c.getAttribute('textColor')) ?? '#000000',
      shade: hwpColor(c.getAttribute('shadeColor')),
      bold: !!childOf(c, 'hh:bold'),
      italic: !!childOf(c, 'hh:italic'),
      underline: underline !== 'NONE',
      strike: strike !== 'NONE' && strike !== '',
      spacing: numAttr(childOf(c, 'hh:spacing'), 'hangul'),
      sup: !!childOf(c, 'hh:supscript'),
      sub: !!childOf(c, 'hh:subscript'),
      hangul: fonts.HANGUL?.get(ref?.getAttribute('hangul') ?? ''),
      latin: fonts.LATIN?.get(ref?.getAttribute('latin') ?? ''),
    })
  }

  const paras = new Map<string, ParaStyle>()
  for (const p of Array.from(doc.getElementsByTagName('hh:paraPr'))) {
    const margin = childOf(p, 'hh:margin')
    const m = (tag: string) => hwpToPx(numAttr(childOf(margin, tag), 'value'))
    const ls = childOf(p, 'hh:lineSpacing')
    const border = childOf(p, 'hh:border')
    paras.set(p.getAttribute('id') ?? '', {
      align: childOf(p, 'hh:align')?.getAttribute('horizontal') ?? 'JUSTIFY',
      left: m('hc:left'),
      right: m('hc:right'),
      indent: m('hc:intent'),
      prev: m('hc:prev'),
      next: m('hc:next'),
      lineSpacing: { type: ls?.getAttribute('type') ?? 'PERCENT', value: numAttr(ls, 'value', 160) },
      borderFill: border ? numAttr(border, 'borderFillIDRef', 0) : undefined,
      keepWord: (childOf(p, 'hh:breakSetting')?.getAttribute('breakNonLatinWord') ?? 'KEEP_WORD') === 'KEEP_WORD',
    })
  }

  const borderFills = new Map<string, BorderFill>()
  for (const b of Array.from(doc.getElementsByTagName('hh:borderFill'))) {
    const side = (tag: string): BorderLine | undefined => {
      const el = childOf(b, tag)
      const type = el?.getAttribute('type') ?? 'NONE'
      const style = BORDER_STYLE[type]
      if (!el || !style) return undefined
      const width = borderWidthPx(el.getAttribute('width'))
      return { style, width: style === 'double' ? Math.max(3, width) : width, color: hwpColor(el.getAttribute('color')) ?? '#000000' }
    }
    const brush = childOf(b, 'hc:fillBrush')
    const win = childOf(brush, 'hc:winBrush')
    const grad = childOf(brush, 'hc:gradation')
    const gradColor = grad ? hwpColor(elementChildren(grad).find((e) => e.tagName === 'hc:color')?.getAttribute('value')) : undefined
    borderFills.set(b.getAttribute('id') ?? '', {
      left: side('hh:leftBorder'),
      right: side('hh:rightBorder'),
      top: side('hh:topBorder'),
      bottom: side('hh:bottomBorder'),
      fill: hwpColor(win?.getAttribute('faceColor')) ?? gradColor,
    })
  }
  return { chars, paras, borderFills }
}

/* ───────────── 문단 ───────────── */

/** 줄 간격 → CSS line-height. PERCENT는 글자 크기 대비(160% = 1.6), FIXED는 고정 px, BETWEEN_LINES는 글자 크기 + 간격, AT_LEAST는 최소 */
export function lineHeightCss(ls: ParaStyle['lineSpacing'], fontPt: number): string {
  const fontPx = (fontPt * 4) / 3
  if (ls.type === 'FIXED') return `${hwpToPx(ls.value)}px`
  if (ls.type === 'BETWEEN_LINES') return `${fontPx * 1.2 + hwpToPx(ls.value)}px`
  if (ls.type === 'AT_LEAST') return `${Math.max(fontPx * 1.2, hwpToPx(ls.value))}px`
  return String(Math.max(0.5, ls.value / 100))
}

/**
 * 문단 여백 → CSS. 한글의 내어쓰기(음수 intent)는 첫 줄이 왼쪽 여백에서 시작하고 둘째 줄부터 |intent|만큼 들어간다
 * → padding-left = left + |intent|, text-indent = intent. 들여쓰기(양수)는 첫 줄만 들어간다.
 */
export function paragraphIndentCss(p: Pick<ParaStyle, 'left' | 'indent'>): { paddingLeft: number; textIndent: number } {
  return p.indent < 0 ? { paddingLeft: p.left - p.indent, textIndent: p.indent } : { paddingLeft: p.left, textIndent: p.indent }
}

export const ALIGN_CSS: Record<string, string> = { LEFT: 'left', RIGHT: 'right', CENTER: 'center', JUSTIFY: 'justify', DISTRIBUTE: 'justify', DISTRIBUTE_SPACE: 'justify' }

/**
 * 글꼴 → CSS 글꼴 목록. 영문 글꼴을 앞에 두어야 영문은 영문 글꼴, 한글은 (영문 글꼴에 한글이 없으므로) 한글 글꼴로 그려진다.
 * 문서 글꼴이 없는 PC를 위해 한글 글꼴 계열(명조/고딕)에 맞는 대체 글꼴을 뒤에 붙인다.
 */
export function fontStackOf(hangul: HwpFont | undefined, latin: HwpFont | undefined): string {
  const fonts = [latin, hangul]
  const names = fonts.filter((f): f is HwpFont => !!f && !!f.face).map((f) => `"${f.face.replace(/["\\;{}<>]/g, '')}"`)
  const serif = (hangul ?? latin)?.serif
  const fallback = serif ? '"Batang", "바탕", "AppleMyungjo", "Noto Serif KR", serif' : '"Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", sans-serif'
  return [...new Set(names), fallback].join(', ')
}

/* ───────────── 표 ───────────── */

/** 칸 너비 → 열 너비. 한 칸짜리로 정해지고, 남은 열은 병합 칸 너비에서 나눈다 */
export function columnWidths(cells: { col: number; colSpan: number; w: number }[], colCnt: number, tableWidth: number): number[] {
  const widths: (number | undefined)[] = Array(colCnt).fill(undefined)
  for (const c of cells) if (c.colSpan === 1 && widths[c.col] === undefined) widths[c.col] = c.w
  let changed = true
  while (changed) {
    changed = false
    for (const c of cells) {
      const range = Array.from({ length: c.colSpan }, (_, i) => c.col + i).filter((i) => i < colCnt)
      const unknown = range.filter((i) => widths[i] === undefined)
      if (unknown.length === 1) {
        widths[unknown[0]] = Math.max(0, c.w - range.reduce((s, i) => s + (widths[i] ?? 0), 0))
        changed = true
      }
    }
  }
  const known = widths.reduce<number>((s, w) => s + (w ?? 0), 0)
  const missing = widths.filter((w) => w === undefined).length
  return widths.map((w) => w ?? Math.max(10, (tableWidth - known) / Math.max(1, missing)))
}

/* ───────────── 쪽 나눔 ───────────── */

export interface ParagraphLayout {
  /** 한컴이 저장한 첫 줄·끝 줄의 세로 위치(HWPUNIT, 쪽마다 0부터) — 없으면 null */
  firstVert: number | null
  lastVert: number | null
  /** 문단 앞에서 쪽 나눔(pageBreak="1") */
  pageBreak: boolean
}

/**
 * 본문 문단을 쪽으로 나눈다 → 쪽마다 문단 번호 목록. 한컴이 저장한 줄 위치가 앞 문단보다 위로 돌아가면 새 쪽,
 * 강제 쪽 나눔이면 새 쪽. 줄 위치 정보가 없는 문서는 한 쪽(길이에 따라 늘어남).
 */
export function splitPages(paras: ParagraphLayout[]): number[][] {
  const pages: number[][] = [[]]
  let last: number | null = null
  paras.forEach((p, i) => {
    const current = pages[pages.length - 1]
    const restarted = p.firstVert !== null && last !== null && p.firstVert < last
    if (current.length > 0 && (p.pageBreak || restarted)) pages.push([])
    pages[pages.length - 1].push(i)
    if (p.lastVert !== null) last = p.lastVert
  })
  return pages
}

/** 쪽 번호 글자 — 형식(DIGIT·ROMAN_CAPITAL·ROMAN_SMALL·CIRCLED_DIGIT …)과 꾸밈 문자(「- 1 -」) */
export function pageNumberText(n: number, formatType: string, sideChar: string): string {
  const roman = (v: number) => {
    const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
    let s = ''
    for (const [k, r] of map) while (v >= k) { s += r; v -= k }
    return s
  }
  let body = String(n)
  if (formatType === 'ROMAN_CAPITAL') body = roman(n)
  else if (formatType === 'ROMAN_SMALL') body = roman(n).toLowerCase()
  else if (formatType === 'CIRCLED_DIGIT') body = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'[n - 1] ?? String(n)
  return sideChar ? `${sideChar} ${body} ${sideChar}` : body
}
