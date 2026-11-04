/**
 * CI/BI 로고 브랜드 색상 — 속성 패널 "원본" 색상 견본과 업로드 시 색상 검사에 사용.
 *
 * 새 브랜드(BI)를 올릴 때 그 브랜드 색을 아래 목록에 추가하세요.
 * 목록에 없는 색이 SVG에 들어 있으면 업로드 대화상자에서 경고합니다(업로드는 막지 않음).
 */

import { extractColors } from '@/lib/svg/color'

/** 속성 패널 "원본 색상" 값 — SVG 색상을 바꾸지 않고 업로드한 그대로 사용 */
export const ORIGINAL_COLOR = 'ORIGINAL'

export interface BrandColor {
  /** 6자리 소문자 hex */
  hex: string
  name: string
}

export const CI_BI_BRAND_COLORS: readonly BrandColor[] = [
  { hex: '#0060a9', name: '펜타 블루' },
  { hex: '#999b9e', name: '펜타 그레이' },
  { hex: '#3948e5', name: 'Cloudbric 블루' },
  { hex: '#000000', name: '검정' },
  { hex: '#ffffff', name: '흰색' },
]

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
}

function toHexByte(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
}

/**
 * 색상 표기를 6자리 소문자 hex로 통일한다.
 * `#3948E5`, `#fff`, `rgb(57, 72, 229)`, `rgb(57 72 229 / 1)`, `black` 등을 지원.
 * 투명(alpha 0), `none`, `url(...)`, 해석할 수 없는 값은 null.
 */
export function normalizeSvgColor(raw: string): string | null {
  const value = raw.trim().toLowerCase()
  if (!value || value === 'none' || value === 'transparent' || value.startsWith('url(')) return null

  if (NAMED_COLORS[value]) return NAMED_COLORS[value]

  const hex = value.match(/^#([0-9a-f]{3,8})$/)
  if (hex) {
    const digits = hex[1]
    if (digits.length === 3 || digits.length === 4) {
      if (digits.length === 4 && digits[3] === '0') return null
      return `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`
    }
    if (digits.length === 6) return `#${digits}`
    if (digits.length === 8) return digits.slice(6) === '00' ? null : `#${digits.slice(0, 6)}`
    return null
  }

  const rgb = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/)
  if (rgb) {
    const alpha = rgb[4]
    if (alpha !== undefined && parseFloat(alpha) === 0) return null
    return `#${toHexByte(+rgb[1])}${toHexByte(+rgb[2])}${toHexByte(+rgb[3])}`
  }

  return null
}

/** 표기를 통일하고 중복을 제거한다(처음 등장한 순서 유지). */
export function uniqueNormalizedColors(colors: readonly string[]): string[] {
  const result: string[] = []
  for (const color of colors) {
    const normalized = normalizeSvgColor(color)
    if (normalized && !result.includes(normalized)) result.push(normalized)
  }
  return result
}

/** 브랜드 색 목록에 없는 색만 골라낸다. */
export function findOffBrandColors(
  colors: readonly string[],
  palette: readonly BrandColor[] = CI_BI_BRAND_COLORS,
): string[] {
  const allowed = new Set(palette.map((c) => c.hex))
  return uniqueNormalizedColors(colors).filter((c) => !allowed.has(c))
}

/** 색이 칠해지는 도형 요소(소문자 태그명) */
const PAINTED_TAGS = new Set(['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'text', 'tspan'])
/** 화면에 직접 그려지지 않는 정의 영역(소문자 태그명) — 안쪽 도형은 제외 */
const NON_RENDERED_TAGS = new Set([
  'defs', 'clippath', 'mask', 'symbol', 'pattern', 'marker', 'lineargradient', 'radialgradient', 'style', 'title', 'desc', 'metadata',
])

type PaintProp = 'fill' | 'stroke' | 'color' | 'fill-opacity' | 'stroke-opacity' | 'stroke-width' | 'display' | 'opacity'
const PAINT_PROPS: readonly PaintProp[] = ['fill', 'stroke', 'color', 'fill-opacity', 'stroke-opacity', 'stroke-width', 'display', 'opacity']
/** 부모에서 상속되지 않는 속성 */
const NON_INHERITED = new Set<PaintProp>(['display', 'opacity'])
const INITIAL: Record<PaintProp, string> = {
  fill: '#000000',
  stroke: 'none',
  color: '#000000',
  'fill-opacity': '1',
  'stroke-opacity': '1',
  'stroke-width': '1',
  display: 'inline',
  opacity: '1',
}

interface CssRule {
  selector: string
  decls: Partial<Record<PaintProp, string>>
}

function parseDeclarations(text: string): Partial<Record<PaintProp, string>> {
  const decls: Partial<Record<PaintProp, string>> = {}
  for (const part of text.split(';')) {
    const idx = part.indexOf(':')
    if (idx < 0) continue
    const name = part.slice(0, idx).trim().toLowerCase() as PaintProp
    const value = part.slice(idx + 1).replace(/!important/i, '').trim()
    if (PAINT_PROPS.includes(name) && value) decls[name] = value
  }
  return decls
}

/** `<style>` 안의 단순 규칙만 해석(@media 등 at-rule은 무시). 같은 요소에 여러 규칙이 맞으면 뒤의 것이 우선. */
function parseStyleRules(doc: Document): CssRule[] {
  const rules: CssRule[] = []
  doc.querySelectorAll('style').forEach((styleEl) => {
    const css = (styleEl.textContent || '').replace(/\/\*[\s\S]*?\*\//g, '')
    const re = /([^{}@]+)\{([^{}]*)\}/g
    let m: RegExpExecArray | null
    while ((m = re.exec(css)) !== null) {
      const decls = parseDeclarations(m[2])
      if (Object.keys(decls).length === 0) continue
      for (const selector of m[1].split(',')) {
        const s = selector.trim()
        if (s) rules.push({ selector: s, decls })
      }
    }
  })
  return rules
}

function safeMatches(el: Element, selector: string): boolean {
  try {
    return el.matches(selector)
  } catch {
    return false
  }
}

/**
 * SVG에서 실제로 보이는 색을 추출한다(표기 통일·중복 제거).
 *
 * 브라우저 렌더링 없이 SVG 규칙대로 직접 계산한다:
 * 인라인 style > `<style>` 규칙 > 표현 속성(fill="…") > 부모 상속 > 기본값(fill 검정, stroke 없음).
 * 그래서 fill을 생략한 도형(기본 검정), `<style>` 클래스(일러스트레이터), 부모 `<g>` 상속까지 반영한다.
 * DOMParser가 없는 환경(서버)에서는 속성 문자열 기반 `extractColors()`로 대체한다.
 */
export function getRenderedSvgColors(svgText: string): string[] {
  if (typeof DOMParser === 'undefined') {
    return uniqueNormalizedColors(extractColors(svgText))
  }

  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = doc.documentElement
  if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length > 0) {
    return []
  }

  const rules = parseStyleRules(doc)
  const colors: string[] = []

  const resolveOwn = (el: Element): Partial<Record<PaintProp, string>> => {
    const own: Partial<Record<PaintProp, string>> = {}
    for (const prop of PAINT_PROPS) {
      const attr = el.getAttribute(prop)
      if (attr) own[prop] = attr.trim()
    }
    for (const rule of rules) {
      if (safeMatches(el, rule.selector)) Object.assign(own, rule.decls)
    }
    Object.assign(own, parseDeclarations(el.getAttribute('style') || ''))
    return own
  }

  const walk = (el: Element, parent: Record<PaintProp, string>) => {
    const tag = el.localName.toLowerCase()
    if (NON_RENDERED_TAGS.has(tag)) return

    const own = resolveOwn(el)
    const computed = {} as Record<PaintProp, string>
    for (const prop of PAINT_PROPS) {
      const value = own[prop]
      if (value === undefined || value === 'inherit') {
        computed[prop] = NON_INHERITED.has(prop) && value !== 'inherit' ? INITIAL[prop] : parent[prop]
      } else {
        computed[prop] = value
      }
    }
    for (const prop of ['fill', 'stroke'] as const) {
      if (computed[prop].toLowerCase() === 'currentcolor') computed[prop] = computed.color
    }

    if (computed.display === 'none' || parseFloat(computed.opacity) === 0) return

    if (PAINTED_TAGS.has(tag)) {
      if (parseFloat(computed['fill-opacity']) !== 0) colors.push(computed.fill)
      if (parseFloat(computed['stroke-width']) !== 0 && parseFloat(computed['stroke-opacity']) !== 0) {
        colors.push(computed.stroke)
      }
    }

    for (const child of Array.from(el.children)) walk(child, computed)
  }

  walk(root, { ...INITIAL })
  return uniqueNormalizedColors(colors)
}
