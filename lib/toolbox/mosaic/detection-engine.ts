import { ORT_WASM_BASE_URL } from '@/lib/toolbox/common/ort'
import { sha256Hex, type FaceBox } from './face'
import type { DetectionWorkerRequest, DetectionWorkerResponse } from './detection-protocol'

export class DetectionError extends Error {}

export interface DetectionResult {
  boxes: FaceBox[]
  ms: number
  tiles: number
}

export interface DetectionEngineConfig {
  /** Worker는 번들러가 정적으로 찾아야 해서 호출하는 쪽이 `new Worker(new URL('./x.worker.ts', import.meta.url))`로 만든다 */
  createWorker: () => Worker
  /** 같은 출처에서 내려받아 SHA-256을 확인한다 */
  model: { url: string; sha256: string }
  /** 오류 안내에 쓰는 이름 — 「얼굴」·「번호판」 */
  label: string
  /** 감지 점수 하한 기본값 */
  threshold: number
}

/**
 * 감지 Worker 래퍼(얼굴·번호판 공용) — 모델을 내려받아(같은 출처, 해시 확인) Worker에 넘기고, 이미지를 보내 상자를 돌려받는다.
 * 감지 취소 = Worker를 끝낸다(다음 감지에서 모델을 다시 준비).
 */
export class DetectionEngine {
  private worker: Worker | null = null
  private ready: Promise<void> | null = null
  private nextId = 1
  private pending: {
    id: number
    resolve: (r: DetectionResult) => void
    reject: (e: Error) => void
    onProgress?: (done: number, total: number) => void
  } | null = null
  private pendingLoad: { resolve: () => void; reject: (e: Error) => void } | null = null

  constructor(private readonly config: DetectionEngineConfig) {}

  private reset(error: Error) {
    this.worker?.terminate()
    this.worker = null
    this.ready = null
    this.pending?.reject(error)
    this.pending = null
    this.pendingLoad?.reject(error)
    this.pendingLoad = null
  }

  private handle(message: DetectionWorkerResponse) {
    const { label } = this.config
    switch (message.type) {
      case 'ready':
        this.pendingLoad?.resolve()
        this.pendingLoad = null
        break
      case 'load-error':
        this.pendingLoad?.reject(new DetectionError(`${label} 감지 모델을 준비하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.`))
        this.pendingLoad = null
        console.error(`[${label}] 모델 준비 실패:`, message.message)
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
          this.pending.reject(new DetectionError(message.message))
          this.pending = null
        }
        break
    }
  }

  private async ensureReady(): Promise<void> {
    if (this.ready) return this.ready
    const { label, model } = this.config
    const ready = (async () => {
      let bytes: Uint8Array
      try {
        const response = await fetch(model.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        bytes = new Uint8Array(await response.arrayBuffer())
      } catch {
        throw new DetectionError(`${label} 감지 모델을 내려받지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.`)
      }
      if ((await sha256Hex(bytes)) !== model.sha256) {
        throw new DetectionError(`${label} 감지 모델 파일이 올바르지 않습니다. 새로고침한 뒤 다시 시도해 주세요.`)
      }
      const worker = this.config.createWorker()
      this.worker = worker
      worker.onmessage = (event: MessageEvent<DetectionWorkerResponse>) => this.handle(event.data)
      worker.onerror = (event) => this.reset(new DetectionError(event.message || `${label} 감지 중 오류가 발생했습니다.`))
      await new Promise<void>((resolve, reject) => {
        this.pendingLoad = { resolve, reject }
        const request: DetectionWorkerRequest = { type: 'load', model: bytes.buffer as ArrayBuffer, wasmBaseUrl: ORT_WASM_BASE_URL }
        worker.postMessage(request, [bytes.buffer as ArrayBuffer])
      })
    })()
    this.ready = ready
    ready.catch(() => {
      if (this.ready === ready) this.ready = null
    })
    return ready
  }

  /** 이미지(원본 해상도 캔버스)에서 대상을 찾는다. 진행률은 (끝낸 타일, 전체 타일). */
  async detect(
    source: HTMLCanvasElement,
    options: { threshold?: number; upscale?: boolean; onProgress?: (done: number, total: number) => void } = {}
  ): Promise<DetectionResult> {
    const { label } = this.config
    await this.ensureReady()
    const worker = this.worker
    if (!worker) throw new DetectionError(`${label} 감지가 취소되었습니다.`)
    const bitmap = await createImageBitmap(source)
    // 이미지를 만드는 동안 취소(Worker 종료)됐으면 보내지 않는다
    if (this.worker !== worker) {
      bitmap.close()
      throw new DetectionError(`${label} 감지가 취소되었습니다.`)
    }
    return new Promise<DetectionResult>((resolve, reject) => {
      const id = this.nextId++
      this.pending = { id, resolve, reject, onProgress: options.onProgress }
      const request: DetectionWorkerRequest = {
        type: 'detect',
        id,
        bitmap,
        threshold: options.threshold ?? this.config.threshold,
        upscale: options.upscale,
      }
      worker.postMessage(request, [bitmap])
    })
  }

  /** 진행 중인 감지(모델 준비 포함)를 취소한다 */
  cancel() {
    this.reset(new DetectionError(`${this.config.label} 감지가 취소되었습니다.`))
  }

  dispose() {
    this.cancel()
  }
}
