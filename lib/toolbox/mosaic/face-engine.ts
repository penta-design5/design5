import { ORT_WASM_BASE_URL } from '@/lib/toolbox/common/ort'
import { FACE_MODEL, FACE_SCORE_THRESHOLD, sha256Hex, type FaceBox } from './face'
import type { FaceWorkerRequest, FaceWorkerResponse } from './face-protocol'

export class FaceDetectionError extends Error {}

export interface FaceDetectResult {
  boxes: FaceBox[]
  ms: number
  tiles: number
}

/**
 * 얼굴 감지 Worker 래퍼 — 모델을 내려받아(같은 출처, 해시 확인) Worker에 넘기고, 이미지를 보내 상자를 돌려받는다.
 * 감지 취소 = Worker를 끝낸다(다음 감지에서 모델을 다시 준비 — 0.23MB라 부담 없음).
 */
export class FaceEngine {
  private worker: Worker | null = null
  private ready: Promise<void> | null = null
  private nextId = 1
  private pending: {
    id: number
    resolve: (r: FaceDetectResult) => void
    reject: (e: Error) => void
    onProgress?: (done: number, total: number) => void
  } | null = null
  private pendingLoad: { resolve: () => void; reject: (e: Error) => void } | null = null

  private reset(error: Error) {
    this.worker?.terminate()
    this.worker = null
    this.ready = null
    this.pending?.reject(error)
    this.pending = null
    this.pendingLoad?.reject(error)
    this.pendingLoad = null
  }

  private handle(message: FaceWorkerResponse) {
    switch (message.type) {
      case 'ready':
        this.pendingLoad?.resolve()
        this.pendingLoad = null
        break
      case 'load-error':
        this.pendingLoad?.reject(new FaceDetectionError('얼굴 감지 모델을 준비하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.'))
        this.pendingLoad = null
        console.error('[face] 모델 준비 실패:', message.message)
        break
      case 'progress':
        if (this.pending?.id === message.id) this.pending.onProgress?.(message.done, message.total)
        break
      case 'result':
        if (this.pending?.id === message.id) {
          this.pending.resolve({ boxes: message.boxes, ms: message.ms, tiles: message.tiles })
          this.pending = null
        }
        break
      case 'detect-error':
        if (this.pending?.id === message.id) {
          this.pending.reject(new FaceDetectionError(message.message))
          this.pending = null
        }
        break
    }
  }

  private async ensureReady(): Promise<void> {
    if (this.ready) return this.ready
    const ready = (async () => {
      let bytes: Uint8Array
      try {
        const response = await fetch(FACE_MODEL.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        bytes = new Uint8Array(await response.arrayBuffer())
      } catch {
        throw new FaceDetectionError('얼굴 감지 모델을 내려받지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.')
      }
      if ((await sha256Hex(bytes)) !== FACE_MODEL.sha256) {
        throw new FaceDetectionError('얼굴 감지 모델 파일이 올바르지 않습니다. 새로고침한 뒤 다시 시도해 주세요.')
      }
      const worker = new Worker(new URL('./face.worker.ts', import.meta.url))
      this.worker = worker
      worker.onmessage = (event: MessageEvent<FaceWorkerResponse>) => this.handle(event.data)
      worker.onerror = (event) => this.reset(new FaceDetectionError(event.message || '얼굴 감지 중 오류가 발생했습니다.'))
      await new Promise<void>((resolve, reject) => {
        this.pendingLoad = { resolve, reject }
        const request: FaceWorkerRequest = { type: 'load', model: bytes.buffer as ArrayBuffer, wasmBaseUrl: ORT_WASM_BASE_URL }
        worker.postMessage(request, [bytes.buffer as ArrayBuffer])
      })
    })()
    this.ready = ready
    ready.catch(() => {
      if (this.ready === ready) this.ready = null
    })
    return ready
  }

  /** 이미지(원본 해상도 캔버스)에서 얼굴을 찾는다. 진행률은 (끝낸 타일, 전체 타일). */
  async detect(
    source: HTMLCanvasElement,
    options: { threshold?: number; onProgress?: (done: number, total: number) => void } = {}
  ): Promise<FaceDetectResult> {
    await this.ensureReady()
    const worker = this.worker
    if (!worker) throw new FaceDetectionError('얼굴 감지가 취소되었습니다.')
    const bitmap = await createImageBitmap(source)
    // 이미지를 만드는 동안 취소(Worker 종료)됐으면 보내지 않는다
    if (this.worker !== worker) {
      bitmap.close()
      throw new FaceDetectionError('얼굴 감지가 취소되었습니다.')
    }
    return new Promise<FaceDetectResult>((resolve, reject) => {
      const id = this.nextId++
      this.pending = { id, resolve, reject, onProgress: options.onProgress }
      const request: FaceWorkerRequest = { type: 'detect', id, bitmap, threshold: options.threshold ?? FACE_SCORE_THRESHOLD }
      worker.postMessage(request, [bitmap])
    })
  }

  /** 진행 중인 감지(모델 준비 포함)를 취소한다 */
  cancel() {
    this.reset(new FaceDetectionError('얼굴 감지가 취소되었습니다.'))
  }

  dispose() {
    this.cancel()
  }
}
