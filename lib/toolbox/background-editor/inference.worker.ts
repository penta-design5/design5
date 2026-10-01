/**
 * 배경 제거 추론 Worker — 계산 중에도 화면(진행 표시)이 멈추지 않도록 메인 스레드와 분리한다.
 * onnxruntime-web: JS는 번들(next.config.js alias → dist/ort.min.mjs), wasm은 jsDelivr CDN에서 받는다.
 * 실행 방식: WebGPU 우선, 세션 생성이 실패하면 CPU(WASM)로 대체.
 */
import * as ort from 'onnxruntime-web'
import type { InferenceBackend, WorkerRequest, WorkerResponse } from './protocol'

const scope = self as unknown as {
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
  crossOriginIsolated?: boolean
  navigator: Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }
}

let session: ort.InferenceSession | null = null

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function hasWebGPU(): Promise<boolean> {
  try {
    return Boolean(scope.navigator.gpu && (await scope.navigator.gpu.requestAdapter()))
  } catch {
    return false
  }
}

async function createSession(model: Uint8Array, backend: InferenceBackend) {
  return ort.InferenceSession.create(model, { executionProviders: [backend], graphOptimizationLevel: 'all' })
}

async function load(request: Extract<WorkerRequest, { type: 'load' }>) {
  ort.env.wasm.wasmPaths = request.wasmBaseUrl
  // 멀티스레드는 교차 출처 격리(COOP/COEP) 페이지에서만 동작 — 격리가 없으면 1스레드(경고 방지)
  ort.env.wasm.numThreads = scope.crossOriginIsolated ? Math.min(4, scope.navigator.hardwareConcurrency || 1) : 1

  await session?.release().catch(() => undefined)
  session = null
  const model = new Uint8Array(request.model)
  const started = performance.now()
  let webgpuError: string | undefined

  if (!request.forceWasm && (await hasWebGPU())) {
    try {
      session = await createSession(model, 'webgpu')
      scope.postMessage({ type: 'ready', backend: 'webgpu', createMs: performance.now() - started })
      return
    } catch (e) {
      webgpuError = errorMessage(e)
    }
  }
  try {
    session = await createSession(model, 'wasm')
    scope.postMessage({ type: 'ready', backend: 'wasm', createMs: performance.now() - started, webgpuError })
  } catch (e) {
    scope.postMessage({ type: 'load-error', message: errorMessage(e) })
  }
}

async function run(request: Extract<WorkerRequest, { type: 'run' }>) {
  if (!session) {
    scope.postMessage({ type: 'run-error', id: request.id, message: '모델이 준비되지 않았습니다.' })
    return
  }
  try {
    const started = performance.now()
    const input = new ort.Tensor('float32', request.input, [1, 3, request.size, request.size])
    const outputs = await session.run({ [session.inputNames[0]]: input })
    const tensor = outputs[session.outputNames[0]]
    // 복사본을 보낸다(ORT 내부 버퍼를 전송해 떼어 내지 않도록) — 1024² float32 = 4MB
    const output = new Float32Array((await tensor.getData()) as Float32Array)
    const ms = performance.now() - started
    input.dispose()
    tensor.dispose()
    scope.postMessage({ type: 'result', id: request.id, output, ms }, [output.buffer])
  } catch (e) {
    scope.postMessage({ type: 'run-error', id: request.id, message: errorMessage(e) })
  }
}

// 요청은 순서대로 처리한다(세션 하나를 동시에 두 번 실행하지 않음)
let queue: Promise<void> = Promise.resolve()
scope.onmessage = (event) => {
  const request = event.data
  queue = queue.then(() => (request.type === 'load' ? load(request) : run(request)))
}
