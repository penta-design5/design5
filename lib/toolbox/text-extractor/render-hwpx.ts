/**
 * 한글(HWPX) 화면 미리보기(P4-R4) — 구역 XML을 직접 그린다(외부 라이브러리 없음, 브라우저 전용, 낮은 재현도 허용).
 * - 용지 크기·여백(pagePr)대로 쪽을 그리고, **한컴이 저장한 줄 위치(linesegarray)**로 쪽을 나눈다(강제 쪽 나눔·구역마다 새 쪽). 앞 50쪽까지
 * - 문단(정렬·여백·들여쓰기/내어쓰기·줄 간격·문단 간격·테두리/배경), 글자(크기·색·굵게·기울임·밑줄·취소선·자간·첨자·음영·글꼴 계열)
 * - 표(칸 너비·높이·병합·테두리·배경·여백·세로 정렬), 그림(BinData), 글상자, 머리말·꼬리말·쪽 번호, 여러 단
 * - 수식·차트·OLE 등은 「표시 안 함」 자리. 문단 번호·글머리 기호 자동 매기기와 각주는 그리지 않는다
 * 글자는 textContent로만 넣고, 그림은 data:image URL, 그린 뒤 `sanitizePreview`로 정리한다.
 */
import JSZip from 'jszip'
import { elementChildren, parseXml, readHwpxManifest } from './office'
import { sanitizePreview } from './sanitize-preview'
import {
  ALIGN_CSS,
  columnWidths,
  PREVIEW_MAX_PAGES,
  childOf,
  fontStackOf,
  hwpColor,
  hwpToPx,
  lineHeightCss,
  pageNumberText,
  paragraphIndentCss,
  readHwpxStyles,
  splitPages,
  type BorderFill,
  type BorderLine,
  type CharStyle,
  type HwpxStyles,
} from './hwpx-model'

const IMAGE_MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' }
const OBJECT_LABEL: Record<string, string> = {
  'hp:equation': '수식', 'hp:chart': '차트', 'hp:ole': 'OLE 개체', 'hp:video': '동영상', 'hp:textart': '글맵시', 'hp:container': '묶음 개체', 'hp:line': '선', 'hp:arc': '호', 'hp:polygon': '다각형', 'hp:curve': '곡선', 'hp:connectLine': '연결선',
}

interface Env {
  zip: JSZip
  styles: HwpxStyles
  items: Map<string, string>
  images: Map<string, Promise<string | null>>
  pending: Promise<void>[]
  tabPx: number
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, style: Partial<CSSStyleDeclaration> = {}, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  Object.assign(e.style, style)
  parent?.appendChild(e)
  return e
}

const lineCss = (b: BorderLine | undefined) => (b ? `${b.width}px ${b.style} ${b.color}` : '')

function applyBorderFill(e: HTMLElement, bf: BorderFill | undefined) {
  if (!bf) return
  e.style.borderLeft = lineCss(bf.left)
  e.style.borderRight = lineCss(bf.right)
  e.style.borderTop = lineCss(bf.top)
  e.style.borderBottom = lineCss(bf.bottom)
  if (bf.fill) e.style.background = bf.fill
}

function placeholder(parent: HTMLElement, label: string, w?: number, h?: number) {
  const p = el('span', {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', textIndent: '0',
    width: w ? `${w}px` : 'auto', height: h ? `${h}px` : 'auto', minWidth: '80px', minHeight: '24px', maxWidth: '100%',
    border: '1px dashed #9CA3AF', background: 'rgba(243,244,246,0.8)', color: '#6B7280', fontSize: '12px', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', padding: '2px 6px',
  }, parent)
  p.textContent = `${label}은(는) 미리보기에 표시하지 않습니다`
  p.dataset.hwpxPlaceholder = 'true'
}

async function imageUrl(env: Env, path: string): Promise<string | null> {
  let p = env.images.get(path)
  if (!p) {
    p = (async () => {
      const mime = IMAGE_MIME[path.toLowerCase().split('.').pop() ?? '']
      const file = env.zip.file(path) ?? env.zip.file(`Contents/${path}`)
      if (!mime || !file) return null
      return `data:${mime};base64,${await file.async('base64')}`
    })()
    env.images.set(path, p)
  }
  return p
}

/** 개체 크기(px) — curSz가 있으면 그것(현재 크기), 없으면 sz */
function objectSize(obj: Element): { w: number; h: number } {
  const cur = childOf(obj, 'hp:curSz')
  const sz = childOf(obj, 'hp:sz')
  const pick = (a: string) => Number(cur?.getAttribute(a)) || Number(sz?.getAttribute(a)) || 0
  return { w: hwpToPx(pick('width')), h: hwpToPx(pick('height')) }
}

/** 글자처럼 취급(treatAsChar)이면 줄 안에, 아니면 문단 안 블록(가로 정렬·오프셋) */
function placeObject(obj: Element, parent: HTMLElement): HTMLElement {
  const pos = childOf(obj, 'hp:pos')
  const out = childOf(obj, 'hp:outMargin')
  const m = (a: string) => `${hwpToPx(Number(out?.getAttribute(a)) || 0)}px`
  if (pos?.getAttribute('treatAsChar') === '1') {
    return el('span', { display: 'inline-block', verticalAlign: 'bottom', textIndent: '0', margin: `${m('top')} ${m('right')} ${m('bottom')} ${m('left')}` }, parent)
  }
  const align = pos?.getAttribute('horzAlign') ?? 'LEFT'
  const offset = hwpToPx(Number(pos?.getAttribute('horzOffset')) || 0)
  return el('div', {
    display: 'table',
    textIndent: '0',
    marginTop: m('top'),
    marginBottom: m('bottom'),
    marginLeft: align === 'CENTER' || align === 'RIGHT' ? 'auto' : `${offset}px`,
    marginRight: align === 'CENTER' ? 'auto' : '0',
  }, parent)
}

/* ───────────── 문단·글자 ───────────── */

function runStyle(cs: CharStyle | undefined): Partial<CSSStyleDeclaration> {
  if (!cs) return {}
  return {
    fontSize: `${cs.sup || cs.sub ? cs.size * 0.7 : cs.size}pt`,
    color: cs.color,
    fontWeight: cs.bold ? '700' : '400',
    fontStyle: cs.italic ? 'italic' : 'normal',
    textDecoration: [cs.underline ? 'underline' : '', cs.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
    letterSpacing: cs.spacing ? `${cs.spacing / 100}em` : 'normal',
    verticalAlign: cs.sup ? 'super' : cs.sub ? 'sub' : 'baseline',
    backgroundColor: cs.shade ?? '',
    fontFamily: fontStackOf(cs.hangul, cs.latin),
  }
}

/** hp:t 안의 글자(탭·줄 바꿈·공백 요소 포함) */
function appendText(t: Element, span: HTMLElement) {
  for (const part of Array.from(t.childNodes)) {
    if (part.nodeType === 3) span.appendChild(document.createTextNode(part.nodeValue ?? ''))
    else if (part.nodeType === 1) {
      const name = (part as Element).tagName
      if (name === 'hp:tab') span.appendChild(document.createTextNode('\t'))
      else if (name === 'hp:lineBreak') span.appendChild(document.createElement('br'))
      else if (name === 'hp:nbSpace' || name === 'hp:fwSpace') span.appendChild(document.createTextNode(name === 'hp:fwSpace' ? '　' : ' '))
      else if (name === 'hp:hyphen') span.appendChild(document.createTextNode('-'))
      else if ((part as Element).textContent) span.appendChild(document.createTextNode((part as Element).textContent ?? ''))
    }
  }
}

function renderParagraph(p: Element, parent: HTMLElement, env: Env) {
  const ps = env.styles.paras.get(p.getAttribute('paraPrIDRef') ?? '')
  const runs = elementChildren(p).filter((e) => e.tagName === 'hp:run')
  const firstChar = env.styles.chars.get(runs[0]?.getAttribute('charPrIDRef') ?? '')
  const maxSize = Math.max(...runs.map((r) => env.styles.chars.get(r.getAttribute('charPrIDRef') ?? '')?.size ?? 10), 1)
  const indent = paragraphIndentCss(ps ?? { left: 0, indent: 0 })
  const para = el('div', {
    textAlign: ALIGN_CSS[ps?.align ?? 'JUSTIFY'] ?? 'justify',
    textAlignLast: ps?.align?.startsWith('DISTRIBUTE') ? 'justify' : 'auto',
    paddingLeft: `${indent.paddingLeft}px`,
    paddingRight: `${ps?.right ?? 0}px`,
    textIndent: `${indent.textIndent}px`,
    marginTop: `${ps?.prev ?? 0}px`,
    marginBottom: `${ps?.next ?? 0}px`,
    lineHeight: lineHeightCss(ps?.lineSpacing ?? { type: 'PERCENT', value: 160 }, maxSize),
    whiteSpace: 'pre-wrap',
    wordBreak: ps?.keepWord === false ? 'break-all' : 'keep-all',
    overflowWrap: 'anywhere',
    tabSize: `${env.tabPx}px`,
    fontSize: `${firstChar?.size ?? 10}pt`,
    fontFamily: fontStackOf(firstChar?.hangul, firstChar?.latin),
    color: firstChar?.color ?? '#000000',
  }, parent)
  if (ps?.borderFill) {
    const bf = env.styles.borderFills.get(String(ps.borderFill))
    if (bf && (bf.fill || bf.left || bf.right || bf.top || bf.bottom)) applyBorderFill(para, bf)
  }

  let hasContent = false
  for (const run of runs) {
    const cs = env.styles.chars.get(run.getAttribute('charPrIDRef') ?? '')
    for (const node of elementChildren(run)) {
      const tag = node.tagName
      try {
        if (tag === 'hp:t') {
          if (!node.textContent && !elementChildren(node).length) continue
          const span = el('span', runStyle(cs), para)
          appendText(node, span)
          hasContent = true
        } else if (tag === 'hp:tbl') {
          renderTable(node, placeObject(node, para), env)
          hasContent = true
        } else if (tag === 'hp:pic') {
          renderPicture(node, placeObject(node, para), env)
          hasContent = true
        } else if (tag === 'hp:rect' || tag === 'hp:ellipse') {
          renderShapeBox(node, placeObject(node, para), env, tag === 'hp:ellipse')
          hasContent = true
        } else if (OBJECT_LABEL[tag]) {
          const { w, h } = objectSize(node)
          placeholder(placeObject(node, para), OBJECT_LABEL[tag], w, h)
          hasContent = true
        }
        // hp:secPr·hp:ctrl(머리말·꼬리말·쪽 번호·각주 등)은 쪽 틀에서 따로 처리하거나 그리지 않는다
      } catch (e) {
        console.error('[OCR] 한글 개체 미리보기 실패:', e)
      }
    }
  }
  if (!hasContent) para.appendChild(document.createTextNode(' '))
}

/** 문단 목록(subList 등) */
function renderParagraphs(container: Element | undefined, parent: HTMLElement, env: Env) {
  for (const p of container ? elementChildren(container).filter((e) => e.tagName === 'hp:p') : []) renderParagraph(p, parent, env)
}

/* ───────────── 표·그림·글상자 ───────────── */

interface Cell {
  el: Element
  row: number
  col: number
  rowSpan: number
  colSpan: number
  w: number
  h: number
}

function renderTable(tbl: Element, parent: HTMLElement, env: Env) {
  const colCnt = Number(tbl.getAttribute('colCnt')) || 1
  const inMargin = childOf(tbl, 'hp:inMargin')
  const tableBf = env.styles.borderFills.get(tbl.getAttribute('borderFillIDRef') ?? '')
  const cells: Cell[] = []
  for (const tr of elementChildren(tbl).filter((e) => e.tagName === 'hp:tr')) {
    for (const tc of elementChildren(tr).filter((e) => e.tagName === 'hp:tc')) {
      const addr = childOf(tc, 'hp:cellAddr')
      const span = childOf(tc, 'hp:cellSpan')
      const sz = childOf(tc, 'hp:cellSz')
      cells.push({
        el: tc,
        row: Number(addr?.getAttribute('rowAddr')) || 0,
        col: Number(addr?.getAttribute('colAddr')) || 0,
        rowSpan: Number(span?.getAttribute('rowSpan')) || 1,
        colSpan: Number(span?.getAttribute('colSpan')) || 1,
        w: hwpToPx(Number(sz?.getAttribute('width')) || 0),
        h: hwpToPx(Number(sz?.getAttribute('height')) || 0),
      })
    }
  }
  const { w: tableW } = objectSize(tbl)
  const cols = columnWidths(cells, colCnt, tableW)
  const table = el('table', { borderCollapse: 'collapse', tableLayout: 'fixed', width: `${cols.reduce((a, b) => a + b, 0)}px`, textIndent: '0' }, parent)
  applyBorderFill(table, tableBf && { ...tableBf, fill: undefined })
  const colgroup = el('colgroup', {}, table)
  for (const w of cols) el('col', { width: `${w}px` }, colgroup)
  const rowCount = Math.max(0, ...cells.map((c) => c.row + 1))
  const rows = Array.from({ length: rowCount }, () => el('tr', {}, table))
  for (const c of cells.sort((a, b) => a.row - b.row || a.col - b.col)) {
    const td = el('td', { padding: '0', verticalAlign: 'middle', overflow: 'hidden', height: c.rowSpan === 1 ? `${c.h}px` : '' }, rows[c.row])
    td.colSpan = c.colSpan
    td.rowSpan = c.rowSpan
    applyBorderFill(td, env.styles.borderFills.get(c.el.getAttribute('borderFillIDRef') ?? ''))
    const margin = c.el.getAttribute('hasMargin') === '1' ? childOf(c.el, 'hp:cellMargin') : inMargin
    const mg = (a: string) => `${hwpToPx(Number(margin?.getAttribute(a)) || 0)}px`
    td.style.padding = `${mg('top')} ${mg('right')} ${mg('bottom')} ${mg('left')}`
    const sub = childOf(c.el, 'hp:subList')
    const va = sub?.getAttribute('vertAlign') ?? 'CENTER'
    td.style.verticalAlign = va === 'TOP' ? 'top' : va === 'BOTTOM' ? 'bottom' : 'middle'
    renderParagraphs(sub, td, env)
  }
}

function renderPicture(pic: Element, parent: HTMLElement, env: Env) {
  const { w, h } = objectSize(pic)
  const img = Array.from(pic.getElementsByTagName('hc:img'))[0]
  const ref = img?.getAttribute('binaryItemIDRef') ?? ''
  const path = env.items.get(ref) ?? ''
  const ext = path.toLowerCase().split('.').pop() ?? ''
  if (!path || !IMAGE_MIME[ext]) {
    placeholder(parent, ext ? `그림(${ext.toUpperCase()})` : '그림', w, h)
    return
  }
  const image = el('img', { display: 'block', width: `${w}px`, height: `${h}px`, maxWidth: 'none' }, parent)
  image.alt = ''
  env.pending.push(imageUrl(env, path).then((url) => { if (url) image.src = url; else image.remove() }))
}

/** 사각형·타원(글상자 포함) — 선·채우기 + 안의 글 */
function renderShapeBox(shape: Element, parent: HTMLElement, env: Env, ellipse: boolean) {
  const { w, h } = objectSize(shape)
  const line = childOf(shape, 'hp:lineShape')
  const lineColor = hwpColor(line?.getAttribute('color'))
  const lineStyle = line?.getAttribute('style') ?? 'SOLID'
  const brush = childOf(shape, 'hc:fillBrush')
  const fill = hwpColor(childOf(brush, 'hc:winBrush')?.getAttribute('faceColor'))
  const box = el('div', {
    position: 'relative', width: `${w}px`, height: `${h}px`, boxSizing: 'border-box', overflow: 'hidden',
    border: lineColor && lineStyle !== 'NONE' ? `${Math.max(1, hwpToPx(Number(line?.getAttribute('width')) || 33))}px solid ${lineColor}` : 'none',
    borderRadius: ellipse ? '50%' : '0', background: fill ?? 'transparent',
  }, parent)
  const draw = childOf(shape, 'hp:drawText')
  if (draw) {
    const margin = childOf(draw, 'hp:textMargin')
    const mg = (a: string) => `${hwpToPx(Number(margin?.getAttribute(a)) || 0)}px`
    const sub = childOf(draw, 'hp:subList')
    const va = sub?.getAttribute('vertAlign') ?? 'TOP'
    const inner = el('div', {
      position: 'absolute', inset: '0', padding: `${mg('top')} ${mg('right')} ${mg('bottom')} ${mg('left')}`, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', justifyContent: va === 'CENTER' ? 'center' : va === 'BOTTOM' ? 'flex-end' : 'flex-start',
    }, box)
    renderParagraphs(sub, inner, env)
  }
}

/* ───────────── 쪽 ───────────── */

interface PageFrame {
  width: number
  height: number
  margin: { left: number; right: number; top: number; bottom: number; header: number; footer: number }
  columns: number
  columnGap: number
  header?: Element
  footer?: Element
  pageNum?: { pos: string; formatType: string; sideChar: string }
  startPage: number
}

function readFrame(doc: Document): PageFrame {
  const pagePr = doc.getElementsByTagName('hp:pagePr')[0]
  const margin = childOf(pagePr, 'hp:margin')
  const mg = (a: string, d: number) => hwpToPx(Number(margin?.getAttribute(a) ?? d))
  let width = hwpToPx(Number(pagePr?.getAttribute('width')) || 59528)
  let height = hwpToPx(Number(pagePr?.getAttribute('height')) || 84188)
  // 가로 용지(NARROWLY)인데 크기가 세로로 저장된 경우
  if (pagePr?.getAttribute('landscape') === 'NARROWLY' && width < height) [width, height] = [height, width]
  const colPr = doc.getElementsByTagName('hp:colPr')[0]
  const both = (tag: string) => Array.from(doc.getElementsByTagName(tag)).find((e) => (e.getAttribute('applyPageType') ?? 'BOTH') !== 'EVEN')
  const pageNum = doc.getElementsByTagName('hp:pageNum')[0]
  return {
    width,
    height,
    margin: { left: mg('left', 8504), right: mg('right', 8504), top: mg('top', 5668), bottom: mg('bottom', 4252), header: mg('header', 4252), footer: mg('footer', 4252) },
    columns: Math.max(1, Number(colPr?.getAttribute('colCount')) || 1),
    columnGap: hwpToPx(Number(colPr?.getAttribute('sameGap')) || 0),
    header: both('hp:header'),
    footer: both('hp:footer'),
    pageNum: pageNum ? { pos: pageNum.getAttribute('pos') ?? 'BOTTOM_CENTER', formatType: pageNum.getAttribute('formatType') ?? 'DIGIT', sideChar: pageNum.getAttribute('sideChar') ?? '' } : undefined,
    startPage: Number(doc.getElementsByTagName('hp:startNum')[0]?.getAttribute('page')) || 0,
  }
}

function renderPage(frame: PageFrame, pageNo: number, root: HTMLElement, env: Env): HTMLElement {
  const { margin } = frame
  const page = el('div', {
    position: 'relative', width: `${frame.width}px`, minHeight: `${frame.height}px`, boxSizing: 'border-box', background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', flex: 'none',
    padding: `${margin.top + margin.header}px ${margin.right}px ${margin.bottom + margin.footer}px ${margin.left}px`, color: '#000000',
  }, root)
  page.dataset.testid = 'hwpx-page'
  const band = (top: boolean, content?: Element) => {
    const box = el('div', { position: 'absolute', left: `${margin.left}px`, right: `${margin.right}px`, height: `${top ? margin.header : margin.footer}px`, overflow: 'hidden', [top ? 'top' : 'bottom']: `${top ? margin.top : margin.bottom}px` }, page)
    if (content) renderParagraphs(childOf(content, 'hp:subList'), box, env)
    return box
  }
  if (frame.header) band(true, frame.header)
  if (frame.footer) band(false, frame.footer)
  if (frame.pageNum && !frame.pageNum.pos.startsWith('NONE')) {
    const top = frame.pageNum.pos.startsWith('TOP')
    const align = frame.pageNum.pos.endsWith('LEFT') ? 'left' : frame.pageNum.pos.endsWith('RIGHT') ? 'right' : 'center'
    const num = el('div', {
      position: 'absolute', left: `${margin.left}px`, right: `${margin.right}px`, textAlign: align, fontSize: '10pt', fontFamily: fontStackOf(undefined, undefined),
      [top ? 'top' : 'bottom']: `${top ? margin.top : margin.bottom}px`,
    }, page)
    num.textContent = pageNumberText(pageNo, frame.pageNum.formatType, frame.pageNum.sideChar)
  }
  const body = el('div', frame.columns > 1 ? { columnCount: String(frame.columns), columnGap: `${frame.columnGap}px` } : {}, page)
  return body
}

export async function renderHwpxPreview(data: ArrayBuffer, body: HTMLElement): Promise<void> {
  const zip = await JSZip.loadAsync(data)
  const headerFile = zip.file('Contents/header.xml')
  if (!headerFile) throw new Error('header.xml 없음')
  const styles = readHwpxStyles(await headerFile.async('string'))
  const { sections, items } = await readHwpxManifest(zip)
  const env: Env = { zip, styles, items, images: new Map(), pending: [], tabPx: hwpToPx(8000) }

  const root = el('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '24px', width: 'max-content', minWidth: '100%', boxSizing: 'border-box' })
  root.dataset.testid = 'hwpx-preview'
  const notice = el('p', { display: 'none', margin: '0', padding: '8px 14px', fontSize: '14px', color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '4px', fontFamily: 'system-ui, sans-serif' }, root)
  notice.dataset.testid = 'hwpx-truncated'

  let pageNo = 0
  let drawn = 0
  let truncated = false
  for (const path of sections) {
    const file = zip.file(path)
    if (!file) continue
    const doc = parseXml(await file.async('string'))
    const frame = readFrame(doc)
    env.tabPx = hwpToPx(Number(doc.getElementsByTagName('hp:secPr')[0]?.getAttribute('tabStop')) || 8000)
    if (frame.startPage > 0) pageNo = frame.startPage - 1
    const paras = elementChildren(doc.documentElement).filter((e) => e.tagName === 'hp:p')
    const layouts = paras.map((p) => {
      const segs = Array.from(childOf(p, 'hp:linesegarray')?.children ?? []).map((s) => Number(s.getAttribute('vertpos')))
      return { firstVert: segs.length ? segs[0] : null, lastVert: segs.length ? segs[segs.length - 1] : null, pageBreak: p.getAttribute('pageBreak') === '1' }
    })
    for (const indexes of splitPages(layouts)) {
      pageNo++
      if (drawn >= PREVIEW_MAX_PAGES) {
        truncated = true
        continue
      }
      const pageBody = renderPage(frame, pageNo, root, env)
      for (const i of indexes) {
        try {
          renderParagraph(paras[i], pageBody, env)
        } catch (e) {
          console.error('[OCR] 한글 문단 미리보기 실패:', e)
        }
      }
      drawn++
    }
  }
  if (truncated) {
    notice.style.display = 'block'
    notice.textContent = `미리보기는 앞 ${PREVIEW_MAX_PAGES}쪽까지만 표시합니다. 추출은 전체 내용으로 합니다.`
  }
  if (drawn === 0) el('p', { fontSize: '14px', color: '#6B7280' }, root).textContent = '표시할 내용이 없습니다.'
  await Promise.all(env.pending)
  sanitizePreview(root)
  body.appendChild(root)
}
