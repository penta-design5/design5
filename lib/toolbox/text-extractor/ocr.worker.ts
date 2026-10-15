/**
 * OCR Worker — PaddleOCR 감지(글자 영역) → 인식(줄마다 글자)을 onnxruntime-web(CPU/WASM)으로 실행한다.
 * 메인 스레드와 분리해 인식 중에도 화면이 멈추지 않는다. 이미지 축소·자르기는 OffscreenCanvas로 Worker 안에서 한다.
 */
import * as ort from 'onnxruntime-web'
import { layoutText } from './layout'
import {
  REC_HEIGHT,
  REC_MIN_CONFIDENCE,
  buildCharset,
  ctcDecode,
  detInputSize,
  fillDetTensor,
  fillRecTensor,
  findTextBoxes,
  recInputWidth,
} from './ocr'
import type { OcrWorkerRequest, OcrWorkerResponse, RecognizedLine } from './protocol'
import { fixPunctuationSpacing } from './text'

const scope = self as unknown as {
  postMessage: (message: OcrWorkerResponse, transfer?: Transferable[]) => void
  onmessage: ((event: MessageEvent<OcrWorkerRequest>) => void) | null
  crossOriginIsolated?: boolean
  navigator: Navigator
}

/** 멀티 스레드는 교차 출처 격리 페이지에서만 동작(이 페이지만 COOP·COEP — next.config.js). 4스레드에서 약 3배 빠르다(§4 P2 측정) */
const threadCount = () => (scope.crossOriginIsolated ? Math.min(4, scope.navigator.hardwareConcurrency || 1) : 1)

let det: ort.InferenceSession | null = null
let rec: ort.InferenceSession | null = null
let charset: string[] = []

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function load(request: Extract<OcrWorkerRequest, { type: 'load' }>) {
  ort.env.wasm.wasmPaths = request.wasmBaseUrl
  ort.env.wasm.numThreads = threadCount()
  await Promise.all([det?.release(), rec?.release()].map((p) => p?.catch(() => undefined)))
  det = rec = null
  const started = performance.now()
  try {
    const options: ort.InferenceSession.SessionOptions = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }
    det = await ort.InferenceSession.create(new Uint8Array(request.det), options)
    rec = await ort.InferenceSession.create(new Uint8Array(request.rec), options)
    charset = buildCharset(request.dict)
    scope.postMessage({ type: 'ready', createMs: performance.now() - started, threads: ort.env.wasm.numThreads ?? 1 })
  } catch (e) {
    scope.postMessage({ type: 'load-error', message: errorMessage(e) })
  }
}

function canvas2d(width: number, height: number) {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('캔버스를 사용할 수 없습니다.')
  ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx }
}

async function recognize(request: Extract<OcrWorkerRequest, { type: 'recognize' }>) {
  const { id, bitmap } = request
  try {
    if (!det || !rec) throw new Error('인식 모델이 준비되지 않았습니다.')
    if (typeof OffscreenCanvas === 'undefined') throw new Error('이 브라우저에서는 텍스트 추출을 지원하지 않습니다.')
    const image = { width: bitmap.width, height: bitmap.height }
    const started = performance.now()
    scope.postMessage({ type: 'progress', id, stage: 'detect' })

    // 1) 감지 — 긴 변 1,600px 이하로 줄여 글자 확률 맵을 얻는다
    const size = detInputSize(image)
    const small = canvas2d(size.width, size.height)
    small.ctx.drawImage(bitmap, 0, 0, size.width, size.height)
    const detInput = fillDetTensor(small.ctx.getImageData(0, 0, size.width, size.height).data, size.width, size.height)
    const detOut = await det.run({ [det.inputNames[0]]: new ort.Tensor('float32', detInput, [1, 3, size.height, size.width]) })
    const boxes = findTextBoxes(detOut[det.outputNames[0]].data as Float32Array, size, image)
    const detected = performance.now()

    // 2) 인식 — 원본 해상도에서 상자를 잘라 높이 48px로 맞춘다
    const lines: RecognizedLine[] = []
    let done = 0
    for (const box of boxes) {
      const sx = Math.floor(box.x0)
      const sy = Math.floor(box.y0)
      const sw = Math.max(1, Math.ceil(box.x1) - sx)
      const sh = Math.max(1, Math.ceil(box.y1) - sy)
      const width = recInputWidth(sw, sh)
      const crop = canvas2d(width, REC_HEIGHT)
      crop.ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, REC_HEIGHT)
      const input = fillRecTensor(crop.ctx.getImageData(0, 0, width, REC_HEIGHT).data, width)
      const out = (await rec.run({ [rec.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, REC_HEIGHT, width]) }))[rec.outputNames[0]]
      const { text, confidence } = ctcDecode(out.data as Float32Array, out.dims[1], out.dims[2], charset)
      if (text.trim() && confidence >= REC_MIN_CONFIDENCE) lines.push({ x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1, text, confidence })
      done++
      // 진행 알림은 너무 잦지 않게(약 40번)
      if (done === boxes.length || done % Math.max(1, Math.ceil(boxes.length / 40)) === 0) {
        scope.postMessage({ type: 'progress', id, stage: 'recognize', done, total: boxes.length })
      }
    }

    scope.postMessage({
      type: 'result',
      id,
      text: fixPunctuationSpacing(layoutText(lines)),
      lines,
      ms: { detect: detected - started, recognize: performance.now() - detected },
    })
  } catch (e) {
    scope.postMessage({ type: 'recognize-error', id, message: errorMessage(e) })
  } finally {
    bitmap.close()
  }
}

// 요청은 순서대로 처리한다(세션을 동시에 두 번 실행하지 않음)
let queue: Promise<void> = Promise.resolve()
scope.onmessage = (event) => {
  const request = event.data
  queue = queue.then(() => (request.type === 'load' ? load(request) : recognize(request)))
}
