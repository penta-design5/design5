/**
 * PDF 입력 — 순수 함수(테스트 가능). pdf.js 호출은 `pdf-document.ts`.
 * 페이지마다 PDF에 들어 있는 글자(텍스트 레이어)가 있으면 그대로 읽고, 없으면(스캔본) 페이지를 그려 OCR한다.
 */
import { groupLines, type TextBox } from './layout'

/** react-pdf가 쓰는 pdfjs-dist 버전 — public/js/pdf.worker.min.mjs·public/js/pdfjs/와 같아야 한다(테스트에서 확인) */
export const PDFJS_VERSION = '5.4.296'

/** pdf.js가 불러오는 파일(같은 출처) — public/js/pdfjs/README.md */
export const PDFJS_ASSETS = {
  /** pdf.js 본체 — webpack을 거치지 않고 브라우저가 직접 불러온다(`pdf-document.ts` 참고) */
  module: '/js/pdfjs/pdf.min.mjs',
  workerSrc: '/js/pdf.worker.min.mjs',
  wasmUrl: '/js/pdfjs/wasm/',
  cMapUrl: '/js/pdfjs/cmaps/',
  standardFontDataUrl: '/js/pdfjs/standard_fonts/',
} as const

/** 한 번에 추출할 수 있는 최대 페이지 수(D8) */
export const PDF_MAX_PAGES = 50
/** PDF 파일 크기 상한 — 스캔본은 이미지보다 크므로 이미지(20MB)보다 넉넉히 */
export const PDF_MAX_BYTES = 50 * 1024 * 1024
/** 텍스트 레이어로 인정하는 최소 글자 수(공백 제외) — 스캔본에 페이지 번호 정도만 글자로 들어 있는 경우를 거른다 */
export const TEXT_LAYER_MIN_CHARS = 20
/** OCR용으로 페이지를 그릴 긴 변(px) — PoC 스캔 PDF(2,600px)에서 작은 글씨까지 읽혔다 */
export const OCR_RENDER_LONG_SIDE = 2400
/** 미리보기로 그릴 긴 변(px) */
export const PREVIEW_RENDER_LONG_SIDE = 1600

export function isPdfFile(file: { name: string; type: string }): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

export function validatePdfFile(file: { size: number }): string | null {
  if (file.size > PDF_MAX_BYTES) return `PDF가 너무 큽니다. ${PDF_MAX_BYTES / 1024 / 1024}MB 이하 파일을 사용해 주세요.`
  if (file.size === 0) return '빈 파일입니다.'
  return null
}

export type PageRange = { start: number; end: number }

/** 처음 열 때의 페이지 범위 — 1쪽부터 최대 50쪽 */
export const defaultPageRange = (numPages: number): PageRange => ({ start: 1, end: Math.min(numPages, PDF_MAX_PAGES) })

/** 입력한 페이지 범위 검증 — 정수·1 이상·전체 이하·시작 ≤ 끝·50쪽 이하 */
export function parsePageRange(startText: string, endText: string, numPages: number): { range: PageRange } | { error: string } {
  const start = Number(startText.trim())
  const end = Number(endText.trim())
  if (startText.trim() === '' || endText.trim() === '' || !Number.isInteger(start) || !Number.isInteger(end)) {
    return { error: '페이지 번호를 숫자로 입력해 주세요.' }
  }
  if (start < 1 || end > numPages) return { error: `1 ~ ${numPages}쪽 사이로 입력해 주세요.` }
  if (start > end) return { error: '시작 페이지가 끝 페이지보다 큽니다.' }
  if (end - start + 1 > PDF_MAX_PAGES) return { error: `한 번에 ${PDF_MAX_PAGES}쪽까지 추출할 수 있습니다.` }
  return { range: { start, end } }
}

/** 페이지의 텍스트 레이어를 쓸 수 있는가(공백 제외 글자 수 기준) */
export function hasUsableTextLayer(text: string): boolean {
  return text.replace(/\s/g, '').length >= TEXT_LAYER_MIN_CHARS
}

/** pdf.js 텍스트 항목(필요한 필드만) */
export interface PdfTextItem {
  str: string
  /** 글자 행렬 [a, b, c, d, e, f] — PDF 좌표(아래가 0) */
  transform: number[]
  /** 글자 폭(PDF 단위) */
  width: number
}

/** 2D 아핀 행렬 곱 — pdf.js `Util.transform`과 같다 */
export function multiplyTransform(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ]
}

/**
 * 텍스트 항목 → 화면 좌표(위가 0) 상자. 줄 배치(`layoutText`)를 OCR 결과와 같이 쓰기 위해서다.
 * `viewportTransform`은 pdf.js `viewport.transform`(배율 1) — 페이지 원점·뒤집기를 처리한다.
 * 공백만 있는 항목은 상자로 만들지 않고 앞 상자 끝에 공백으로 남긴다(단어 사이 띄어쓰기 정보).
 */
export function textItemsToBoxes(items: PdfTextItem[], viewportTransform: number[]): TextBox[] {
  const scale = Math.hypot(viewportTransform[0], viewportTransform[1]) || 1
  const boxes: TextBox[] = []
  for (const item of items) {
    if (!item.str) continue
    if (item.str.trim() === '') {
      const last = boxes[boxes.length - 1]
      if (last && !/\s$/.test(last.text)) last.text += ' '
      continue
    }
    const t = multiplyTransform(viewportTransform, item.transform)
    const height = Math.hypot(t[2], t[3]) || 1
    const x = t[4]
    const baseline = t[5]
    // 기준선 아래로 내려가는 글자(g·y 등) 몫으로 높이의 20%를 더한다
    boxes.push({ x0: x, x1: x + Math.max(item.width * scale, 1), y0: baseline - height, y1: baseline + height * 0.2, text: item.str })
  }
  return boxes
}

/** 같은 줄에서 이 간격(글자 크기 배수)보다 가까운 조각은 한 조각으로 합친다 — 단어 간격 < 이 값 < 다단·표 칸 간격 */
const MERGE_GAP_RATIO = 1
/** 이 간격(글자 크기 배수)보다 좁으면 띄어쓰지 않고 붙인다(한 단어가 조각난 경우) */
const TOUCH_GAP_RATIO = 0.15

/**
 * 같은 줄의 가까운 텍스트 조각을 합친다. PDF는 단어·글자 단위로 조각나 있어 OCR(줄 단위 상자)과 달리
 * 「줄당 상자 하나」 단(段) 판정이 맞지 않기 때문이다. 조각 끝·앞에 공백이 있거나 간격이 넓으면 띄어 쓴다.
 */
export function mergeLineFragments(boxes: TextBox[]): TextBox[] {
  const fontSize = (b: TextBox) => (b.y1 - b.y0) / 1.2
  return groupLines(boxes).flatMap((line) => {
    const merged: TextBox[] = []
    for (const b of line) {
      const prev = merged[merged.length - 1]
      const size = prev ? Math.min(fontSize(prev), fontSize(b)) : 0
      const gap = prev ? b.x0 - prev.x1 : Infinity
      if (!prev || gap >= size * MERGE_GAP_RATIO) {
        merged.push({ ...b })
        continue
      }
      const spaced = /\s$/.test(prev.text) || /^\s/.test(b.text) || gap >= size * TOUCH_GAP_RATIO
      prev.text = prev.text.trimEnd() + (spaced ? ' ' : '') + b.text.trimStart()
      prev.x1 = Math.max(prev.x1, b.x1)
      prev.y0 = Math.min(prev.y0, b.y0)
      prev.y1 = Math.max(prev.y1, b.y1)
    }
    return merged
  })
}

/** OCR용 렌더 배율 — 긴 변을 2,400px로(배율 1~4) */
export function renderScale(page: { width: number; height: number }, longSide: number): number {
  return Math.min(4, Math.max(1, longSide / Math.max(page.width, page.height)))
}

export type PageSource = 'text' | 'ocr'

export interface PageText {
  page: number
  text: string
  source: PageSource
  /** 읽은 줄 상자(정규화 0~1, 미리보기 위 표시용) */
  lines?: TextBox[]
  /** 텍스트 레이어로 읽었는데 그림이 있는 페이지 — 그림 속 글자는 빠졌다(안내용) */
  hasImages?: boolean
}

/** 페이지 구분선 */
export const pageHeading = (page: number) => `--- ${page}쪽 ---`

/** 여러 페이지 결과를 하나로 — 한 페이지면 구분선 없이 */
export function joinPages(pages: PageText[]): string {
  if (pages.length === 1) return pages[0].text
  return pages.map((p) => `${pageHeading(p.page)}\n${p.text}`.trimEnd()).join('\n\n')
}

/** 결과 요약 — 「3쪽 · PDF 글자 2쪽 · OCR 1쪽」 */
export function summarizePages(pages: PageText[]): string {
  const text = pages.filter((p) => p.source === 'text').length
  const ocr = pages.length - text
  const parts = [`${pages.length}쪽`]
  if (text) parts.push(`PDF 글자 ${text}쪽`)
  if (ocr) parts.push(`OCR ${ocr}쪽`)
  return parts.join(' · ')
}
