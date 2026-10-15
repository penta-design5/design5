/**
 * pdf.js 호출(브라우저 전용).
 * pdf.js 본체는 **public/js/pdfjs/pdf.min.mjs를 브라우저가 직접 불러온다**(webpack 우회). Next 14 webpack이
 * pdfjs-dist 5의 pdf.mjs를 다시 번들링하면 `Object.defineProperty called on non-object`로 모듈 평가가 실패했다(2026-10-15).
 * 본체·워커·디코더·글꼴 데이터 모두 같은 출처(public/js/)에서 받는다 — `PDFJS_ASSETS`. 버전은 react-pdf가 설치한 pdfjs-dist와 같다(테스트에서 확인).
 */
import type * as PdfjsModule from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { layoutText, type TextBox } from './layout'
import { PDFJS_ASSETS, mergeLineFragments, renderScale, textItemsToBoxes, type PdfTextItem } from './pdf'
import { centerInside, normalizeBox, type NormRect } from './region'

export type { PDFDocumentProxy }

export class PdfLoadError extends Error {}

let pdfjsPromise: Promise<typeof PdfjsModule> | null = null

function getPdfjs(): Promise<typeof PdfjsModule> {
  pdfjsPromise ??= (import(/* webpackIgnore: true */ PDFJS_ASSETS.module) as Promise<typeof PdfjsModule>).then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_ASSETS.workerSrc
    return pdfjs
  })
  pdfjsPromise.catch(() => {
    pdfjsPromise = null // 일시적 실패면 다음에 다시 시도
  })
  return pdfjsPromise
}

/** PDF 열기 — 암호·손상 PDF는 안내 문구로 바꿔 던진다 */
export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  let pdfjs: typeof PdfjsModule
  try {
    pdfjs = await getPdfjs()
  } catch (e) {
    console.error('[PDF] pdf.js 불러오기 실패:', e)
    throw new PdfLoadError('PDF 읽기 기능을 불러오지 못했습니다. 새로고침한 뒤 다시 시도해 주세요.')
  }
  const data = new Uint8Array(await file.arrayBuffer())
  try {
    return await pdfjs.getDocument({
      data,
      wasmUrl: PDFJS_ASSETS.wasmUrl,
      cMapUrl: PDFJS_ASSETS.cMapUrl,
      cMapPacked: true,
      standardFontDataUrl: PDFJS_ASSETS.standardFontDataUrl,
    }).promise
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    if (name === 'PasswordException') throw new PdfLoadError('암호가 걸린 PDF는 열 수 없습니다. 암호를 해제한 뒤 다시 시도해 주세요.')
    if (name === 'InvalidPDFException') throw new PdfLoadError('손상되었거나 올바른 PDF 파일이 아닙니다.')
    console.error('[PDF] 열기 실패:', e)
    throw new PdfLoadError('PDF를 열지 못했습니다.')
  }
}

/** 페이지 텍스트 레이어 — 조각 상자(화면 좌표, 배율 1)와 페이지 크기 */
export interface PageTextLayer {
  boxes: TextBox[]
  width: number
  height: number
}

export async function readPageTextLayer(doc: PDFDocumentProxy, pageNumber: number): Promise<PageTextLayer> {
  const page = await doc.getPage(pageNumber)
  try {
    const viewport = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()
    const items = content.items.filter((item): item is PdfTextItem & (typeof content.items)[number] => 'str' in item)
    return { boxes: textItemsToBoxes(items, viewport.transform), width: viewport.width, height: viewport.height }
  } finally {
    page.cleanup()
  }
}

/**
 * 텍스트 레이어 → 읽는 순서의 텍스트와 줄 상자(정규화). `region`이 있으면 중심이 영역 안에 있는 조각만 쓴다
 * (조각을 합치기 전에 고른다 — 영역 경계에 걸친 줄의 바깥 부분이 섞이지 않도록).
 */
export function layoutTextLayer(layer: PageTextLayer, region?: NormRect): { text: string; lines: TextBox[] } {
  const picked = region
    ? layer.boxes.filter((b) => centerInside(normalizeBox(b, layer.width, layer.height), region))
    : layer.boxes
  const merged = mergeLineFragments(picked)
  return { text: layoutText(merged), lines: merged.map((b) => normalizeBox(b, layer.width, layer.height)) }
}

/** 이보다 작은 그림(아이콘·글머리 기호 등)은 「그림이 있는 페이지」 안내에서 뺀다(원본 픽셀) */
export const MIN_NOTICE_IMAGE_PX = 64

/** 페이지에 일정 크기 이상의 그림이 있는가 — 텍스트 레이어로 읽은 페이지의 「그림 속 글자 빠짐」 안내용 */
export async function pageHasImages(doc: PDFDocumentProxy, pageNumber: number): Promise<boolean> {
  const pdfjs = await getPdfjs()
  const page = await doc.getPage(pageNumber)
  try {
    const { fnArray, argsArray } = await page.getOperatorList()
    const big = (w: unknown, h: unknown) => Number(w) >= MIN_NOTICE_IMAGE_PX && Number(h) >= MIN_NOTICE_IMAGE_PX
    return fnArray.some((fn, i) => {
      const args = argsArray[i] as unknown[]
      if (fn === pdfjs.OPS.paintImageXObject) return big(args[1], args[2]) // [objId, 폭, 높이]
      if (fn === pdfjs.OPS.paintImageXObjectRepeat) return true
      if (fn === pdfjs.OPS.paintInlineImageXObject) {
        const img = args[0] as { width?: number; height?: number } | undefined
        return big(img?.width, img?.height)
      }
      return false
    })
  } finally {
    page.cleanup()
  }
}

/** 페이지를 긴 변 `longSide`px로 그린다(흰 배경) */
export async function renderPage(doc: PDFDocumentProxy, pageNumber: number, longSide: number): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber)
  try {
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: renderScale(base, longSide) })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('캔버스를 사용할 수 없습니다.')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    return canvas
  } finally {
    page.cleanup()
  }
}
