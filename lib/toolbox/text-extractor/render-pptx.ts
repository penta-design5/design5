/**
 * PowerPoint 화면 미리보기(P4-R3) — 슬라이드 XML을 직접 그린다(외부 라이브러리 없음, 브라우저 전용).
 * - 슬라이드를 원래 크기(EMU → px)로 세로로 이어서 보여 준다(앞 50장까지, 숨긴 슬라이드는 「(숨김)」)
 * - 배경 → 마스터 도형 → 레이아웃 도형 → 슬라이드 도형 순서. 마스터·레이아웃의 자리 표시자는 그리지 않고, 슬라이드 자리 표시자가 위치·글자 서식을 이어받는다
 * - 도형(기본 도형·사용자 지정 경로)·채우기(단색·그라데이션·그림)·선(점선·화살표)·회전/뒤집기·그룹, 그림(자르기), 표(표 스타일 근사), 글자(글머리 기호·자동 번호·자동 맞춤)
 * - 차트·SmartArt·OLE 개체·EMF/WMF 그림은 「표시 안 함」 자리
 * 글자는 textContent로만 넣고, 그림은 data:image URL, 그린 뒤 `sanitizePreview`로 정리한다.
 */
import JSZip from 'jszip'
import { elementChildren, parseXml, resolvePath } from './office'
import { sanitizePreview } from './sanitize-preview'
import {
  DEFAULT_CLR_MAP,
  PREVIEW_MAX_SLIDES,
  autoNumberText,
  bulletChar,
  child,
  children,
  colorChild,
  customGeometryPath,
  dashArray,
  emuToPx,
  findPlaceholder,
  mergePara,
  num,
  presetPath,
  presetTextRect,
  readClrMap,
  readListStyle,
  readParaProps,
  readPlaceholder,
  readPptxTheme,
  readRunProps,
  resolveColor,
  styleKindOf,
  tintHex,
  type ColorContext,
  type ParaProps,
  type PptxTheme,
  type Spacing,
} from './pptx-model'

const SVG_NS = 'http://www.w3.org/2000/svg'
const FALLBACK_FONTS = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif'
const IMAGE_MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' }
/** 기본 표 스타일(보통 스타일 2 - 강조 1) */
const DEFAULT_TABLE_STYLE = '{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}'

let uid = 0
const nextId = (p: string) => `pptx-${p}-${++uid}`

type Rels = Map<string, { path: string; type: string }>
interface Part {
  path: string
  doc: Document
  rels: Rels
}

interface Env {
  zip: JSZip
  ctx: ColorContext
  master: Part
  layout: Part
  presDefault?: Element
  txStyles?: Element
  images: Map<string, Promise<string | null>>
  tableStyles: Map<string, Element>
  /** 이 슬라이드에서 그림을 불러오는 작업(끝날 때까지 기다린다) */
  pending: Promise<void>[]
}

/** EMU → 부모 상자 px 좌표 */
interface CoordMap {
  ox: number
  oy: number
  sx: number
  sy: number
}
const ROOT_MAP: CoordMap = { ox: 0, oy: 0, sx: 1 / 9525, sy: 1 / 9525 }

interface Xfrm {
  x: number
  y: number
  cx: number
  cy: number
  rot: number
  flipH: boolean
  flipV: boolean
  chOff?: { x: number; y: number }
  chExt?: { cx: number; cy: number }
}

/* ───────────── 읽기 도우미 ───────────── */

function el<K extends keyof HTMLElementTagNameMap>(tag: K, style: Partial<CSSStyleDeclaration> = {}, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  Object.assign(e.style, style)
  parent?.appendChild(e)
  return e
}

function svg(tag: string, attrs: Record<string, string | number>, parent?: Element): SVGElement {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  parent?.appendChild(e)
  return e
}

const fontName = (name: string) => `"${name.replace(/["\\;{}<>]/g, '')}"`
const fontStack = (...names: (string | undefined)[]) => [...new Set(names.filter((n): n is string => !!n))].map(fontName).concat(FALLBACK_FONTS).join(', ')

async function readRelsOf(zip: JSZip, partPath: string): Promise<Rels> {
  const dir = partPath.slice(0, partPath.lastIndexOf('/'))
  const relsPath = `${dir}/_rels/${partPath.slice(partPath.lastIndexOf('/') + 1)}.rels`
  const file = zip.file(relsPath)
  const map: Rels = new Map()
  if (!file) return map
  const doc = parseXml(await file.async('string'))
  for (const r of Array.from(doc.getElementsByTagName('Relationship'))) {
    if (r.getAttribute('TargetMode') === 'External') continue
    const target = r.getAttribute('Target') ?? ''
    map.set(r.getAttribute('Id') ?? '', { path: target.startsWith('/') ? target.slice(1) : resolvePath(dir, target), type: (r.getAttribute('Type') ?? '').split('/').pop() ?? '' })
  }
  return map
}

function readXfrm(shape: Element): Xfrm | undefined {
  const pr = child(shape, 'p:spPr') ?? child(shape, 'p:grpSpPr')
  const x = child(pr, 'a:xfrm') ?? child(shape, 'p:xfrm')
  const off = child(x, 'a:off')
  const ext = child(x, 'a:ext')
  if (!x || !off || !ext) return undefined
  const chOff = child(x, 'a:chOff')
  const chExt = child(x, 'a:chExt')
  return {
    x: num(off, 'x') ?? 0,
    y: num(off, 'y') ?? 0,
    cx: num(ext, 'cx') ?? 0,
    cy: num(ext, 'cy') ?? 0,
    rot: (num(x, 'rot') ?? 0) / 60000,
    flipH: x.getAttribute('flipH') === '1',
    flipV: x.getAttribute('flipV') === '1',
    chOff: chOff ? { x: num(chOff, 'x') ?? 0, y: num(chOff, 'y') ?? 0 } : undefined,
    chExt: chExt ? { cx: num(chExt, 'cx') ?? 0, cy: num(chExt, 'cy') ?? 0 } : undefined,
  }
}

/** 도형 상자(부모 px 좌표) */
function boxOf(xf: Xfrm, map: CoordMap, parent: HTMLElement): HTMLDivElement {
  const box = el('div', {
    position: 'absolute',
    left: `${(xf.x - map.ox) * map.sx}px`,
    top: `${(xf.y - map.oy) * map.sy}px`,
    width: `${Math.max(0, xf.cx * map.sx)}px`,
    height: `${Math.max(0, xf.cy * map.sy)}px`,
  }, parent)
  if (xf.rot) {
    box.style.transform = `rotate(${xf.rot}deg)`
    box.style.transformOrigin = 'center'
  }
  return box
}

async function imageUrl(env: Env, path: string): Promise<string | null> {
  let p = env.images.get(path)
  if (!p) {
    p = (async () => {
      const ext = path.toLowerCase().split('.').pop() ?? ''
      const mime = IMAGE_MIME[ext]
      const file = env.zip.file(path)
      if (!mime || !file) return null
      return `data:${mime};base64,${await file.async('base64')}`
    })()
    env.images.set(path, p)
  }
  return p
}

/** blip → 그림 경로(SVG 그림이 함께 있으면 SVG 우선) */
function blipPath(blip: Element | undefined, part: Part): string | null {
  if (!blip) return null
  const svgBlip = Array.from(blip.getElementsByTagName('asvg:svgBlip'))[0]
  const id = svgBlip?.getAttribute('r:embed') || blip.getAttribute('r:embed') || ''
  return part.rels.get(id)?.path ?? null
}

function placeholderBox(box: HTMLElement, label: string) {
  const p = el('div', {
    position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    border: '1px dashed #9CA3AF', background: 'rgba(243,244,246,0.8)', color: '#6B7280', fontSize: '13px', fontFamily: 'system-ui, sans-serif', padding: '4px', boxSizing: 'border-box', overflow: 'hidden',
  }, box)
  p.textContent = label
  p.dataset.pptxPlaceholder = 'true'
}

/* ───────────── 채우기·선 ───────────── */

type Fill = { kind: 'none' } | { kind: 'solid'; color: string } | { kind: 'grad'; stops: [number, string][]; angle: number; path: boolean } | { kind: 'image'; path: string }

function readFill(spPr: Element | undefined, part: Part, ctx: ColorContext): Fill | undefined {
  if (!spPr) return undefined
  if (child(spPr, 'a:noFill')) return { kind: 'none' }
  const solid = child(spPr, 'a:solidFill')
  if (solid) {
    const c = resolveColor(colorChild(solid), ctx)
    return c ? { kind: 'solid', color: c } : { kind: 'none' }
  }
  const grad = child(spPr, 'a:gradFill')
  if (grad) {
    const stops = children(child(grad, 'a:gsLst'), 'a:gs')
      .map((gs): [number, string] | null => {
        const c = resolveColor(colorChild(gs), ctx)
        return c ? [(num(gs, 'pos') ?? 0) / 1000, c] : null
      })
      .filter((s): s is [number, string] => !!s)
      .sort((a, b) => a[0] - b[0])
    if (!stops.length) return undefined
    return { kind: 'grad', stops, angle: (num(child(grad, 'a:lin'), 'ang') ?? 0) / 60000, path: !!child(grad, 'a:path') }
  }
  const blip = child(spPr, 'a:blipFill')
  if (blip) {
    const path = blipPath(child(blip, 'a:blip'), part)
    return path ? { kind: 'image', path } : undefined
  }
  const patt = child(spPr, 'a:pattFill')
  if (patt) {
    const c = resolveColor(colorChild(child(patt, 'a:fgClr')), ctx)
    return c ? { kind: 'solid', color: c } : undefined
  }
  return undefined
}

/** 스타일 참조(p:style fillRef·lnRef)의 색 — 번호 0은 없음 */
function styleRefColor(style: Element | undefined, ref: 'a:fillRef' | 'a:lnRef' | 'a:fontRef', ctx: ColorContext): { idx: number; color?: string } | undefined {
  const r = child(style, ref)
  if (!r) return undefined
  return { idx: num(r, 'idx') ?? 0, color: resolveColor(colorChild(r), ctx) }
}

interface Line {
  color: string
  width: number
  dash?: string
  head?: string
  tail?: string
}

function readLine(ln: Element | undefined, style: Element | undefined, ctx: ColorContext, theme: PptxTheme): Line | null {
  const ref = styleRefColor(style, 'a:lnRef', ctx)
  if (ln && child(ln, 'a:noFill')) return null
  const solid = child(ln, 'a:solidFill')
  const color = solid ? resolveColor(colorChild(solid), ctx) : child(ln, 'a:gradFill') ? resolveColor(colorChild(child(child(child(ln, 'a:gradFill'), 'a:gsLst'), 'a:gs')), ctx) : ref && ref.idx > 0 ? ref.color : undefined
  if (!color) return null
  const width = emuToPx(num(ln, 'w') ?? (ref && ref.idx > 0 ? theme.lineWidths[ref.idx - 1] ?? 9525 : 9525))
  const end = (tag: string) => {
    const t = child(ln, tag)?.getAttribute('type')
    return t && t !== 'none' ? t : undefined
  }
  return { color, width: Math.max(0.5, width), dash: dashArray(child(ln, 'a:prstDash')?.getAttribute('val'), width), head: end('a:headEnd'), tail: end('a:tailEnd') }
}

function cssBackground(fill: Fill | undefined): string | undefined {
  if (!fill) return undefined
  if (fill.kind === 'solid') return fill.color
  if (fill.kind === 'grad') {
    const stops = fill.stops.map(([p, c]) => `${c} ${p}%`).join(', ')
    return fill.path ? `radial-gradient(circle, ${stops})` : `linear-gradient(${fill.angle + 90}deg, ${stops})`
  }
  return undefined
}

/* ───────────── 글자 ───────────── */

interface TextOptions {
  levels: ParaProps[]
  fontScale: number
  lineReduction: number
  wrap: boolean
  /** 글자 색 기본값(p:style fontRef) */
  color?: string
}

const spacingCss = (s: Spacing | undefined, size: number) => (!s ? '0' : 'pts' in s ? `${s.pts}pt` : `${s.pct * size * 1.2}pt`)

/** 문단들 → DOM(도형 글상자·표 칸 공용) */
function renderParagraphs(txBody: Element, container: HTMLElement, opts: TextOptions, env: Env) {
  const counters: number[] = []
  let lastNumLevel = -1
  for (const p of children(txBody, 'a:p')) {
    const pPr = child(p, 'a:pPr')
    const lvl = Math.min(8, Math.max(0, num(pPr, 'lvl') ?? 0))
    const props = mergePara(opts.levels[lvl] ?? { run: {} }, readParaProps(pPr, env.ctx))
    const parts = elementChildren(p).filter((e) => e.tagName === 'a:r' || e.tagName === 'a:br' || e.tagName === 'a:fld')
    const hasText = parts.some((r) => r.tagName !== 'a:br' && (child(r, 'a:t')?.textContent ?? '') !== '')
    const endRun = { ...props.run, ...readRunProps(child(p, 'a:endParaRPr'), env.ctx) }
    const firstRun = parts.find((r) => r.tagName !== 'a:br')
    const firstProps = firstRun ? { ...props.run, ...readRunProps(child(firstRun, 'a:rPr'), env.ctx) } : endRun
    const baseSize = (firstProps.size ?? 18) * opts.fontScale

    const para = el('div', {
      textAlign: ({ l: 'left', ctr: 'center', r: 'right', just: 'justify', dist: 'justify' } as Record<string, string>)[props.align ?? 'l'] ?? 'left',
      paddingLeft: `${props.marL ?? 0}px`,
      textIndent: `${props.indent ?? 0}px`,
      marginTop: spacingCss(props.spaceBefore, baseSize),
      marginBottom: spacingCss(props.spaceAfter, baseSize),
      lineHeight: !props.lineSpacing ? `${1.2 * (1 - opts.lineReduction)}` : 'pts' in props.lineSpacing ? `${props.lineSpacing.pts}pt` : `${props.lineSpacing.pct * 1.2 * (1 - opts.lineReduction)}`,
      fontSize: `${baseSize}pt`,
      whiteSpace: opts.wrap ? 'pre-wrap' : 'pre',
      wordBreak: 'keep-all',
      overflowWrap: 'break-word',
      color: firstProps.color ?? opts.color ?? '#000000',
      fontFamily: fontStack(firstProps.latin, firstProps.ea),
    }, container)

    // 글머리 기호·자동 번호
    const bullet = props.bullet
    if (bullet && bullet.kind !== 'none' && hasText) {
      let text: string
      if (bullet.kind === 'char') text = bulletChar(bullet.char, props.bulletFont)
      else {
        if (lastNumLevel < lvl || counters[lvl] === undefined) counters[lvl] = bullet.start - 1
        counters[lvl]++
        counters.length = lvl + 1
        lastNumLevel = lvl
        text = autoNumberText(bullet.scheme, counters[lvl])
      }
      const size = props.bulletSize ? ('pts' in props.bulletSize ? props.bulletSize.pts * opts.fontScale : props.bulletSize.pct * baseSize) : baseSize
      const indent = props.indent ?? 0
      const span = el('span', {
        display: 'inline-block',
        minWidth: indent < 0 ? `${-indent}px` : 'auto',
        paddingRight: indent < 0 ? '0' : '0.4em',
        textIndent: '0',
        fontSize: `${size}pt`,
        color: props.bulletColor ?? firstProps.color ?? opts.color ?? '#000000',
        fontFamily: bullet.kind === 'char' ? FALLBACK_FONTS : fontStack(firstProps.latin, firstProps.ea),
        verticalAlign: 'baseline',
      }, para)
      span.textContent = text
    } else if (bullet?.kind !== 'num') {
      if (hasText && bullet?.kind === 'none') lastNumLevel = -1
    }

    if (!hasText) {
      para.style.fontSize = `${(endRun.size ?? 18) * opts.fontScale}pt`
      para.appendChild(document.createTextNode('\u00A0'))
      continue
    }
    for (const r of parts) {
      if (r.tagName === 'a:br') {
        para.appendChild(document.createElement('br'))
        continue
      }
      const rPr = child(r, 'a:rPr')
      const rp = { ...props.run, ...readRunProps(rPr, env.ctx) }
      const link = !!child(rPr, 'a:hlinkClick')
      const span = el('span', {
        fontSize: `${(rp.size ?? 18) * opts.fontScale * (rp.baseline ? 0.7 : 1)}pt`,
        fontWeight: rp.bold ? '700' : '400',
        fontStyle: rp.italic ? 'italic' : 'normal',
        textDecoration: [rp.underline || link ? `underline${rp.underline === 'double' ? ' double' : ''}` : '', rp.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
        textTransform: rp.caps ? 'uppercase' : 'none',
        verticalAlign: rp.baseline ? (rp.baseline > 0 ? 'super' : 'sub') : 'baseline',
        color: rp.color ?? (link ? `#${env.ctx.theme.colors.hlink}` : opts.color ?? '#000000'),
        fontFamily: fontStack(rp.latin, rp.ea),
        backgroundColor: rp.highlight ?? '',
      }, para)
      span.textContent = child(r, 'a:t')?.textContent ?? ''
    }
  }
}

/** bodyPr 여러 개(마스터 → 레이아웃 → 도형)의 속성 이어받기 */
function bodyAttr(chain: Element[], name: string): string | undefined {
  for (let i = chain.length - 1; i >= 0; i--) {
    const v = chain[i].getAttribute(name)
    if (v !== null) return v
  }
  return undefined
}

function renderTextBody(txBody: Element, box: HTMLElement, bodyChain: Element[], levels: ParaProps[], env: Env, color?: string) {
  const chain = [...bodyChain, child(txBody, 'a:bodyPr')].filter((e): e is Element => !!e)
  const ins = (name: string, def: number) => emuToPx(Number(bodyAttr(chain, name) ?? def))
  const anchor = bodyAttr(chain, 'anchor') ?? 't'
  let autofit: Element | undefined
  for (let i = chain.length - 1; i >= 0 && !autofit; i--) autofit = elementChildren(chain[i]).find((e) => /^a:(normAutofit|noAutofit|spAutoFit)$/.test(e.tagName))
  const normFit = autofit?.tagName === 'a:normAutofit' ? autofit : undefined
  const text = el('div', {
    position: 'absolute',
    left: `${ins('lIns', 91440)}px`,
    top: `${ins('tIns', 45720)}px`,
    right: `${ins('rIns', 91440)}px`,
    bottom: `${ins('bIns', 45720)}px`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: anchor === 'ctr' ? 'center' : anchor === 'b' ? 'flex-end' : 'flex-start',
  }, box)
  const own = readListStyle(child(txBody, 'a:lstStyle'), env.ctx)
  renderParagraphs(txBody, text, {
    levels: levels.map((l, i) => mergePara(l, own[i])),
    fontScale: (num(normFit, 'fontScale') ?? 100000) / 100000,
    lineReduction: (num(normFit, 'lnSpcReduction') ?? 0) / 100000,
    wrap: bodyAttr(chain, 'wrap') !== 'none',
    color,
  }, env)
}

/* ───────────── 도형 ───────────── */

interface Geometry {
  prst: string
  adj: Record<string, number>
  custGeom?: Element
}

/** 도형 모양 — 사용자 지정 경로, 기본 도형(조정값), 없으면 이어받은 자리 표시자의 모양 */
function geometryOf(spPr: Element | undefined, inheritedPr?: Element): Geometry {
  const custGeom = child(spPr, 'a:custGeom')
  const prstGeom = child(spPr, 'a:prstGeom') ?? (custGeom ? undefined : child(inheritedPr, 'a:prstGeom'))
  const adj: Record<string, number> = {}
  for (const gd of children(child(prstGeom, 'a:avLst'), 'a:gd')) {
    const m = (gd.getAttribute('fmla') ?? '').match(/^val\s+(-?\d+)/)
    if (m) adj[gd.getAttribute('name') ?? ''] = Number(m[1])
  }
  return { prst: custGeom ? 'custom' : (prstGeom?.getAttribute('prst') ?? 'rect'), adj, custGeom }
}

/** 도형의 경로 + 채우기·선을 SVG로 */
function drawGeometry(box: HTMLElement, geo: Geometry, w: number, h: number, fill: Fill | undefined, line: Line | null, flip: { h: boolean; v: boolean }, env: Env) {
  const geom = geo.custGeom ? { d: customGeometryPath(geo.custGeom, w, h), open: false } : presetPath(geo.prst, w, h, geo.adj)
  if (!geom.d) return geom
  const hasFill = fill && fill.kind !== 'none' && !geom.open
  if (!hasFill && !line) return geom

  if (fill?.kind === 'image' && !geom.open) {
    const img = el('img', { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'fill', clipPath: `path("${geom.d}")` }, box)
    img.alt = ''
    env.pending.push(imageUrl(env, fill.path).then((url) => { if (url) img.src = url; else img.remove() }))
  }

  const s = svg('svg', { width: Math.max(1, w), height: Math.max(1, h), viewBox: `0 0 ${Math.max(1, w)} ${Math.max(1, h)}` }, box)
  Object.assign((s as SVGSVGElement).style, { position: 'absolute', left: '0', top: '0', overflow: 'visible' })
  const g = svg('g', flip.h || flip.v ? { transform: `translate(${flip.h ? w : 0} ${flip.v ? h : 0}) scale(${flip.h ? -1 : 1} ${flip.v ? -1 : 1})` } : {}, s)
  let fillAttr = 'none'
  if (hasFill && fill.kind === 'solid') fillAttr = fill.color
  if (hasFill && fill.kind === 'grad') {
    const id = nextId('grad')
    const defs = svg('defs', {}, s)
    const rad = (fill.angle * Math.PI) / 180
    const grad = fill.path
      ? svg('radialGradient', { id }, defs)
      : svg('linearGradient', { id, x1: 0.5 - Math.cos(rad) / 2, y1: 0.5 - Math.sin(rad) / 2, x2: 0.5 + Math.cos(rad) / 2, y2: 0.5 + Math.sin(rad) / 2 }, defs)
    for (const [pos, color] of fill.stops) svg('stop', { offset: `${pos}%`, 'stop-color': color }, grad)
    fillAttr = `url(#${id})`
  }
  const path = svg('path', { d: geom.d, fill: fillAttr, 'fill-rule': 'evenodd' }, g)
  if (line) {
    path.setAttribute('stroke', line.color)
    path.setAttribute('stroke-width', String(line.width))
    if (line.dash) path.setAttribute('stroke-dasharray', line.dash)
    path.setAttribute('stroke-linejoin', 'round')
    if (line.head || line.tail) {
      const defs = svg('defs', {}, s)
      const marker = (end: 'start' | 'end') => {
        const id = nextId('arrow')
        const m = svg('marker', { id, viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' }, defs)
        svg('path', { d: 'M0 0 L10 5 L0 10 Z', fill: line.color }, m)
        path.setAttribute(`marker-${end}`, `url(#${id})`)
      }
      if (line.head) marker('start')
      if (line.tail) marker('end')
    }
  }
  return geom
}

interface ShapeInherit {
  /** 이어받는 자리 표시자(마스터 → 레이아웃 순) */
  chain: Element[]
  kind: 'title' | 'body' | 'other' | null
}

function inheritOf(shape: Element, env: Env, isSlide: boolean): ShapeInherit {
  const ph = readPlaceholder(shape)
  if (!ph) return { chain: [], kind: null }
  const tree = (p: Part) => {
    const t = p.doc.getElementsByTagName('p:spTree')[0]
    return t ? elementChildren(t).filter((e) => e.tagName === 'p:sp') : []
  }
  const chain: Element[] = []
  const masterPh = findPlaceholder(tree(env.master), ph, false)
  if (masterPh) chain.push(masterPh)
  if (isSlide) {
    const layoutPh = findPlaceholder(tree(env.layout), ph, true)
    if (layoutPh) chain.push(layoutPh)
  }
  return { chain, kind: styleKindOf(ph) }
}

/** 글자 수준 서식: 마스터 글자 스타일(제목·본문·기타 / 일반 글상자는 프레젠테이션 기본) → 자리 표시자 목록 스타일들 */
function textLevels(inherit: ShapeInherit, env: Env): ParaProps[] {
  const base = inherit.kind
    ? readListStyle(child(env.txStyles, inherit.kind === 'title' ? 'p:titleStyle' : inherit.kind === 'body' ? 'p:bodyStyle' : 'p:otherStyle'), env.ctx)
    : readListStyle(env.presDefault, env.ctx)
  let levels = base
  for (const ph of inherit.chain) {
    const lst = readListStyle(child(child(ph, 'p:txBody'), 'a:lstStyle'), env.ctx)
    levels = levels.map((l, i) => mergePara(l, lst[i]))
  }
  return levels
}

function renderShape(shape: Element, parent: HTMLElement, map: CoordMap, part: Part, env: Env, isSlide: boolean) {
  const inherit = inheritOf(shape, env, isSlide)
  const xf = readXfrm(shape) ?? [...inherit.chain].reverse().map(readXfrm).find(Boolean)
  if (!xf) return
  const box = boxOf(xf, map, parent)
  const w = xf.cx * map.sx
  const h = xf.cy * map.sy
  const spPr = child(shape, 'p:spPr')
  const inheritedPr = [...inherit.chain].reverse().map((s) => child(s, 'p:spPr'))
  const style = child(shape, 'p:style')
  let fill = readFill(spPr, part, env.ctx)
  for (const pr of inheritedPr) if (!fill) fill = readFill(pr, part, env.ctx)
  if (!fill) {
    const ref = styleRefColor(style, 'a:fillRef', env.ctx)
    if (ref && ref.idx > 0 && ref.color) fill = { kind: 'solid', color: ref.color }
  }
  const ln = child(spPr, 'a:ln') ?? inheritedPr.map((pr) => child(pr, 'a:ln')).find(Boolean)
  const line = readLine(ln, style, env.ctx, env.ctx.theme)
  const geo = geometryOf(spPr, inheritedPr.find((pr) => child(pr, 'a:prstGeom')))
  drawGeometry(box, geo, w, h, fill, line, { h: xf.flipH, v: xf.flipV }, env)

  const txBody = child(shape, 'p:txBody')
  if (txBody && txBody.textContent?.trim()) {
    const bodyChain = inherit.chain.map((s) => child(child(s, 'p:txBody'), 'a:bodyPr')).filter((e): e is Element => !!e)
    // 도형 스타일의 글자 색(fontRef)은 기본 글자 스타일보다 강하고, 도형·문단·글자 서식보다 약하다
    const fontColor = styleRefColor(style, 'a:fontRef', env.ctx)?.color
    const levels = textLevels(inherit, env).map((l) => (fontColor ? mergePara(l, { run: { color: fontColor } }) : l))
    const rect = presetTextRect(geo.prst, w, h, geo.adj)
    const textBox = el('div', { position: 'absolute', left: `${rect.l}px`, top: `${rect.t}px`, width: `${rect.r - rect.l}px`, height: `${rect.b - rect.t}px` }, box)
    renderTextBody(txBody, textBox, bodyChain, levels, env, fontColor)
  }
}

function renderPicture(pic: Element, parent: HTMLElement, map: CoordMap, part: Part, env: Env) {
  const xf = readXfrm(pic)
  if (!xf) return
  const box = boxOf(xf, map, parent)
  const w = xf.cx * map.sx
  const h = xf.cy * map.sy
  const blipFill = child(pic, 'p:blipFill')
  const path = blipPath(child(blipFill, 'a:blip'), part)
  const spPr = child(pic, 'p:spPr')
  const prst = child(spPr, 'a:prstGeom')?.getAttribute('prst')
  const clip = prst && prst !== 'rect' ? presetPath(prst, w, h).d : undefined
  const ext = path?.toLowerCase().split('.').pop() ?? ''
  if (!path || !IMAGE_MIME[ext]) {
    placeholderBox(box, ext === 'emf' || ext === 'wmf' ? `그림(${ext.toUpperCase()})은 미리보기에 표시하지 않습니다` : '그림을 표시할 수 없습니다')
    return
  }
  const frame = el('div', { position: 'absolute', inset: '0', overflow: 'hidden', clipPath: clip ? `path("${clip}")` : '' }, box)
  const src = child(blipFill, 'a:srcRect')
  const crop = (a: string) => (num(src, a) ?? 0) / 100000
  const [l, t, r, b] = [crop('l'), crop('t'), crop('r'), crop('b')]
  const iw = w / Math.max(0.01, 1 - l - r)
  const ih = h / Math.max(0.01, 1 - t - b)
  const img = el('img', { position: 'absolute', left: `${-l * iw}px`, top: `${-t * ih}px`, width: `${iw}px`, height: `${ih}px`, maxWidth: 'none', transform: xf.flipH || xf.flipV ? `scale(${xf.flipH ? -1 : 1}, ${xf.flipV ? -1 : 1})` : '' }, frame)
  img.alt = ''
  env.pending.push(imageUrl(env, path).then((url) => { if (url) img.src = url; else img.remove() }))
  const line = readLine(child(spPr, 'a:ln'), child(pic, 'p:style'), env.ctx, env.ctx.theme)
  if (line) drawGeometry(box, geometryOf(spPr), w, h, { kind: 'none' }, line, { h: false, v: false }, env)
}

function renderGroup(grp: Element, parent: HTMLElement, map: CoordMap, part: Part, env: Env, isSlide: boolean) {
  const xf = readXfrm(grp)
  if (!xf) return renderTree(grp, parent, map, part, env, isSlide)
  const box = boxOf(xf, map, parent)
  if (xf.flipH || xf.flipV) box.style.transform = `${box.style.transform} scale(${xf.flipH ? -1 : 1}, ${xf.flipV ? -1 : 1})`.trim()
  const chOff = xf.chOff ?? { x: xf.x, y: xf.y }
  const chExt = xf.chExt ?? { cx: xf.cx, cy: xf.cy }
  const inner: CoordMap = {
    ox: chOff.x,
    oy: chOff.y,
    sx: map.sx * (chExt.cx ? xf.cx / chExt.cx : 1),
    sy: map.sy * (chExt.cy ? xf.cy / chExt.cy : 1),
  }
  renderTree(grp, box, inner, part, env, isSlide)
}

/* ───────────── 표 ───────────── */

interface CellStyle {
  fill?: string
  bold?: boolean
  color?: string
  borders: Partial<Record<'left' | 'right' | 'top' | 'bottom' | 'insideH' | 'insideV', string>>
}

function lineCss(ln: Element | undefined, ctx: ColorContext): string | undefined {
  if (!ln || child(ln, 'a:noFill')) return undefined
  const c = resolveColor(colorChild(child(ln, 'a:solidFill')), ctx)
  if (!c) return undefined
  return `${Math.max(1, emuToPx(num(ln, 'w') ?? 12700))}px solid ${c}`
}

function readTablePart(part: Element | undefined, ctx: ColorContext): CellStyle | undefined {
  if (!part) return undefined
  const tc = child(part, 'a:tcStyle')
  const txt = child(part, 'a:tcTxStyle')
  const fillEl = child(child(tc, 'a:fill'), 'a:solidFill')
  const borders: CellStyle['borders'] = {}
  const bdr = child(tc, 'a:tcBdr')
  for (const side of ['left', 'right', 'top', 'bottom', 'insideH', 'insideV'] as const) {
    const ln = child(child(bdr, `a:${side}`), 'a:ln')
    const css = lineCss(ln, ctx)
    if (css) borders[side] = css
  }
  return {
    fill: fillEl ? resolveColor(colorChild(fillEl), ctx) : undefined,
    bold: txt ? txt.getAttribute('b') === 'on' : undefined,
    color: txt ? resolveColor(colorChild(txt), ctx) : undefined,
    borders,
  }
}

/** 표 스타일 — tableStyles.xml에 있으면 그대로, 기본 스타일이 파일에 없으면 「보통 스타일 2 - 강조 1」 근사 */
function tableStyleParts(id: string | undefined, env: Env): Record<string, CellStyle | undefined> {
  const def = id ? env.tableStyles.get(id) : undefined
  if (def) {
    const out: Record<string, CellStyle | undefined> = {}
    for (const name of ['wholeTbl', 'band1H', 'band2H', 'band1V', 'firstRow', 'lastRow', 'firstCol', 'lastCol']) out[name] = readTablePart(child(def, `a:${name}`), env.ctx)
    return out
  }
  if (id !== DEFAULT_TABLE_STYLE) return { wholeTbl: { borders: { left: '1px solid #000', right: '1px solid #000', top: '1px solid #000', bottom: '1px solid #000', insideH: '1px solid #000', insideV: '1px solid #000' } } }
  const accent = env.ctx.theme.colors.accent1
  const tint = (t: number) => `#${tintHex(accent, t)}`
  const white = '1px solid #FFFFFF'
  return {
    wholeTbl: { fill: tint(0.2), borders: { left: white, right: white, top: white, bottom: white, insideH: white, insideV: white } },
    band1H: { fill: tint(0.4), borders: {} },
    firstRow: { fill: `#${accent}`, bold: true, color: '#FFFFFF', borders: {} },
    lastRow: { fill: `#${accent}`, bold: true, color: '#FFFFFF', borders: {} },
  }
}

function renderTable(frame: Element, tbl: Element, parent: HTMLElement, map: CoordMap, env: Env) {
  const xf = readXfrm(frame)
  if (!xf) return
  const box = boxOf(xf, map, parent)
  const cols = children(child(tbl, 'a:tblGrid'), 'a:gridCol').map((c) => (num(c, 'w') ?? 0) * map.sx)
  const tblPr = child(tbl, 'a:tblPr')
  const flag = (a: string) => tblPr?.getAttribute(a) === '1'
  const styles = tableStyleParts(child(tblPr, 'a:tableStyleId')?.textContent?.trim(), env)
  const table = el('table', { borderCollapse: 'collapse', tableLayout: 'fixed', width: `${cols.reduce((a, b) => a + b, 0)}px` }, box)
  const colgroup = el('colgroup', {}, table)
  for (const w of cols) el('col', { width: `${w}px` }, colgroup)
  const rows = children(tbl, 'a:tr')
  const levels = readListStyle(env.presDefault, env.ctx)
  rows.forEach((tr, ri) => {
    const row = el('tr', { height: `${(num(tr, 'h') ?? 0) * map.sy}px` }, table)
    let ci = 0
    for (const tc of children(tr, 'a:tc')) {
      const span = num(tc, 'gridSpan') ?? 1
      if (tc.getAttribute('hMerge') === '1' || tc.getAttribute('vMerge') === '1') {
        ci += 1
        continue
      }
      // 적용할 스타일 부분(약한 것 → 강한 것)
      const partsApplied = [styles.wholeTbl]
      const bodyRow = flag('firstRow') ? ri - 1 : ri
      if (flag('bandRow') && bodyRow >= 0 && bodyRow % 2 === 0) partsApplied.push(styles.band1H)
      if (flag('bandRow') && bodyRow >= 0 && bodyRow % 2 === 1) partsApplied.push(styles.band2H)
      if (flag('firstCol') && ci === 0) partsApplied.push(styles.firstCol)
      if (flag('lastCol') && ci + span === cols.length) partsApplied.push(styles.lastCol)
      if (flag('firstRow') && ri === 0) partsApplied.push(styles.firstRow)
      if (flag('lastRow') && ri === rows.length - 1) partsApplied.push(styles.lastRow)
      const st: CellStyle = { borders: {} }
      for (const p of partsApplied) {
        if (!p) continue
        if (p.fill) st.fill = p.fill
        if (p.bold !== undefined) st.bold = p.bold
        if (p.color) st.color = p.color
        Object.assign(st.borders, p.borders)
      }
      const td = el('td', { padding: '0', verticalAlign: 'top', position: 'relative', overflow: 'hidden' }, row)
      td.colSpan = span
      td.rowSpan = num(tc, 'rowSpan') ?? 1
      const tcPr = child(tc, 'a:tcPr')
      const b = st.borders
      td.style.borderLeft = lineCss(child(tcPr, 'a:lnL'), env.ctx) ?? (ci === 0 ? b.left : b.insideV) ?? ''
      td.style.borderRight = lineCss(child(tcPr, 'a:lnR'), env.ctx) ?? (ci + span === cols.length ? b.right : b.insideV) ?? ''
      td.style.borderTop = lineCss(child(tcPr, 'a:lnT'), env.ctx) ?? (ri === 0 ? b.top : b.insideH) ?? ''
      td.style.borderBottom = lineCss(child(tcPr, 'a:lnB'), env.ctx) ?? (ri === rows.length - 1 ? b.bottom : b.insideH) ?? ''
      const fill = readFill(tcPr, { path: '', doc: frame.ownerDocument, rels: new Map() }, env.ctx)
      td.style.background = (fill ? cssBackground(fill) : st.fill) ?? ''
      const anchor = tcPr?.getAttribute('anchor')
      td.style.verticalAlign = anchor === 'ctr' ? 'middle' : anchor === 'b' ? 'bottom' : 'top'
      const ins = (a: string, d: number) => `${emuToPx(num(tcPr, a) ?? d)}px`
      td.style.padding = `${ins('marT', 45720)} ${ins('marR', 91440)} ${ins('marB', 45720)} ${ins('marL', 91440)}`
      const txBody = child(tc, 'a:txBody')
      if (txBody) {
        const own = readListStyle(child(txBody, 'a:lstStyle'), env.ctx)
        const cellLevels = levels.map((l, i) => mergePara(mergePara(l, { run: { bold: st.bold, color: st.color } }), own[i]))
        renderParagraphs(txBody, td, { levels: cellLevels, fontScale: 1, lineReduction: 0, wrap: true, color: st.color }, env)
      }
      ci += span
    }
  })
}

function renderGraphicFrame(frame: Element, parent: HTMLElement, map: CoordMap, env: Env) {
  const data = child(child(frame, 'a:graphic'), 'a:graphicData')
  const uri = data?.getAttribute('uri') ?? ''
  const tbl = child(data, 'a:tbl')
  if (tbl) return renderTable(frame, tbl, parent, map, env)
  const xf = readXfrm(frame)
  if (!xf) return
  const box = boxOf(xf, map, parent)
  placeholderBox(box, uri.endsWith('/chart') ? '차트는 미리보기에 표시하지 않습니다' : uri.endsWith('/diagram') ? 'SmartArt는 미리보기에 표시하지 않습니다' : '이 개체는 미리보기에 표시하지 않습니다')
}

/* ───────────── 트리·슬라이드 ───────────── */

function renderTree(tree: Element, parent: HTMLElement, map: CoordMap, part: Part, env: Env, isSlide: boolean, skipPlaceholders = false) {
  for (const node of elementChildren(tree)) {
    try {
      let target = node
      if (node.tagName === 'mc:AlternateContent') {
        // 대체 콘텐츠: 그림이 들어 있는 Fallback 우선, 없으면 Choice
        const alt = child(node, 'mc:Fallback') ?? child(node, 'mc:Choice')
        const inner = alt ? elementChildren(alt)[0] : undefined
        if (!inner) continue
        target = inner
      }
      if (skipPlaceholders && readPlaceholder(target)) continue
      switch (target.tagName) {
        case 'p:sp':
        case 'p:cxnSp':
          renderShape(target, parent, map, part, env, isSlide)
          break
        case 'p:pic':
          renderPicture(target, parent, map, part, env)
          break
        case 'p:grpSp':
          renderGroup(target, parent, map, part, env, isSlide)
          break
        case 'p:graphicFrame':
          renderGraphicFrame(target, parent, map, env)
          break
      }
    } catch (e) {
      console.error('[OCR] 슬라이드 도형 미리보기 실패:', e)
    }
  }
}

/** 배경 — 슬라이드 → 레이아웃 → 마스터 순으로 처음 있는 것 */
function applyBackground(slideEl: HTMLElement, parts: Part[], env: Env) {
  for (const part of parts) {
    const bg = child(part.doc.getElementsByTagName('p:cSld')[0], 'p:bg')
    if (!bg) continue
    const bgPr = child(bg, 'p:bgPr')
    const bgRef = child(bg, 'p:bgRef')
    if (bgPr) {
      const fill = readFill(bgPr, part, env.ctx)
      if (fill?.kind === 'image') {
        const img = el('img', { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'fill' }, slideEl)
        img.alt = ''
        env.pending.push(imageUrl(env, fill.path).then((url) => { if (url) img.src = url; else img.remove() }))
      } else slideEl.style.background = cssBackground(fill) ?? '#FFFFFF'
    } else if (bgRef) slideEl.style.background = resolveColor(colorChild(bgRef), env.ctx) ?? '#FFFFFF'
    return
  }
}

export async function renderPptxPreview(data: ArrayBuffer, body: HTMLElement): Promise<void> {
  const zip = await JSZip.loadAsync(data)
  const presFile = zip.file('ppt/presentation.xml')
  if (!presFile) throw new Error('presentation.xml 없음')
  const pres = parseXml(await presFile.async('string'))
  const presRels = await readRelsOf(zip, 'ppt/presentation.xml')
  const sldSz = pres.getElementsByTagName('p:sldSz')[0]
  const W = emuToPx(num(sldSz, 'cx') ?? 12192000)
  const H = emuToPx(num(sldSz, 'cy') ?? 6858000)
  const presDefault = pres.getElementsByTagName('p:defaultTextStyle')[0]

  const docs = new Map<string, Promise<Part | null>>()
  const partOf = (path: string) => {
    let p = docs.get(path)
    if (!p) {
      p = (async () => {
        const file = zip.file(path)
        if (!file) return null
        return { path, doc: parseXml(await file.async('string')), rels: await readRelsOf(zip, path) }
      })()
      docs.set(path, p)
    }
    return p
  }
  const relOfType = (part: Part, type: string) => Array.from(part.rels.values()).find((r) => r.type === type)?.path

  const tableStyles = new Map<string, Element>()
  const tsFile = zip.file('ppt/tableStyles.xml')
  if (tsFile) for (const s of Array.from(parseXml(await tsFile.async('string')).getElementsByTagName('a:tblStyle'))) tableStyles.set(s.getAttribute('styleId') ?? '', s)

  const images = new Map<string, Promise<string | null>>()
  const slideIds = Array.from(pres.getElementsByTagName('p:sldId')).map((s) => s.getAttribute('r:id') ?? '')

  const root = el('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', padding: '28px', width: 'max-content', minWidth: '100%', boxSizing: 'border-box' })
  root.dataset.testid = 'pptx-preview'
  if (slideIds.length > PREVIEW_MAX_SLIDES) {
    const notice = el('p', { margin: '0', padding: '10px 16px', fontSize: '20px', color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '4px', fontFamily: 'system-ui, sans-serif' }, root)
    notice.dataset.testid = 'pptx-truncated'
    notice.textContent = `미리보기는 앞 ${PREVIEW_MAX_SLIDES}장까지만 표시합니다. 추출은 전체 내용으로 합니다.`
  }

  for (const [i, rid] of slideIds.slice(0, PREVIEW_MAX_SLIDES).entries()) {
    const figure = el('figure', { margin: '0', display: 'flex', flexDirection: 'column', gap: '10px' }, root)
    // 슬라이드(1280px 안팎)가 폭 맞춤으로 절반쯤 줄어드므로 원래 크기를 크게 둔다(줄인 뒤 약 11px)
    const caption = el('figcaption', { fontSize: '20px', color: '#4B5563', fontFamily: 'system-ui, sans-serif' }, figure)
    const slideEl = el('div', { position: 'relative', width: `${W}px`, height: `${H}px`, overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', flex: 'none' }, figure)
    slideEl.dataset.testid = 'pptx-slide'
    const slidePath = presRels.get(rid)?.path
    const slide = slidePath ? await partOf(slidePath) : null
    const hidden = slide?.doc.documentElement.getAttribute('show') === '0'
    caption.textContent = `슬라이드 ${i + 1}${hidden ? ' (숨김)' : ''}`
    if (!slide) {
      placeholderBox(slideEl, '이 슬라이드는 미리보기를 표시할 수 없습니다')
      continue
    }
    try {
      const layoutPath = relOfType(slide, 'slideLayout')
      const layout = layoutPath ? await partOf(layoutPath) : null
      const masterPath = layout ? relOfType(layout, 'slideMaster') : undefined
      const master = masterPath ? await partOf(masterPath) : null
      if (!layout || !master) throw new Error('레이아웃·마스터 없음')
      const themePath = relOfType(master, 'theme')
      const themePart = themePath ? await partOf(themePath) : null
      const theme = readPptxTheme(themePart?.doc ?? null)
      const masterMap = readClrMap(master.doc.getElementsByTagName('p:clrMap')[0])
      const override = (doc: Document) => doc.getElementsByTagName('a:overrideClrMapping')[0]
      const clrMap = override(slide.doc) ? readClrMap(override(slide.doc)) : override(layout.doc) ? readClrMap(override(layout.doc)) : masterMap ?? DEFAULT_CLR_MAP
      const env: Env = {
        zip,
        ctx: { theme, clrMap },
        master,
        layout,
        presDefault,
        txStyles: master.doc.getElementsByTagName('p:txStyles')[0],
        images,
        tableStyles,
        pending: [],
      }
      applyBackground(slideEl, [slide, layout, master], env)
      const spTree = (p: Part) => p.doc.getElementsByTagName('p:spTree')[0]
      const showMaster = (p: Part) => p.doc.documentElement.getAttribute('showMasterSp') !== '0'
      if (showMaster(slide)) {
        if (showMaster(layout)) renderTree(spTree(master), slideEl, ROOT_MAP, master, env, false, true)
        renderTree(spTree(layout), slideEl, ROOT_MAP, layout, env, false, true)
      }
      renderTree(spTree(slide), slideEl, ROOT_MAP, slide, env, true)
      await Promise.all(env.pending)
    } catch (e) {
      console.error('[OCR] 슬라이드 미리보기 실패:', e)
      slideEl.replaceChildren()
      placeholderBox(slideEl, '이 슬라이드는 미리보기를 표시할 수 없습니다')
    }
  }
  if (slideIds.length === 0) el('p', { fontSize: '14px', color: '#6B7280' }, root).textContent = '슬라이드가 없습니다.'
  sanitizePreview(root)
  body.appendChild(root)
}
