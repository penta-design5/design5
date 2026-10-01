import { ORT_WASM_BASE_URL } from './model'
import type { InferenceBackend, WorkerRequest, WorkerResponse } from './protocol'

export interface EngineReady {
  backend: InferenceBackend
  createMs: number
  /** WebGPU를 시도했다가 실패해 CPU로 바꾼 경우의 원인(진단용) */
  webgpuError?: string
}

/**
 * 추론 Worker 래퍼 — 요청/응답을 Promise로 바꾼다. 페이지당 하나를 만들고 떠날 때 dispose.
 * 모델 세션은 Worker 안에만 있다(메인 스레드 메모리에 모델을 두지 않음).
 */
export class BackgroundEngine {
  private worker: Worker
  private nextId = 1
  private pendingLoad: { resolve: (r: EngineReady) => void; reject: (e: Error) => void } | null = null
  private pendingRuns = new Map<number, { resolve: (r: { output: Float32Array; ms: number }) => void; reject: (e: Error) => void }>()

  constructor() {
    this.worker = new Worker(new URL('./inference.worker.ts', import.meta.url))
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.handle(event.data)
    this.worker.onerror = (event) => {
      const error = new Error(event.message || '처리 중 오류가 발생했습니다.')
      this.pendingLoad?.reject(error)
      this.pendingLoad = null
      this.pendingRuns.forEach((p) => p.reject(error))
      this.pendingRuns.clear()
    }
  }

  private post(request: WorkerRequest, transfer: Transferable[] = []) {
    this.worker.postMessage(request, transfer)
  }

  private handle(message: WorkerResponse) {
    switch (message.type) {
      case 'ready':
        this.pendingLoad?.resolve({ backend: message.backend, createMs: message.createMs, webgpuError: message.webgpuError })
        this.pendingLoad = null
        break
      case 'load-error':
        this.pendingLoad?.reject(new Error(message.message))
        this.pendingLoad = null
        break
      case 'result':
        this.pendingRuns.get(message.id)?.resolve({ output: message.output, ms: message.ms })
        this.pendingRuns.delete(message.id)
        break
      case 'run-error':
        this.pendingRuns.get(message.id)?.reject(new Error(message.message))
        this.pendingRuns.delete(message.id)
        break
    }
  }

  /** 모델 세션 생성. bytes의 버퍼는 Worker로 전송되어 호출 후 비워진다 */
  load(bytes: Uint8Array, forceWasm = false): Promise<EngineReady> {
    return new Promise((resolve, reject) => {
      this.pendingLoad?.reject(new Error('다른 모델 준비 요청으로 취소되었습니다.'))
      this.pendingLoad = { resolve, reject }
      const buffer = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength ? bytes.buffer : bytes.slice().buffer
      this.post({ type: 'load', model: buffer as ArrayBuffer, forceWasm, wasmBaseUrl: ORT_WASM_BASE_URL }, [buffer as ArrayBuffer])
    })
  }

  /** 추론 1회. input의 버퍼는 Worker로 전송되어 호출 후 비워진다 */
  run(input: Float32Array, size: number): Promise<{ output: Float32Array; ms: number }> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++
      this.pendingRuns.set(id, { resolve, reject })
      this.post({ type: 'run', id, input, size }, [input.buffer])
    })
  }

  dispose() {
    this.worker.terminate()
    const error = new Error('작업이 취소되었습니다.')
    this.pendingLoad?.reject(error)
    this.pendingRuns.forEach((p) => p.reject(error))
    this.pendingRuns.clear()
  }
}
