/**
 * Excel 화면 미리보기(P4-R2) — 시트 모델(`xlsx-sheet.ts`)을 칸 위치 그대로 그린다(직접 구현, 브라우저 전용).
 * - 열 머리글(A·B·C)·행 번호·눈금선(시트에서 끈 경우 숨김), 셀 색·글꼴·테두리·병합·열 너비·행 높이, 자주 쓰는 숫자 표시 서식
 * - 아래 시트 탭으로 한 번에 한 시트(숨긴 시트는 「(숨김)」), 시트는 탭을 처음 열 때 읽는다
 * - 시트마다 500행 × 100열까지(넘으면 안내)
 * 그리기: 눈금선 → 행·열 전체 채우기 → 칸 채우기(병합은 안쪽 눈금선 가림) → 테두리 → 글자. 글자는 textContent로만 넣고, 그린 뒤 `sanitizePreview`로 정리한다.
 */
import JSZip from 'jszip'
import { parseXml, readRels, readSharedStrings, readText } from './office'
import { notifyPreviewResize } from './preview-resize'
import { sanitizePreview } from './sanitize-preview'
import {
  PREVIEW_MAX_COLS,
  PREVIEW_MAX_ROWS,
  cellKey,
  columnName,
  effectiveHorizontal,
  maxDigitWidth,
  readSheetModel,
  readThemeColors,
  readWorkbookStyles,
  textArea,
  type BorderEdge,
  type BorderSide,
  type CellBorder,
  type CellRange,
  type SheetCell,
  type SheetModel,
  type WorkbookStyles,
} from './xlsx-sheet'

const HEADER_HEIGHT = 20
const GRID_COLOR = '#E1E1E1'
const HEADER_BG = '#F3F3F3'
const HEADER_LINE = '#C8C8C8'

type SheetEntry = { name: string; hidden: boolean; path: string | null; chart: boolean }

/** 테두리 종류 → CSS(굵기·모양) */
const BORDER_CSS: Record<string, string> = {
  thin: '1px solid',
  hair: '1px dotted',
  dotted: '1px dotted',
  dashed: '1px dashed',
  dashDot: '1px dashed',
  dashDotDot: '1px dashed',
  medium: '2px solid',
  mediumDashed: '2px dashed',
  mediumDashDot: '2px dashed',
  mediumDashDotDot: '2px dashed',
  slantDashDot: '2px dashed',
  thick: '3px solid',
  double: '3px double',
}

const VERTICAL: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end', justify: 'center', distributed: 'center' }
const HORIZONTAL: Record<string, string> = { left: 'left', center: 'center', right: 'right', fill: 'left', justify: 'justify', centerContinuous: 'center', distributed: 'justify' }

function box(parent: HTMLElement, x: number, y: number, w: number, h: number, style: Partial<CSSStyleDeclaration> = {}): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, { position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }, style)
  parent.appendChild(el)
  return el
}

/** 글꼴 이름 — CSS에 넣을 수 없는 글자는 뺀다 */
const fontStack = (name: string) => `"${name.replace(/["\\;{}<>]/g, '')}", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`

function drawSheet(model: SheetModel, styles: WorkbookStyles): HTMLElement {
  const width = model.colX[model.cols]
  const height = model.rowY[model.rows]
  const headerW = model.showHeaders ? Math.max(32, String(model.rows).length * 8 + 14) : 0
  const headerH = model.showHeaders ? HEADER_HEIGHT : 0

  const grid = document.createElement('div')
  grid.dataset.testid = 'xlsx-grid'
  Object.assign(grid.style, {
    display: 'grid',
    gridTemplateColumns: `${headerW}px ${width}px`,
    gridTemplateRows: `${headerH}px ${height}px`,
    width: `${headerW + width}px`,
  })

  // 머리글 — 위쪽·왼쪽에 붙어 있도록(sticky)
  const corner = document.createElement('div')
  const colHead = document.createElement('div')
  const rowHead = document.createElement('div')
  const cellsLayer = document.createElement('div')
  if (model.showHeaders) {
    Object.assign(corner.style, { position: 'sticky', top: '0', left: '0', zIndex: '3', background: HEADER_BG, borderRight: `1px solid ${HEADER_LINE}`, borderBottom: `1px solid ${HEADER_LINE}`, boxSizing: 'border-box' })
    Object.assign(colHead.style, { position: 'sticky', top: '0', zIndex: '2', background: HEADER_BG, overflow: 'hidden' })
    Object.assign(rowHead.style, { position: 'sticky', left: '0', zIndex: '2', background: HEADER_BG, overflow: 'hidden' })
    for (const el of [corner, colHead, rowHead]) el.setAttribute('aria-hidden', 'true')
    const label = { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#555', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }
    for (let c = 0; c < model.cols; c++) {
      const w = model.colX[c + 1] - model.colX[c]
      if (w <= 0) continue
      box(colHead, model.colX[c], 0, w, headerH, { ...label, borderRight: `1px solid ${HEADER_LINE}`, borderBottom: `1px solid ${HEADER_LINE}` }).textContent = columnName(c)
    }
    for (let r = 0; r < model.rows; r++) {
      const h = model.rowY[r + 1] - model.rowY[r]
      if (h <= 0) continue
      box(rowHead, 0, model.rowY[r], headerW, h, { ...label, borderRight: `1px solid ${HEADER_LINE}`, borderBottom: `1px solid ${HEADER_LINE}` }).textContent = String(r + 1)
    }
  }
  Object.assign(cellsLayer.style, { position: 'relative', overflow: 'hidden', background: '#FFFFFF' })
  grid.append(corner, colHead, rowHead, cellsLayer)

  // 1) 눈금선(각 칸의 오른쪽·아래 1px)
  if (model.showGrid) {
    for (let c = 1; c <= model.cols; c++) if (model.colX[c] !== model.colX[c - 1]) box(cellsLayer, model.colX[c] - 1, 0, 1, height, { background: GRID_COLOR })
    for (let r = 1; r <= model.rows; r++) if (model.rowY[r] !== model.rowY[r - 1]) box(cellsLayer, 0, model.rowY[r] - 1, width, 1, { background: GRID_COLOR })
  }

  const xfOf = (style: number) => styles.xfs[style] ?? styles.xfs[0]
  const fillRect = (x1: number, y1: number, x2: number, y2: number, color: string) =>
    box(cellsLayer, Math.max(0, x1 - 1), Math.max(0, y1 - 1), x2 - Math.max(0, x1 - 1), y2 - Math.max(0, y1 - 1), { background: color })

  // 2) 행·열 전체 채우기(칸 요소가 없는 자리)
  for (const [c, s] of model.colStyles) {
    const fill = xfOf(s).fill
    if (fill && c < model.cols) fillRect(model.colX[c], 0, model.colX[c + 1], height, fill)
  }
  for (const [r, s] of model.rowStyles) {
    const fill = xfOf(s).fill
    if (fill && r < model.rows) fillRect(0, model.rowY[r], width, model.rowY[r + 1], fill)
  }

  const rectOf = (r1: number, c1: number, r2: number, c2: number) => ({ x1: model.colX[c1], y1: model.rowY[r1], x2: model.colX[c2 + 1], y2: model.rowY[r2 + 1] })
  const cellAt = (r: number, c: number) => model.cells.get(cellKey(r, c))
  const sortedCells = Array.from(model.cells.values()).sort((a, b) => a.r - b.r || a.c - b.c)

  // 3) 칸 채우기 — 병합은 영역 전체(채우기가 없으면 흰색으로 안쪽 눈금선만 가림)
  for (const m of model.merges) {
    const { x1, y1, x2, y2 } = rectOf(m.r1, m.c1, m.r2, m.c2)
    const fill = xfOf(cellAt(m.r1, m.c1)?.style ?? 0).fill
    if (fill) fillRect(x1, y1, x2, y2, fill)
    else if (x2 - x1 > 1 && y2 - y1 > 1) box(cellsLayer, x1, y1, x2 - x1 - 1, y2 - y1 - 1, { background: '#FFFFFF' })
  }
  for (const cell of sortedCells) {
    if (model.mergeAt.has(cellKey(cell.r, cell.c))) continue
    const fill = xfOf(cell.style).fill
    if (!fill) continue
    const { x1, y1, x2, y2 } = rectOf(cell.r, cell.c, cell.r, cell.c)
    if (x2 > x1 && y2 > y1) fillRect(x1, y1, x2, y2, fill)
  }

  // 4) 테두리 — 칸 경계(눈금선 자리)에 겹쳐 그린다. 병합은 바깥 테두리만
  const drawBorder = (range: CellRange, sides: CellBorder) => {
    if (!sides.left && !sides.right && !sides.top && !sides.bottom) return
    const { x1, y1, x2, y2 } = rectOf(range.r1, range.c1, range.r2, range.c2)
    if (x2 <= x1 || y2 <= y1) return
    const el = box(cellsLayer, Math.max(0, x1 - 1), Math.max(0, y1 - 1), x2 - Math.max(0, x1 - 1), y2 - Math.max(0, y1 - 1), { boxSizing: 'border-box', pointerEvents: 'none' })
    const css = (side: BorderSide) => `${BORDER_CSS[side.style] ?? '1px solid'} ${side.color}`
    const prop: Record<BorderEdge, 'borderLeft' | 'borderRight' | 'borderTop' | 'borderBottom'> = { left: 'borderLeft', right: 'borderRight', top: 'borderTop', bottom: 'borderBottom' }
    for (const edge of ['left', 'right', 'top', 'bottom'] as BorderEdge[]) {
      const side = sides[edge]
      if (side) el.style[prop[edge]] = css(side)
    }
  }
  const bordersOf = (cell: SheetCell | undefined): CellBorder => (cell ? (styles.borders[xfOf(cell.style).border] ?? {}) : {})
  for (const m of model.merges) {
    const tl = bordersOf(cellAt(m.r1, m.c1))
    drawBorder(m, {
      left: tl.left,
      top: tl.top,
      right: bordersOf(cellAt(m.r1, m.c2)).right ?? tl.right,
      bottom: bordersOf(cellAt(m.r2, m.c1)).bottom ?? tl.bottom,
    })
  }
  for (const cell of sortedCells) {
    if (model.mergeAt.has(cellKey(cell.r, cell.c))) continue
    drawBorder({ r1: cell.r, c1: cell.c, r2: cell.r, c2: cell.c }, bordersOf(cell))
  }

  // 5) 글자
  for (const cell of sortedCells) {
    if (cell.text === '') continue
    const merge = model.mergeAt.get(cellKey(cell.r, cell.c))
    if (merge && (merge.r1 !== cell.r || merge.c1 !== cell.c)) continue // 병합 영역은 왼쪽 위 칸 글자만
    const xf = xfOf(cell.style)
    const font = styles.fonts[xf.font] ?? styles.fonts[0]
    const area = merge ? { x: model.colX[merge.c1], width: model.colX[merge.c2 + 1] - model.colX[merge.c1] } : textArea(model, cell, xf)
    const y = model.rowY[merge?.r1 ?? cell.r]
    const h = model.rowY[(merge?.r2 ?? cell.r) + 1] - y
    if (area.width <= 1 || h <= 1) continue
    const align = effectiveHorizontal(cell, xf)
    const outer = box(cellsLayer, area.x, y, area.width - 1, h - 1, {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: VERTICAL[xf.vertical] ?? 'flex-end',
      overflow: 'hidden',
      padding: '0 2px',
      boxSizing: 'border-box',
      fontFamily: fontStack(font.name),
      fontSize: `${font.size}pt`,
      fontWeight: font.bold ? '700' : '400',
      fontStyle: font.italic ? 'italic' : 'normal',
      textDecoration: [font.underline ? `underline${font.underline === 'double' ? ' double' : ''}` : '', font.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
      color: cell.color ?? font.color ?? '#000000',
      lineHeight: '1.2',
    })
    outer.dataset.cell = `${columnName(cell.c)}${cell.r + 1}`
    const inner = document.createElement('div')
    Object.assign(inner.style, {
      textAlign: HORIZONTAL[align] ?? 'left',
      whiteSpace: xf.wrap ? 'pre-wrap' : 'pre',
      overflowWrap: xf.wrap ? 'anywhere' : 'normal',
      overflow: 'hidden',
    })
    if (xf.indent) inner.style[align === 'right' ? 'paddingRight' : 'paddingLeft'] = `${xf.indent * 9}px`
    if (cell.split) {
      // 회계 서식(채움 *) — 정렬과 관계없이 통화 기호는 왼쪽 끝, 숫자는 오른쪽 끝
      Object.assign(inner.style, { display: 'flex', justifyContent: 'space-between', gap: '4px' })
      const left = document.createElement('span')
      const right = document.createElement('span')
      left.textContent = cell.split[0]
      right.textContent = cell.split[1]
      inner.append(left, right)
    } else inner.textContent = cell.text
    outer.appendChild(inner)
  }

  return grid
}

function message(text: string): HTMLElement {
  const p = document.createElement('p')
  Object.assign(p.style, { padding: '40px 24px', textAlign: 'center', fontSize: '14px', color: '#6B7280', fontFamily: 'system-ui, sans-serif' })
  p.textContent = text
  return p
}

function truncationNotice(model: SheetModel): HTMLElement | null {
  const { rows, cols } = model.truncated
  if (!rows && !cols) return null
  const what = rows && cols ? `${PREVIEW_MAX_ROWS}행·${PREVIEW_MAX_COLS}열` : rows ? `${PREVIEW_MAX_ROWS}행` : `${PREVIEW_MAX_COLS}열`
  const p = document.createElement('p')
  p.dataset.testid = 'xlsx-truncated'
  Object.assign(p.style, { position: 'sticky', left: '0', margin: '0', padding: '6px 12px', fontSize: '12px', color: '#92400E', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', fontFamily: 'system-ui, sans-serif', width: 'max-content' })
  p.textContent = `미리보기는 앞부분 ${what}까지만 표시합니다. 추출은 전체 내용으로 합니다.`
  return p
}

export async function renderXlsxPreview(data: ArrayBuffer, body: HTMLElement): Promise<void> {
  const zip = await JSZip.loadAsync(data)
  const workbook = parseXml(await readText(zip, 'xl/workbook.xml'))
  const rels = readRels(await readText(zip, 'xl/_rels/workbook.xml.rels'), 'xl')
  const shared = zip.file('xl/sharedStrings.xml') ? readSharedStrings(await readText(zip, 'xl/sharedStrings.xml')) : []
  const themePath = Object.keys(zip.files).find((p) => /^xl\/theme\/theme\d*\.xml$/.test(p))
  const theme = readThemeColors(themePath ? await readText(zip, themePath) : null)
  const styles = readWorkbookStyles(zip.file('xl/styles.xml') ? await readText(zip, 'xl/styles.xml') : null, theme)
  const pr = workbook.getElementsByTagName('workbookPr')[0]
  const date1904 = pr?.getAttribute('date1904') === '1' || pr?.getAttribute('date1904') === 'true'
  const mdw = maxDigitWidth(styles.fonts[styles.xfs[0]?.font ?? 0] ?? styles.fonts[0])

  const sheets: SheetEntry[] = Array.from(workbook.getElementsByTagName('sheet')).map((s) => {
    const path = rels.get(s.getAttribute('r:id') ?? '') ?? null
    const state = s.getAttribute('state')
    return { name: s.getAttribute('name') ?? '', hidden: state === 'hidden' || state === 'veryHidden', path: path && zip.file(path) ? path : null, chart: !!path && path.includes('chartsheets/') }
  })
  if (sheets.length === 0) throw new Error('시트가 없습니다.')

  const root = document.createElement('div')
  root.dataset.testid = 'xlsx-preview'
  Object.assign(root.style, { width: 'max-content', minWidth: '100%', background: '#FFFFFF', color: '#000000' })
  const panel = document.createElement('div')
  panel.setAttribute('role', 'tabpanel')
  panel.dataset.testid = 'xlsx-panel'
  panel.style.minHeight = '120px'

  // 시트 탭 — 아래쪽에 붙어 있도록(sticky), 가로로 스크롤해도 탭은 왼쪽에 남는다
  const bar = document.createElement('div')
  Object.assign(bar.style, { position: 'sticky', bottom: '0', zIndex: '4', background: HEADER_BG, borderTop: `1px solid ${HEADER_LINE}` })
  const tabList = document.createElement('div')
  tabList.setAttribute('role', 'tablist')
  tabList.setAttribute('aria-label', '시트')
  Object.assign(tabList.style, { position: 'sticky', left: '0', display: 'inline-flex', maxWidth: '100vw', overflowX: 'auto', fontFamily: 'system-ui, sans-serif' })
  bar.appendChild(tabList)

  const models = new Map<number, SheetModel>()
  const tabs = sheets.map((sheet, i) => {
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.setAttribute('role', 'tab')
    tab.dataset.testid = 'xlsx-sheet-tab'
    tab.id = `xlsx-tab-${i}`
    tab.textContent = sheet.hidden ? `${sheet.name} (숨김)` : sheet.name
    // 터치 기기는 탭을 크게(미리보기가 최대 75%로 줄어도 44px 이상)
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
    Object.assign(tab.style, { padding: coarse ? '22px 18px' : '6px 14px', fontSize: coarse ? '15px' : '12px', whiteSpace: 'nowrap', border: 'none', borderRight: `1px solid ${HEADER_LINE}`, cursor: 'pointer', fontStyle: sheet.hidden ? 'italic' : 'normal' })
    tabList.appendChild(tab)
    return tab
  })

  let active = -1
  let token = 0
  const activate = async (index: number, focus = false) => {
    if (index === active) return
    active = index
    const my = ++token
    tabs.forEach((tab, i) => {
      const selected = i === index
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      Object.assign(tab.style, {
        background: selected ? '#FFFFFF' : 'transparent',
        color: selected ? '#166534' : sheets[i].hidden ? '#4B5563' : '#374151', // 숨김 탭 회색도 대비 4.5:1 이상
        fontWeight: selected ? '600' : '400',
        boxShadow: selected ? 'inset 0 -2px 0 #16A34A' : 'none',
      })
    })
    if (focus) tabs[index].focus()
    panel.setAttribute('aria-labelledby', tabs[index].id)
    const sheet = sheets[index]
    let content: HTMLElement[]
    try {
      if (sheet.chart) content = [message('차트 시트는 미리보기를 표시하지 않습니다.')]
      else if (!sheet.path) content = [message('이 시트는 미리보기를 표시할 수 없습니다.')]
      else {
        let model = models.get(index)
        if (!model) {
          model = readSheetModel(await readText(zip, sheet.path), { shared, styles, date1904, mdw })
          models.set(index, model)
        }
        if (my !== token) return
        const notice = truncationNotice(model)
        content = model.rows === 0 || model.cols === 0 ? [message('이 시트에는 내용이 없습니다.')] : [...(notice ? [notice] : []), drawSheet(model, styles)]
      }
    } catch (e) {
      console.error('[OCR] 시트 미리보기 실패:', e)
      content = [message('이 시트는 미리보기를 표시할 수 없습니다.')]
    }
    if (my !== token) return
    panel.replaceChildren(...content)
    sanitizePreview(panel)
    notifyPreviewResize(root, { resetScroll: true })
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => void activate(i))
    tab.addEventListener('keydown', (e) => {
      const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null
      if (next === null) return
      e.preventDefault()
      void activate((next + tabs.length) % tabs.length, true)
    })
  })

  // 처음 보일 시트 — 문서에 저장된 활성 시트(숨긴 시트면 첫 번째 보이는 시트)
  const saved = Number(workbook.getElementsByTagName('workbookView')[0]?.getAttribute('activeTab') ?? 0)
  const first = sheets[saved] && !sheets[saved].hidden ? saved : Math.max(0, sheets.findIndex((s) => !s.hidden))
  await activate(first)

  root.append(panel, bar)
  body.appendChild(root)
}
