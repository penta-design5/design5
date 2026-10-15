/**
 * 오피스 문서(DOCX·PPTX·XLSX·HWPX) 텍스트 추출 — ZIP 안의 XML을 읽는다(OCR 불필요, 브라우저 처리).
 * DOCX·PPTX·HWPX는 「문단 → 글자」 구조가 같아서 태그 이름만 바꾼 공통 탐색기(`readBlocks`)로 읽고, XLSX는 셀 표로 읽는다.
 * 표는 칸을 **탭**으로 구분한다(엑셀 등에 붙여 넣으면 칸이 살아난다). 구형 바이너리(DOC·PPT·XLS·HWP)는 지원하지 않는다.
 */
import JSZip from 'jszip'
import { buildOmissions, type Omission, type OmissionStats } from './omissions'

export type OfficeFormat = 'docx' | 'pptx' | 'xlsx' | 'hwpx'

/** 오피스 문서 크기 상한(PDF와 같음) */
export const OFFICE_MAX_BYTES = 50 * 1024 * 1024

const FORMAT_LABEL: Record<OfficeFormat, string> = { docx: 'Word', pptx: 'PowerPoint', xlsx: 'Excel', hwpx: '한글' }
export const officeFormatLabel = (format: OfficeFormat) => FORMAT_LABEL[format]

/** 지원하는 오피스 확장자 → `<input accept>`에 쓴다 */
export const OFFICE_ACCEPT = [
  '.docx',
  '.pptx',
  '.xlsx',
  '.hwpx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',')

const extOf = (name: string) => name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? ''

export function officeFormatOf(file: { name: string }): OfficeFormat | null {
  const ext = extOf(file.name)
  return ext === 'docx' || ext === 'pptx' || ext === 'xlsx' || ext === 'hwpx' ? ext : null
}

/** 구형 바이너리 형식이면 안내 문구(아니면 null) */
export function legacyOfficeMessage(file: { name: string }): string | null {
  const ext = extOf(file.name)
  const map: Record<string, string> = { doc: 'DOCX', ppt: 'PPTX', xls: 'XLSX', hwp: 'HWPX' }
  if (!map[ext]) return null
  return `이전 형식(.${ext})은 지원하지 않습니다. ${map[ext]} 형식으로 다시 저장한 뒤 열어 주세요.`
}

export function validateOfficeFile(file: { size: number }): string | null {
  if (file.size > OFFICE_MAX_BYTES) return `파일이 너무 큽니다. ${OFFICE_MAX_BYTES / 1024 / 1024}MB 이하 파일을 사용해 주세요.`
  if (file.size === 0) return '빈 파일입니다.'
  return null
}

export class OfficeLoadError extends Error {}

/* ───────────── 공통 XML 탐색 ───────────── */

interface Grammar {
  /** 문단 */
  p: string
  /** 글자(text 노드를 읽는다) */
  t: string
  /** 탭·줄바꿈 요소 */
  tab: string[]
  br: string[]
  /** 표·행·칸 */
  tbl: string
  tr: string
  tc: string
  /** 읽지 않는 요소(서식·삭제된 글자·대체 콘텐츠·머리말 등) */
  skip: string[]
}

/** 요소 이름은 접두어 포함(`w:p`) — 문서마다 접두어가 같다고 보고 tagName으로 비교한다 */
const GRAMMARS: Record<'docx' | 'pptx' | 'hwpx', Grammar> = {
  docx: {
    p: 'w:p',
    t: 'w:t',
    tab: ['w:tab'],
    br: ['w:br', 'w:cr'],
    tbl: 'w:tbl',
    tr: 'w:tr',
    tc: 'w:tc',
    skip: ['w:pPr', 'w:rPr', 'w:del', 'w:instrText', 'w:delText', 'mc:Fallback', 'w:tblPr', 'w:tblGrid', 'w:trPr', 'w:tcPr', 'w:sectPr'],
  },
  pptx: {
    p: 'a:p',
    t: 'a:t',
    tab: [],
    br: ['a:br'],
    tbl: 'a:tbl',
    tr: 'a:tr',
    tc: 'a:tc',
    skip: ['a:pPr', 'a:rPr', 'a:endParaRPr', 'mc:Fallback', 'a:tblPr', 'a:tblGrid', 'a:tcPr'],
  },
  hwpx: {
    p: 'hp:p',
    t: 'hp:t',
    tab: ['hp:tab'],
    br: ['hp:lineBreak'],
    tbl: 'hp:tbl',
    tr: 'hp:tr',
    tc: 'hp:tc',
    // 구역 설정·머리말·꼬리말·각주·미주·줄 배치 정보는 본문이 아니다
    skip: ['hp:secPr', 'hp:header', 'hp:footer', 'hp:footNote', 'hp:endNote', 'hp:linesegarray', 'hp:ctrl'],
  },
}

/** 문단 또는 표(행 → 칸) */
export type Block = { kind: 'para'; text: string } | { kind: 'table'; rows: string[][] }

export const elementChildren = (node: Node) => Array.from(node.childNodes).filter((n): n is Element => n.nodeType === 1)

/** 문단 하나의 글자 — 문단 안에 든 표·텍스트 상자의 문단은 `nested`로 모아 문단 뒤에 따로 읽는다 */
function readParagraph(p: Element, g: Grammar, nested: Element[]): string {
  let out = ''
  const visit = (node: Element) => {
    for (const child of elementChildren(node)) {
      const tag = child.tagName
      if (g.skip.includes(tag)) continue
      if (tag === g.tbl || tag === g.p) {
        nested.push(child)
        continue
      }
      if (tag === g.t) {
        // 글자 안에 탭·줄바꿈 요소가 섞일 수 있다(HWPX)
        for (const part of Array.from(child.childNodes)) {
          if (part.nodeType === 3) out += part.nodeValue ?? ''
          else if (part.nodeType === 1) {
            const name = (part as Element).tagName
            if (g.tab.includes(name)) out += '\t'
            else if (g.br.includes(name)) out += '\n'
          }
        }
        continue
      }
      if (g.tab.includes(tag)) out += '\t'
      else if (g.br.includes(tag)) out += '\n'
      else visit(child)
    }
  }
  visit(p)
  return out
}

/** 이 표에 직접 속한 행·칸만(칸 안 중첩 표의 행은 제외) */
const ownChildren = (root: Element, tag: string, stop: string) => {
  const found: Element[] = []
  const visit = (node: Element) => {
    for (const child of elementChildren(node)) {
      if (child.tagName === tag) found.push(child)
      else if (child.tagName !== stop) visit(child)
    }
  }
  visit(root)
  return found
}

function readTable(tbl: Element, g: Grammar): Block {
  const rows = ownChildren(tbl, g.tr, g.tbl).map((tr) =>
    ownChildren(tr, g.tc, g.tbl)
      .map((tc) =>
        readContainer(tc, g)
          .flatMap((b) => (b.kind === 'para' ? [b.text] : b.rows.map((r) => r.join(' '))))
          .join(' ')
          .replace(/[\t\n]+/g, ' ')
          .trim()
      )
  )
  // 모든 칸이 빈 행(양식의 빈 줄)은 뺀다
  return { kind: 'table', rows: rows.filter((row) => row.some((cell) => cell !== '')) }
}

/** 요소 안의 문단·표를 문서 순서대로 */
function readContainer(root: Element, g: Grammar): Block[] {
  return readElements(elementChildren(root), g)
}

function readElements(elements: Element[], g: Grammar): Block[] {
  const blocks: Block[] = []
  for (const el of elements) {
    const tag = el.tagName
    if (g.skip.includes(tag)) continue
    if (tag === g.tbl) blocks.push(readTable(el, g))
    else if (tag === g.p) {
      // 문단 안의 표·텍스트 상자 문단은 문단 뒤에 이어서 읽는다
      const nested: Element[] = []
      blocks.push({ kind: 'para', text: readParagraph(el, g, nested) })
      blocks.push(...readElements(nested, g))
    } else blocks.push(...readContainer(el, g))
  }
  return blocks
}

/** 블록 → 텍스트. 연속된 빈 줄은 하나로, 앞뒤 빈 줄은 없앤다 */
export function blocksToText(blocks: Block[]): string {
  const lines = blocks.flatMap((b) => (b.kind === 'para' ? [b.text.replace(/\s+$/g, '')] : b.rows.map((r) => r.join('\t'))))
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '')
}

export function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) throw new OfficeLoadError('문서 내용을 읽지 못했습니다. 파일이 손상되었을 수 있습니다.')
  return doc
}

/** XML 문자열 → 텍스트(DOCX 본문·PPTX 슬라이드·HWPX 구역 공용) */
export function extractXmlText(xml: string, format: 'docx' | 'pptx' | 'hwpx'): string {
  return blocksToText(readContainer(parseXml(xml).documentElement, GRAMMARS[format]))
}

/* ───────────── XLSX ───────────── */

/** 열 문자 → 0부터 번호(A → 0, AB → 27) */
export function columnIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/i)?.[0].toUpperCase() ?? 'A'
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** 기본 날짜 서식 번호(14~22, 45~47) + 사용자 서식 중 날짜·시간 기호가 있는 것 */
export function isDateFormat(numFmtId: number, formatCode?: string): boolean {
  if ((numFmtId >= 14 && numFmtId <= 22) || (numFmtId >= 45 && numFmtId <= 47)) return true
  if (!formatCode) return false
  const code = formatCode.replace(/"[^"]*"|\[[^\]]*\]|\\./g, '') // 따옴표 글자·색·조건·이스케이프 제외
  return /[ymdhs]/i.test(code) && !/^[#0,.%\s]*$/.test(code)
}

/** 엑셀 날짜 일련번호 → `YYYY-MM-DD`(시간이 있으면 ` HH:mm`). 1900 날짜 체계 기준 */
export function excelSerialToDate(serial: number): string {
  const ms = Math.round((serial - 25569) * 86400 * 1000) // 1970-01-01 = 25569
  const d = new Date(ms)
  const pad = (v: number) => String(v).padStart(2, '0')
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  const hasTime = Math.abs(serial - Math.floor(serial)) > 1e-9
  return hasTime ? `${date} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : date
}

/** 숫자 문자열 정리 — 부동소수 찌꺼기(0.30000000000000004) 제거 */
export function formatNumber(raw: string): string {
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw
  return String(Number(n.toPrecision(15)))
}

interface SheetContext {
  shared: string[]
  /** 셀 서식 번호(s) → 날짜 서식인가 */
  dateStyles: boolean[]
  /** 셀 서식 번호(s) → 표시 서식(쉼표·통화 등)이 있는 숫자 서식인가 — 「추출되지 않은 내용」 안내용 */
  formattedStyles?: boolean[]
  /** 표시 서식이 있는 숫자 칸 수를 센다 */
  stats?: { formattedNumbers: number }
}

/** 시트 XML → 행마다 탭으로 구분한 텍스트(빈 행 제외, 칸 위치 유지·끝 빈칸 제외) */
export function readSheet(xml: string, ctx: SheetContext): string[] {
  return readSheetRows(xml, ctx).map((row) => row.join('\t'))
}

/** 시트 XML → 행(칸 배열). 빈 행 제외, 칸 위치 유지(빈 칸은 ''), 끝 빈칸 제외 */
export function readSheetRows(xml: string, ctx: SheetContext): string[][] {
  const doc = parseXml(xml)
  const lines: string[][] = []
  for (const row of Array.from(doc.getElementsByTagName('row'))) {
    const cells: string[] = []
    let next = 0
    for (const c of elementChildren(row).filter((e) => e.tagName === 'c')) {
      const ref = c.getAttribute('r')
      const index = ref ? columnIndex(ref) : next
      next = index + 1
      const type = c.getAttribute('t')
      const v = elementChildren(c).find((e) => e.tagName === 'v')?.textContent ?? ''
      let value = ''
      if (type === 's') value = ctx.shared[Number(v)] ?? ''
      else if (type === 'inlineStr') value = Array.from(c.getElementsByTagName('t')).map((t) => t.textContent ?? '').join('')
      else if (type === 'b') value = v === '1' ? 'TRUE' : v === '0' ? 'FALSE' : v
      else if (type === 'str' || type === 'e') value = v
      else if (v !== '') {
        const style = Number(c.getAttribute('s') ?? 0)
        value = ctx.dateStyles[style] ? excelSerialToDate(Number(v)) : formatNumber(v)
        if (!ctx.dateStyles[style] && ctx.formattedStyles?.[style] && ctx.stats) ctx.stats.formattedNumbers++
      }
      cells[index] = value.replace(/[\t\r\n]+/g, ' ').trim()
    }
    const filled = Array.from(cells, (v) => v ?? '')
    while (filled.length && filled[filled.length - 1] === '') filled.pop()
    if (filled.length) lines.push(filled)
  }
  return lines
}

export function readSharedStrings(xml: string): string[] {
  const doc = parseXml(xml)
  // 서식이 섞인 문자열(r/t 여러 개)도 이어 붙인다. 발음(rPh) 글자는 제외
  return Array.from(doc.getElementsByTagName('si')).map((si) =>
    Array.from(si.getElementsByTagName('t'))
      .filter((t) => (t.parentNode as Element | null)?.tagName !== 'rPh')
      .map((t) => t.textContent ?? '')
      .join('')
  )
}

/** 셀 서식 번호별 — 날짜 서식인가, (날짜가 아닌) 표시 서식이 있는 숫자 서식인가. 일반(0)·텍스트(49)·정수(1)는 원래 숫자와 같게 보여 제외 */
export function readCellStyles(xml: string): { date: boolean[]; formatted: boolean[] } {
  const doc = parseXml(xml)
  const custom = new Map<number, string>()
  for (const f of Array.from(doc.getElementsByTagName('numFmt'))) custom.set(Number(f.getAttribute('numFmtId')), f.getAttribute('formatCode') ?? '')
  const cellXfs = doc.getElementsByTagName('cellXfs')[0]
  if (!cellXfs) return { date: [], formatted: [] }
  const ids = elementChildren(cellXfs)
    .filter((e) => e.tagName === 'xf')
    .map((xf) => Number(xf.getAttribute('numFmtId') ?? 0))
  const date = ids.map((id) => isDateFormat(id, custom.get(id)))
  const formatted = ids.map((id, i) => !date[i] && id !== 0 && id !== 1 && id !== 49 && custom.get(id) !== 'General' && custom.get(id) !== '@')
  return { date, formatted }
}

export function readDateStyles(xml: string): boolean[] {
  return readCellStyles(xml).date
}

/* ───────────── ZIP 읽기 ───────────── */

/** `_rels` 파일 → (Id → 대상 경로, 기준 폴더에서 풀어 쓴 절대 경로) */
export function readRels(xml: string, baseDir: string): Map<string, string> {
  const doc = parseXml(xml)
  const map = new Map<string, string>()
  for (const r of Array.from(doc.getElementsByTagName('Relationship'))) {
    const target = r.getAttribute('Target') ?? ''
    const path = target.startsWith('/') ? target.slice(1) : resolvePath(baseDir, target)
    map.set(r.getAttribute('Id') ?? '', path)
  }
  return map
}

/** `ppt/` + `slides/slide1.xml` → `ppt/slides/slide1.xml`(../ 처리) */
export function resolvePath(baseDir: string, target: string): string {
  const parts = [...baseDir.split('/').filter(Boolean), ...target.split('/')]
  const out: string[] = []
  for (const part of parts) {
    if (part === '..') out.pop()
    else if (part !== '.' && part !== '') out.push(part)
  }
  return out.join('/')
}

export async function readText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path)
  if (!file) throw new OfficeLoadError('문서 구성이 올바르지 않습니다. 파일이 손상되었을 수 있습니다.')
  return file.async('string')
}

export interface OfficeSection {
  /** 「슬라이드 3」·「시트: 매출」·「구역 2」 등(구분선 제목, 하나뿐이면 표시하지 않음) */
  title: string
  text: string
  /** 문단·표 블록(텍스트는 여기서 만든다) */
  blocks: Block[]
}

const section = (title: string, blocks: Block[]): OfficeSection => ({ title, text: blocksToText(blocks), blocks })

export interface OfficeResult {
  format: OfficeFormat
  sections: OfficeSection[]
  text: string
  /** 「슬라이드 12장」·「시트 3개」 등 */
  summary: string
  /** 추출되지 않은 내용(문서에 실제로 있는 것만) */
  omissions: Omission[]
}

/** 여러 구역 결과를 하나로 — 둘 이상이면 `--- 제목 ---` 구분선 */
export function joinSections(sections: OfficeSection[]): string {
  if (sections.length === 1) return sections[0].text
  return sections.map((s) => `--- ${s.title} ---\n${s.text}`.trimEnd()).join('\n\n')
}

type Reader = (zip: JSZip) => Promise<{ sections: OfficeSection[]; stats: OmissionStats }>

const filesMatching = (zip: JSZip, re: RegExp) => Object.keys(zip.files).filter((p) => re.test(p) && !zip.files[p].dir)
const countTags = (doc: Document, ...tags: string[]) => tags.reduce((n, t) => n + doc.getElementsByTagName(t).length, 0)

/** 머리말·꼬리말처럼 따로 저장된 부분 중 글자가 있는 것의 수 */
async function countNonEmpty(zip: JSZip, paths: string[], format: 'docx' | 'pptx' | 'hwpx'): Promise<number> {
  let n = 0
  for (const path of paths) if (extractXmlText(await readText(zip, path), format).trim()) n++
  return n
}

/** 각주·미주(구분선 등 type이 있는 항목 제외) 중 글자가 있는 것의 수 */
function countDocxNotes(xml: string, tag: 'w:footnote' | 'w:endnote'): number {
  const doc = parseXml(xml)
  return Array.from(doc.getElementsByTagName(tag)).filter((n) => {
    const type = n.getAttribute('w:type')
    return (!type || type === 'normal') && blocksToText(readContainer(n, GRAMMARS.docx)).trim() !== ''
  }).length
}

const readDocx: Reader = async (zip) => {
  const xml = await readText(zip, 'word/document.xml')
  const doc = parseXml(xml)
  let notes = 0
  if (zip.file('word/footnotes.xml')) notes += countDocxNotes(await readText(zip, 'word/footnotes.xml'), 'w:footnote')
  if (zip.file('word/endnotes.xml')) notes += countDocxNotes(await readText(zip, 'word/endnotes.xml'), 'w:endnote')
  const stats: OmissionStats = {
    headerFooter: await countNonEmpty(zip, filesMatching(zip, /^word\/(header|footer)\d*\.xml$/), 'docx'),
    notes,
    // 번호 매기기(numId 0은 「번호 없음」)
    autoNumbering: Array.from(doc.getElementsByTagName('w:numPr')).filter((n) => {
      const id = n.getElementsByTagName('w:numId')[0]?.getAttribute('w:val')
      return id !== undefined && id !== null && id !== '0'
    }).length,
    comments: zip.file('word/comments.xml') ? countTags(parseXml(await readText(zip, 'word/comments.xml')), 'w:comment') : 0,
    images: countTags(doc, 'pic:pic'),
    charts: countTags(doc, 'c:chart'),
    smartArt: countTags(doc, 'dgm:relIds'),
  }
  return { sections: [section('본문', readContainer(doc.documentElement, GRAMMARS.docx))], stats }
}

/** 슬라이드 rels에서 노트 경로 */
function notesPathOf(relsXml: string, baseDir: string): string | null {
  const doc = parseXml(relsXml)
  const rel = Array.from(doc.getElementsByTagName('Relationship')).find((r) => (r.getAttribute('Type') ?? '').endsWith('/notesSlide'))
  const target = rel?.getAttribute('Target')
  return target ? resolvePath(baseDir, target) : null
}

/** 노트 슬라이드의 본문(body 자리) 글자 — 슬라이드 그림·번호 자리는 제외 */
function notesBodyText(xml: string): string {
  const doc = parseXml(xml)
  return Array.from(doc.getElementsByTagName('p:sp'))
    .filter((sp) => Array.from(sp.getElementsByTagName('p:ph')).some((ph) => ph.getAttribute('type') === 'body'))
    .map((sp) => blocksToText(readContainer(sp, GRAMMARS.pptx)))
    .join('')
    .trim()
}

const readPptx: Reader = async (zip) => {
  const presentation = parseXml(await readText(zip, 'ppt/presentation.xml'))
  const rels = readRels(await readText(zip, 'ppt/_rels/presentation.xml.rels'), 'ppt')
  // 발표 순서(sldIdLst). 숨긴 슬라이드도 읽는다
  const ids = Array.from(presentation.getElementsByTagName('p:sldId')).map((s) => s.getAttribute('r:id') ?? '')
  const sections: OfficeSection[] = []
  const stats = { slideNotes: 0, images: 0, charts: 0, smartArt: 0 }
  for (const [i, id] of ids.entries()) {
    const path = rels.get(id)
    if (!path || !zip.file(path)) continue
    const doc = parseXml(await readText(zip, path))
    sections.push(section(`슬라이드 ${i + 1}`, readContainer(doc.documentElement, GRAMMARS.pptx)))
    stats.images += countTags(doc, 'p:pic')
    stats.charts += countTags(doc, 'c:chart')
    stats.smartArt += countTags(doc, 'dgm:relIds')
    const dir = path.slice(0, path.lastIndexOf('/'))
    const relsPath = `${dir}/_rels/${path.slice(path.lastIndexOf('/') + 1)}.rels`
    const notesPath = zip.file(relsPath) ? notesPathOf(await readText(zip, relsPath), dir) : null
    if (notesPath && zip.file(notesPath) && notesBodyText(await readText(zip, notesPath))) stats.slideNotes++
  }
  return { sections, stats }
}

const readXlsx: Reader = async (zip) => {
  const workbook = parseXml(await readText(zip, 'xl/workbook.xml'))
  const rels = readRels(await readText(zip, 'xl/_rels/workbook.xml.rels'), 'xl')
  const shared = zip.file('xl/sharedStrings.xml') ? readSharedStrings(await readText(zip, 'xl/sharedStrings.xml')) : []
  const styles = zip.file('xl/styles.xml') ? readCellStyles(await readText(zip, 'xl/styles.xml')) : { date: [], formatted: [] }
  const counter = { formattedNumbers: 0 }
  const sections: OfficeSection[] = []
  for (const sheet of Array.from(workbook.getElementsByTagName('sheet'))) {
    const path = rels.get(sheet.getAttribute('r:id') ?? '')
    if (!path || !zip.file(path)) continue // 차트 시트 등
    const hidden = sheet.getAttribute('state') === 'hidden' || sheet.getAttribute('state') === 'veryHidden'
    const name = sheet.getAttribute('name') ?? ''
    const rows = readSheetRows(await readText(zip, path), { shared, dateStyles: styles.date, formattedStyles: styles.formatted, stats: counter })
    sections.push(section(`시트: ${name}${hidden ? ' (숨김)' : ''}`, rows.length ? [{ kind: 'table', rows }] : []))
  }
  let comments = 0
  for (const p of filesMatching(zip, /^xl\/comments\d*\.xml$/)) comments += countTags(parseXml(await readText(zip, p)), 'comment')
  const stats: OmissionStats = {
    formattedNumbers: counter.formattedNumbers,
    comments,
    charts: filesMatching(zip, /^xl\/charts\/chart\d+\.xml$/).length,
    images: filesMatching(zip, /^xl\/media\//).length,
  }
  return { sections, stats }
}

/** HWPX 구역 파일 순서(content.hpf의 spine — 없으면 section0.xml, section1.xml … 순서)와 목록 항목(id → 경로, 그림 BinData 포함) */
export async function readHwpxManifest(zip: JSZip): Promise<{ sections: string[]; items: Map<string, string> }> {
  let sections: string[] = []
  let items = new Map<string, string>()
  const hpf = zip.file('Contents/content.hpf')
  if (hpf) {
    const doc = parseXml(await hpf.async('string'))
    items = new Map(Array.from(doc.getElementsByTagName('opf:item')).map((it) => [it.getAttribute('id') ?? '', it.getAttribute('href') ?? '']))
    sections = Array.from(doc.getElementsByTagName('opf:itemref'))
      .map((ref) => items.get(ref.getAttribute('idref') ?? '') ?? '')
      .filter((href) => /section\d+\.xml$/i.test(href))
  }
  if (sections.length === 0) {
    sections = Object.keys(zip.files)
      .filter((p) => /^Contents\/section\d+\.xml$/i.test(p))
      .sort((a, b) => Number(a.match(/(\d+)\.xml$/i)?.[1]) - Number(b.match(/(\d+)\.xml$/i)?.[1]))
  }
  return { sections, items }
}

const readHwpx: Reader = async (zip) => {
  const paths = (await readHwpxManifest(zip)).sections
  const blocks: Block[] = []
  const stats = { headerFooter: 0, notes: 0, images: 0 }
  for (const path of paths) {
    const doc = parseXml(await readText(zip, path))
    // 구역 사이는 빈 문단 하나(텍스트에서는 빈 줄)
    if (blocks.length) blocks.push({ kind: 'para', text: '' })
    blocks.push(...readContainer(doc.documentElement, GRAMMARS.hwpx))
    stats.headerFooter += Array.from(doc.getElementsByTagName('hp:header'))
      .concat(Array.from(doc.getElementsByTagName('hp:footer')))
      .filter((el) => (el.textContent ?? '').trim() !== '').length
    stats.notes += countTags(doc, 'hp:footNote', 'hp:endNote')
    stats.images += countTags(doc, 'hp:pic')
  }
  // 구역은 한글 편집 단위라 구분선 없이 이어 붙인다
  return { sections: [section('본문', blocks)], stats }
}

function summarize(format: OfficeFormat, sections: OfficeSection[]): string {
  if (format === 'pptx') return `슬라이드 ${sections.length}장`
  if (format === 'xlsx') return `시트 ${sections.length}개`
  return officeFormatLabel(format)
}

/** 오피스 문서 → 텍스트. 암호가 걸린 문서(ZIP이 아닌 암호화 컨테이너)·손상 파일은 안내 문구로 던진다 */
export async function extractOffice(data: ArrayBuffer | Uint8Array, format: OfficeFormat): Promise<OfficeResult> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(data)
  } catch {
    // 암호가 걸린 Office 문서는 ZIP이 아니라 OLE 복합 문서다(D0 CF 11 E0)
    const head = new Uint8Array(data instanceof ArrayBuffer ? data : data.buffer, 0, 4)
    if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) {
      throw new OfficeLoadError('암호가 걸렸거나 이전 형식으로 저장된 문서입니다. 암호를 해제하고 새 형식으로 저장한 뒤 열어 주세요.')
    }
    throw new OfficeLoadError('손상되었거나 올바른 문서 파일이 아닙니다.')
  }
  const reader = format === 'docx' ? readDocx : format === 'pptx' ? readPptx : format === 'xlsx' ? readXlsx : readHwpx
  const { sections, stats } = await reader(zip)
  return { format, sections, text: joinSections(sections), summary: summarize(format, sections), omissions: buildOmissions(stats) }
}
