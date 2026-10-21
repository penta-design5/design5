/**
 * OCR 모델 파일(감지·인식·사전) 내려받기 — 같은 출처(public/)에서 진행률과 함께 받고, SHA-256을 확인한 뒤
 * Cache Storage에 넣어 둔다(다음부터는 내려받지 않음). 출처·라이선스: public/tool-models/ocr/README.md
 * 방식은 배경 편집 `lib/toolbox/background-editor/model.ts`와 같고, 파일 여러 개의 진행률을 합쳐 알린다.
 */

export interface ModelFile {
  url: string
  sha256: string
  bytes: number
}

export const OCR_MODEL_FILES = {
  det: {
    url: '/tool-models/ocr/ch_PP-OCRv4_det_mobile.onnx',
    sha256: 'd2a7720d45a54257208b1e13e36a8479894cb74155a5efe29462512d42f49da9',
    bytes: 4_745_517,
  },
  rec: {
    url: '/tool-models/ocr/korean_PP-OCRv5_mobile_rec.onnx',
    sha256: '322f140154c820fcb83c3d24cfe42c9ec70dd1a1834163306a7338136e4f1eaa',
    bytes: 13_401_252,
  },
  dict: {
    url: '/tool-models/ocr/ppocrv5_korean_dict.txt',
    sha256: 'a88071c68c01707489baa79ebe0405b7beb5cca229f4fc94cc3ef992328802d7',
    bytes: 47_451,
  },
} as const satisfies Record<string, ModelFile>

export type OcrModelKey = keyof typeof OCR_MODEL_FILES

/** 모델 전체 크기(안내 문구용) */
export const OCR_MODEL_TOTAL_BYTES = Object.values(OCR_MODEL_FILES).reduce((sum, f) => sum + f.bytes, 0)

/** 파일이 바뀌면 이름을 올린다(예전 캐시는 쓰지 않음) */
export const OCR_MODEL_CACHE_NAME = 'toolbox-ocr-model-v1'

export class OcrModelError extends Error {}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

async function openCache(): Promise<Cache | null> {
  try {
    return typeof caches === 'undefined' ? null : await caches.open(OCR_MODEL_CACHE_NAME)
  } catch {
    return null // 사생활 보호 모드 등 Cache Storage를 쓸 수 없는 환경 — 매번 내려받는다
  }
}

async function readBody(response: Response, expected: number, onChunk: (loaded: number) => void): Promise<Uint8Array> {
  const reader = response.body?.getReader()
  if (!reader) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    onChunk(bytes.length)
    return bytes
  }
  let buffer = new Uint8Array(expected)
  let loaded = 0
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
    onChunk(loaded)
  }
  return loaded === buffer.length ? buffer : buffer.slice(0, loaded)
}

async function loadFile(
  file: ModelFile,
  cache: Cache | null,
  signal: AbortSignal | undefined,
  onLoaded: (loaded: number) => void
): Promise<{ bytes: Uint8Array; fromCache: boolean }> {
  const cached = await cache?.match(file.url).catch(() => undefined)
  if (cached) {
    const bytes = new Uint8Array(await cached.arrayBuffer())
    if ((await sha256Hex(bytes)) === file.sha256) {
      onLoaded(file.bytes)
      return { bytes, fromCache: true }
    }
    await cache?.delete(file.url).catch(() => undefined)
  }

  let response: Response
  try {
    // cache: 'no-store'는 쓰지 않는다 — 붙는 Cache-Control·Pragma: no-cache 헤더를 개발망 앞단이 400으로 거부했다(2026-10-21)
    response = await fetch(file.url, { signal })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new OcrModelError('인식 모델을 내려받지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.')
  }
  if (!response.ok) throw new OcrModelError(`인식 모델을 내려받지 못했습니다(HTTP ${response.status}). 잠시 후 다시 시도해 주세요.`)
  let bytes: Uint8Array
  try {
    bytes = await readBody(response, file.bytes, onLoaded)
  } catch (e) {
    if (signal?.aborted) throw e
    throw new OcrModelError('내려받는 중 연결이 끊겼습니다. 다시 시도해 주세요.')
  }
  if ((await sha256Hex(bytes)) !== file.sha256) {
    throw new OcrModelError('내려받은 인식 모델 파일이 올바르지 않습니다. 새로고침한 뒤 다시 시도해 주세요.')
  }
  // 저장 공간 부족 등으로 실패해도 이번 사용에는 문제없다(다음에 다시 내려받는다)
  await cache
    ?.put(file.url, new Response(bytes as BodyInit, { headers: { 'Content-Type': 'application/octet-stream' } }))
    .catch(() => undefined)
  return { bytes, fromCache: false }
}

/** 감지·인식 모델과 사전을 함께 받는다. 진행률은 (받은 바이트, 전체 바이트) — 캐시에서 읽은 파일은 바로 다 받은 것으로 센다 */
export async function loadOcrModels(options: {
  signal?: AbortSignal
  onProgress?: (loaded: number, total: number) => void
}): Promise<{ det: Uint8Array; rec: Uint8Array; dict: string; fromCache: boolean }> {
  const { signal, onProgress } = options
  const cache = await openCache()
  const loaded: Record<OcrModelKey, number> = { det: 0, rec: 0, dict: 0 }
  const report = (key: OcrModelKey) => (bytes: number) => {
    loaded[key] = bytes
    onProgress?.(loaded.det + loaded.rec + loaded.dict, OCR_MODEL_TOTAL_BYTES)
  }
  const [det, rec, dict] = await Promise.all(
    (['det', 'rec', 'dict'] as const).map((key) => loadFile(OCR_MODEL_FILES[key], cache, signal, report(key)))
  )
  return {
    det: det.bytes,
    rec: rec.bytes,
    dict: new TextDecoder().decode(dict.bytes),
    fromCache: det.fromCache && rec.fromCache && dict.fromCache,
  }
}
