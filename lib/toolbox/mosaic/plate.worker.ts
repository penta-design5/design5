/**
 * 번호판 감지 Worker — YOLOv9-t 640(onnxruntime-web, CPU/WASM)으로 이미지를 타일·축소·확대 단계별로 훑는다.
 * 메인 스레드와 분리해 감지 중에도 화면이 멈추지 않는다. 이미지 자르기·확대/축소는 OffscreenCanvas로 Worker 안에서 한다.
 * 얼굴 감지 Worker(`face.worker.ts`)와 같은 구조이고, 입력 전처리와 출력 해독만 다르다.
 */
import * as ort from 'onnxruntime-web'
import { tileBoxesToImage, type FaceBox } from './face'
import {
  PLATE_INPUT_SIZE,
  countPlateTiles,
  decodePlateOutput,
  finalizePlateBoxes,
  planPlateLevels,
  rgbaToRgbTensor,
} from './plate'
import type { DetectionWorkerRequest, DetectionWorkerResponse } from './detection-protocol'

const scope = self as unknown as {
  postMessage: (message: DetectionWorkerResponse, transfer?: Transferable[]) => void
  onmessage: ((event: MessageEvent<DetectionWorkerRequest>) => void) | null
}

let session: ort.InferenceSession | null = null
/** 타일 하나의 입력 버퍼 — 모든 타일이 재사용한다(3 × 640 × 640 float32 ≈ 4.7MB) */
const tensorBuffer = new Float32Array(3 * PLATE_INPUT_SIZE * PLATE_INPUT_SIZE)

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function load(request: Extract<DetectionWorkerRequest, { type: 'load' }>) {
  ort.env.wasm.wasmPaths = request.wasmBaseUrl
  ort.env.wasm.numThreads = 1
  await session?.release().catch(() => undefined)
  session = null
  const started = performance.now()
  try {
    session = await ort.InferenceSession.create(new Uint8Array(request.model), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' })
    scope.postMessage({ type: 'ready', createMs: performance.now() - started })
  } catch (e) {
    scope.postMessage({ type: 'load-error', message: errorMessage(e) })
  }
}

function canvas2d(width: number, height: number) {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('캔버스를 사용할 수 없습니다.')
  return { canvas, ctx }
}

async function detect(request: Extract<DetectionWorkerRequest, { type: 'detect' }>) {
  const { id, bitmap, threshold, upscale } = request
  try {
    if (!session) throw new Error('모델이 준비되지 않았습니다.')
    if (typeof OffscreenCanvas === 'undefined') throw new Error('이 브라우저에서는 번호판 감지를 지원하지 않습니다.')
    const started = performance.now()
    const size = { width: bitmap.width, height: bitmap.height }
    const levels = planPlateLevels(size, { upscale })
    const total = countPlateTiles(levels)
    const tile = canvas2d(PLATE_INPUT_SIZE, PLATE_INPUT_SIZE)
    const found: FaceBox[] = []
    let done = 0

    for (const level of levels) {
      // 이 단계 배율로 줄이거나 키운 이미지(배율 1이면 원본 그대로 쓴다)
      const scaled = level.scale === 1 ? null : canvas2d(level.width, level.height)
      if (scaled) {
        scaled.ctx.imageSmoothingQuality = 'high'
        scaled.ctx.drawImage(bitmap, 0, 0, level.width, level.height)
      }
      const source = (scaled?.canvas ?? bitmap) as CanvasImageSource
      for (const t of level.tiles) {
        tile.ctx.clearRect(0, 0, PLATE_INPUT_SIZE, PLATE_INPUT_SIZE)
        tile.ctx.drawImage(source, t.x, t.y, t.width, t.height, 0, 0, t.width, t.height)
        const rgba = tile.ctx.getImageData(0, 0, t.width, t.height).data
        const input = new ort.Tensor('float32', rgbaToRgbTensor(rgba, t.width, t.height, tensorBuffer), [1, 3, PLATE_INPUT_SIZE, PLATE_INPUT_SIZE])
        const outputs = await session.run({ [session.inputNames[0]]: input })
        const output = outputs[session.outputNames[0]]
        found.push(...tileBoxesToImage(decodePlateOutput(output.data as Float32Array, output.dims[0], threshold), t, level))
        done++
        // 진행 알림은 너무 잦지 않게(약 40번)
        if (done === total || done % Math.max(1, Math.ceil(total / 40)) === 0) scope.postMessage({ type: 'progress', id, done, total })
      }
    }

    scope.postMessage({ type: 'result', id, boxes: finalizePlateBoxes(found, size), ms: performance.now() - started, tiles: total })
  } catch (e) {
    scope.postMessage({ type: 'detect-error', id, message: errorMessage(e) })
  } finally {
    bitmap.close()
  }
}

// 요청은 순서대로 처리한다(세션 하나를 동시에 두 번 실행하지 않음)
let queue: Promise<void> = Promise.resolve()
scope.onmessage = (event) => {
  const request = event.data
  queue = queue.then(() => (request.type === 'load' ? load(request) : detect(request)))
}
