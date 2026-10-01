/** 추론 Worker ↔ 메인 스레드 메시지 */

/** 실제로 사용 중인 실행 방식 — 화면 표시: WebGPU = 「그래픽 가속(WebGPU)」, wasm = 「CPU」 */
export type InferenceBackend = 'webgpu' | 'wasm'

export type WorkerRequest =
  | {
      type: 'load'
      /** 모델 바이트(전송 후 메인 쪽 버퍼는 비워진다) */
      model: ArrayBuffer
      /** WebGPU를 건너뛰고 CPU로만(WebGPU 실행 실패 후 재시도 등) */
      forceWasm: boolean
      wasmBaseUrl: string
    }
  | { type: 'run'; id: number; input: Float32Array; size: number }

export type WorkerResponse =
  | { type: 'ready'; backend: InferenceBackend; createMs: number; webgpuError?: string }
  | { type: 'load-error'; message: string }
  | { type: 'result'; id: number; output: Float32Array; ms: number }
  | { type: 'run-error'; id: number; message: string }
