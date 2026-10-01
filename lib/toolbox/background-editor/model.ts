/**
 * 배경 제거 모델(ISNet general-use fp16) 내려받기·검증·캐시·호환 보정.
 * 모델은 사용자 브라우저가 외부 CDN(Hugging Face)에서 직접 받는다 — 서버를 거치지 않는다.
 * 출처·변환 방법·검증 기록: docs/TOOLBOX_background-editor_handoff.md §1 T1-a
 */

/** package.json의 onnxruntime-web 버전과 같아야 한다(model.test.ts에서 확인) — wasm은 jsDelivr에서 같은 버전을 받는다 */
export const ORT_VERSION = '1.30.0'
export const ORT_WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`

export const MODEL = {
  /** 커밋 해시로 고정한 URL — 저장소 파일이 바뀌어도 이 주소의 내용은 바뀌지 않는다 */
  url: 'https://huggingface.co/tiper-penta/isnet-general-use-fp16/resolve/edcb78a6822640f4c2a1e6c9aa0ca6abab60a674/isnet-general-use-fp16.onnx',
  sha256: '1e00f2f0b23dea1b687ff90652263144fdb98af942aaa0cae8630c49159b18f0',
  bytes: 90_661_254,
  /** 모델 입력 한 변(px) — 입력 [1, 3, 1024, 1024] */
  inputSize: 1024,
} as const

/** 내려받은 모델을 보관하는 Cache Storage 이름 — 모델을 바꾸면 이름도 바꿔 이전 캐시를 정리한다 */
export const MODEL_CACHE_NAME = 'toolbox-bg-model-v1'

/**
 * ISNet의 MaxPool `ceil_mode` 속성(33곳) 1 → 0.
 * onnxruntime-web WebGPU는 ceil_mode=1을 지원하지 않는다(1.30.0). 입력 1024에서는 풀링 입력 크기가 모두 짝수라 결과가 같다.
 * protobuf AttributeProto { name: "ceil_mode", i: 1, type: INT } 바이트를 같은 길이로 바꾸므로 파일 구조는 그대로다.
 */
export const CEIL_MODE_PATTERN = [0x0a, 0x09, ...Array.from('ceil_mode', (c) => c.charCodeAt(0)), 0x18, 0x01, 0xa0, 0x01, 0x02]
/** 패턴에서 i 값(0x01) 위치 — 0x0a 0x09 + 이름 9바이트(2~10) + 0x18(11) 다음 */
const CEIL_MODE_VALUE_OFFSET = 12
export const EXPECTED_CEIL_MODE_COUNT = 33

/** 바이트 배열 안의 ceil_mode=1을 제자리에서 0으로 바꾸고 바꾼 개수를 돌려준다 */
export function patchCeilMode(bytes: Uint8Array): number {
  const pattern = CEIL_MODE_PATTERN
  const first = pattern[0]
  let count = 0
  for (let i = bytes.indexOf(first); i !== -1 && i <= bytes.length - pattern.length; i = bytes.indexOf(first, i + 1)) {
    let match = true
    for (let k = 1; k < pattern.length; k++) {
      if (bytes[i + k] !== pattern[k]) {
        match = false
        break
      }
    }
    if (match) {
      bytes[i + CEIL_MODE_VALUE_OFFSET] = 0x00
      count++
    }
  }
  return count
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export type ModelLoadProgress =
  | { phase: 'download'; loaded: number; total: number }
  | { phase: 'verify' }

export class ModelLoadError extends Error {}

async function openCache(): Promise<Cache | null> {
  try {
    return typeof caches === 'undefined' ? null : await caches.open(MODEL_CACHE_NAME)
  } catch {
    return null // 사생활 보호 모드 등 Cache Storage를 쓸 수 없는 환경 — 매번 내려받는다
  }
}

/** 응답 본문을 읽으며 진행률을 알린다. 크기를 알면 미리 할당한 버퍼에 바로 쓴다 */
async function readWithProgress(response: Response, onProgress: (p: ModelLoadProgress) => void): Promise<Uint8Array> {
  const total = Number(response.headers.get('Content-Length')) || MODEL.bytes
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array(await response.arrayBuffer())
  let buffer = new Uint8Array(total)
  let loaded = 0
  onProgress({ phase: 'download', loaded, total })
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (loaded + value.length > buffer.length) {
      const grown = new Uint8Array(Math.max(buffer.length * 2, loaded + value.length))
      grown.set(buffer.subarray(0, loaded))
      buffer = grown
    }
    buffer.set(value, loaded)
    loaded += value.length
    onProgress({ phase: 'download', loaded, total })
  }
  return loaded === buffer.length ? buffer : buffer.slice(0, loaded)
}

/**
 * 모델 바이트를 얻는다 — 캐시에 있으면 캐시에서, 없으면 CDN에서 진행률과 함께 내려받아 캐시에 저장.
 * 어느 쪽이든 SHA-256을 확인한다(손상·변조된 캐시는 지우고 다시 받는다).
 */
export async function loadModelBytes(options: {
  signal?: AbortSignal
  onProgress: (p: ModelLoadProgress) => void
}): Promise<{ bytes: Uint8Array; fromCache: boolean }> {
  const { signal, onProgress } = options
  const cache = await openCache()

  const cached = await cache?.match(MODEL.url).catch(() => undefined)
  if (cached) {
    onProgress({ phase: 'verify' })
    const bytes = new Uint8Array(await cached.arrayBuffer())
    if ((await sha256Hex(bytes)) === MODEL.sha256) return { bytes, fromCache: true }
    await cache?.delete(MODEL.url).catch(() => undefined)
  }

  let response: Response
  try {
    response = await fetch(MODEL.url, { signal, cache: 'no-store' })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new ModelLoadError('AI 모델을 내려받지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.')
  }
  if (!response.ok) {
    throw new ModelLoadError(`AI 모델을 내려받지 못했습니다(HTTP ${response.status}). 잠시 후 다시 시도해 주세요.`)
  }
  let bytes: Uint8Array
  try {
    bytes = await readWithProgress(response, onProgress)
  } catch (e) {
    if (signal?.aborted) throw e
    throw new ModelLoadError('내려받는 중 연결이 끊겼습니다. 다시 시도해 주세요.')
  }

  onProgress({ phase: 'verify' })
  if ((await sha256Hex(bytes)) !== MODEL.sha256) {
    throw new ModelLoadError('내려받은 AI 모델 파일이 올바르지 않습니다. 다시 시도해 주세요.')
  }
  // 저장 공간 부족 등으로 실패해도 이번 사용에는 문제없다(다음에 다시 내려받는다)
  await cache
    ?.put(MODEL.url, new Response(bytes as BodyInit, { headers: { 'Content-Type': 'application/octet-stream' } }))
    .catch(() => undefined)
  return { bytes, fromCache: false }
}
