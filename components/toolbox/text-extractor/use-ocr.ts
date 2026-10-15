'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isOcrCanceled, OcrEngine, type OcrProgress } from '@/lib/toolbox/text-extractor/engine'
import type { TextBox } from '@/lib/toolbox/text-extractor/layout'
import { OCR_RENDER_LONG_SIDE, hasUsableTextLayer, joinPages, type PageRange, type PageSource, type PageText } from '@/lib/toolbox/text-extractor/pdf'
import { layoutTextLayer, pageHasImages, readPageTextLayer, renderPage, type PDFDocumentProxy } from '@/lib/toolbox/text-extractor/pdf-document'
import { mapFromRegion, normalizeBox, toPixelRect, type NormRect } from '@/lib/toolbox/text-extractor/region'

/** PDF 실행 중인 페이지 — index/count는 범위 안 순번, number는 실제 페이지 번호 */
export interface PdfPageProgress {
  number: number
  index: number
  count: number
  source: PageSource
}

export type OcrStatus =
  | { kind: 'idle' }
  | { kind: 'running'; progress: OcrProgress | null; startedAt: number; page: PdfPageProgress | null }

export interface ImageRunResult {
  text: string
  /** 읽은 줄 상자(이미지 전체 기준 정규화 0~1) */
  lines: TextBox[]
}

export interface PdfRunResult {
  text: string
  pages: PageText[]
}

/** 캔버스의 일부를 새 캔버스로 자른다 */
function cropCanvas(source: HTMLCanvasElement, region: NormRect): HTMLCanvasElement {
  const px = toPixelRect(region, source.width, source.height)
  const canvas = document.createElement('canvas')
  canvas.width = px.width
  canvas.height = px.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 사용할 수 없습니다.')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, px.width, px.height)
  ctx.drawImage(source, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height)
  return canvas
}

/**
 * OCR 실행 상태 — 엔진(Worker)은 페이지에 하나만 두고, 언마운트 시 정리한다.
 * 실행 결과는 반환값으로, 취소는 null로 돌려준다(오류는 throw).
 * `region`(정규화 영역)이 있으면 그 부분만 읽는다 — 이미지·스캔 페이지는 잘라서 OCR, PDF 텍스트 레이어는 영역 안 글자만.
 */
export function useOcr() {
  const engineRef = useRef<OcrEngine | null>(null)
  const canceledRef = useRef(false)
  const [status, setStatus] = useState<OcrStatus>({ kind: 'idle' })

  useEffect(() => () => engineRef.current?.dispose(), [])

  const engine = () => (engineRef.current ??= new OcrEngine())

  /** 캔버스(또는 그 영역)를 OCR — 줄 상자는 캔버스 전체 기준 정규화 */
  const recognize = async (canvas: HTMLCanvasElement, region: NormRect | null, onProgress: (p: OcrProgress) => void) => {
    const target = region ? cropCanvas(canvas, region) : canvas
    const result = await engine().recognize(target, onProgress)
    const lines = result.lines.map((l) => {
      const box = normalizeBox({ x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, text: l.text }, target.width, target.height)
      return region ? mapFromRegion(box, region) : box
    })
    return { text: result.text, lines }
  }

  /** 이미지 한 장(또는 그 영역) */
  const run = useCallback(async (source: HTMLCanvasElement, region: NormRect | null = null): Promise<ImageRunResult | null> => {
    canceledRef.current = false
    const startedAt = performance.now()
    setStatus({ kind: 'running', progress: null, startedAt, page: null })
    try {
      return await recognize(source, region, (progress) => setStatus({ kind: 'running', progress, startedAt, page: null }))
    } catch (e) {
      if (isOcrCanceled(e)) return null
      throw e
    } finally {
      setStatus({ kind: 'idle' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recognize는 ref만 쓴다
  }, [])

  /**
   * PDF 페이지 범위 — 페이지마다 텍스트 레이어가 있으면 그대로 읽고, 없으면(또는 `forceOcr`) 페이지를 그려 OCR한다.
   * 텍스트 레이어 사용 여부는 영역이 아니라 **페이지 전체** 글자 수로 정한다(작은 영역은 글자가 적어도 텍스트 레이어로 읽어야 하므로).
   * 취소하면 지금까지 읽은 페이지도 버린다(부분 결과를 결과로 오해하지 않도록).
   */
  const runPdf = useCallback(
    async (doc: PDFDocumentProxy, range: PageRange, forceOcr: boolean, region: NormRect | null = null): Promise<PdfRunResult | null> => {
      canceledRef.current = false
      const startedAt = performance.now()
      const count = range.end - range.start + 1
      const pages: PageText[] = []
      try {
        for (let number = range.start; number <= range.end; number++) {
          if (canceledRef.current) return null
          const page = { number, index: number - range.start + 1, count }
          if (!forceOcr) {
            setStatus({ kind: 'running', progress: null, startedAt, page: { ...page, source: 'text' } })
            const layer = await readPageTextLayer(doc, number)
            const full = layoutTextLayer(layer)
            if (hasUsableTextLayer(full.text)) {
              const picked = region ? layoutTextLayer(layer, region) : full
              pages.push({ page: number, text: picked.text, source: 'text', lines: picked.lines, hasImages: await pageHasImages(doc, number) })
              continue
            }
          }
          const ocrPage = { ...page, source: 'ocr' as const }
          setStatus({ kind: 'running', progress: null, startedAt, page: ocrPage })
          const canvas = await renderPage(doc, number, OCR_RENDER_LONG_SIDE)
          if (canceledRef.current) return null
          const result = await recognize(canvas, region, (progress) => setStatus({ kind: 'running', progress, startedAt, page: ocrPage }))
          pages.push({ page: number, text: result.text, source: 'ocr', lines: result.lines })
        }
        return canceledRef.current ? null : { text: joinPages(pages), pages }
      } catch (e) {
        if (isOcrCanceled(e) || canceledRef.current) return null
        throw e
      } finally {
        setStatus({ kind: 'idle' })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recognize는 ref만 쓴다
    []
  )

  const cancel = useCallback(() => {
    canceledRef.current = true
    engineRef.current?.cancel()
  }, [])

  return { status, running: status.kind === 'running', run, runPdf, cancel }
}
