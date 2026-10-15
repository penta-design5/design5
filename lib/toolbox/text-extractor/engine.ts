import { ORT_WASM_BASE_URL } from '@/lib/toolbox/common/ort'
import { loadOcrModels, OcrModelError } from './model'
import type { OcrStage, OcrWorkerRequest, OcrWorkerResponse, RecognizedLine } from './protocol'

export class OcrError extends Error {}

/** 진행 단계 — download: 모델 내려받기(바이트), prepare: 모델 준비, 그 뒤는 Worker 단계 */
export type OcrProgress = { stage: 'download'; loaded: number; total: number } | { stage: 'prepare' } | OcrStage

export interface OcrResult {
  text: string
  lines: RecognizedLine[]
  ms: { detect: number; recognize: number }
}

const CANCELED = '텍스트 추출을 취소했습니다.'

/**
 * OCR Worker 래퍼 — 모델을 내려받아(같은 출처, 해시 확인·캐시) Worker에 넘기고, 이미지를 보내 텍스트를 돌려받는다.
 * 취소 = 내려받기 중단 + Worker 종료(다음 추출에서 모델을 다시 준비 — 캐시에서 읽으므로 다시 내려받지 않는다).
 * 구조는 이미지 모자이크의 감지 엔진(`lib/toolbox/mosaic/detection-engine.ts`)과 같다.
 */
export class OcrEngine {
  private worker: Worker | null = null
  private ready: Promise<void> | null = null
  private download: AbortController | null = null
  private nextId = 1
  private onProgress: ((p: OcrProgress) => void) | null = null
  private pending: { id: number; resolve: (r: OcrResult) => void; reject: (e: Error) => void } | null = null
  private pendingLoad: { resolve: () => void; reject: (e: Error) => void } | null = null
  /** Worker가 쓰는 스레드 수(준비 전 0) — 교차 출처 격리 페이지면 최대 4 */
  threads = 0

  private reset(error: Error) {
    this.download?.abort()
    this.download = null
    this.worker?.terminate()
    this.worker = null
    this.ready = null
    this.pending?.reject(error)
    this.pending = null
    this.pendingLoad?.reject(error)
    this.pendingLoad = null
  }

  private handle(message: OcrWorkerResponse) {
    switch (message.type) {
      case 'ready':
        this.threads = message.threads
        this.pendingLoad?.resolve()
        this.pendingLoad = null
        break
      case 'load-error':
        this.pendingLoad?.reject(new OcrError('인식 모델을 준비하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.'))
        this.pendingLoad = null
        console.error('[OCR] 모델 준비 실패:', message.message)
        break
      case 'progress':
        if (this.pending?.id === message.id) {
          this.onProgress?.(message.stage === 'detect' ? { stage: 'detect' } : { stage: 'recognize', done: message.done, total: message.total })
        }
        break
      case 'result':
        if (this.pending?.id === message.id) {
          this.pending.resolve({ text: message.text, lines: message.lines, ms: message.ms })
          this.pending = null
        }
        break
      case 'recognize-error':
        if (this.pending?.id === message.id) {
          this.pending.reject(new OcrError(message.message))
          this.pending = null
        }
        break
    }
  }

  private ensureReady(): Promise<void> {
    if (this.ready) return this.ready
    const ready = (async () => {
      const controller = new AbortController()
      this.download = controller
      let models: Awaited<ReturnType<typeof loadOcrModels>>
      try {
        models = await loadOcrModels({
          signal: controller.signal,
          onProgress: (loaded, total) => this.onProgress?.({ stage: 'download', loaded, total }),
        })
      } catch (e) {
        if (controller.signal.aborted) throw new OcrError(CANCELED)
        throw e instanceof OcrModelError ? new OcrError(e.message) : e
      } finally {
        if (this.download === controller) this.download = null
      }
      this.onProgress?.({ stage: 'prepare' })
      const worker = new Worker(new URL('./ocr.worker.ts', import.meta.url))
      this.worker = worker
      worker.onmessage = (event: MessageEvent<OcrWorkerResponse>) => this.handle(event.data)
      worker.onerror = (event) => this.reset(new OcrError(event.message || '텍스트 추출 중 오류가 발생했습니다.'))
      await new Promise<void>((resolve, reject) => {
        this.pendingLoad = { resolve, reject }
        const det = models.det.buffer as ArrayBuffer
        const rec = models.rec.buffer as ArrayBuffer
        const request: OcrWorkerRequest = { type: 'load', det, rec, dict: models.dict, wasmBaseUrl: ORT_WASM_BASE_URL }
        worker.postMessage(request, [det, rec])
      })
    })()
    this.ready = ready
    ready.catch(() => {
      if (this.ready === ready) this.ready = null
    })
    return ready
  }

  /** 이미지(원본 해상도 캔버스)에서 텍스트를 추출한다 */
  async recognize(source: HTMLCanvasElement, onProgress?: (p: OcrProgress) => void): Promise<OcrResult> {
    this.onProgress = onProgress ?? null
    await this.ensureReady()
    const worker = this.worker
    if (!worker) throw new OcrError(CANCELED)
    const bitmap = await createImageBitmap(source)
    // 이미지를 만드는 동안 취소(Worker 종료)됐으면 보내지 않는다
    if (this.worker !== worker) {
      bitmap.close()
      throw new OcrError(CANCELED)
    }
    return new Promise<OcrResult>((resolve, reject) => {
      const id = this.nextId++
      this.pending = { id, resolve, reject }
      const request: OcrWorkerRequest = { type: 'recognize', id, bitmap }
      worker.postMessage(request, [bitmap])
    })
  }

  /** 진행 중인 추출(모델 내려받기·준비 포함)을 취소한다 */
  cancel() {
    this.reset(new OcrError(CANCELED))
  }

  dispose() {
    this.cancel()
  }
}

export const isOcrCanceled = (e: unknown) => e instanceof OcrError && e.message === CANCELED
