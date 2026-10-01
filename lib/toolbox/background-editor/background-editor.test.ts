import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { toAlphaMask, toInputTensor } from './mask'
import { CEIL_MODE_PATTERN, EXPECTED_CEIL_MODE_COUNT, MODEL, ORT_VERSION, patchCeilMode, sha256Hex } from './model'

const pkg = (p: string) => JSON.parse(readFileSync(join(process.cwd(), p), 'utf8'))

describe('model constants', () => {
  it('CDN wasm 버전이 설치된 onnxruntime-web과 같다(다르면 JS·wasm 불일치로 로드 실패)', () => {
    expect(pkg('package.json').dependencies['onnxruntime-web']).toBe(ORT_VERSION)
    expect(pkg('node_modules/onnxruntime-web/package.json').version).toBe(ORT_VERSION)
  })

  it('모델 URL은 커밋 해시로 고정돼 있다', () => {
    expect(MODEL.url).toMatch(/\/resolve\/[0-9a-f]{40}\//)
    expect(MODEL.sha256).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('patchCeilMode', () => {
  const attribute = Uint8Array.from(CEIL_MODE_PATTERN)

  it('ceil_mode=1 속성만 0으로 바꾸고 길이는 그대로', () => {
    const bytes = new Uint8Array([1, 2, ...attribute, 9, ...attribute, 0x0a, 0x09, 7])
    const before = bytes.length
    expect(patchCeilMode(bytes)).toBe(2)
    expect(bytes.length).toBe(before)
    // 값 바이트(0x18 다음)만 0
    const expected = Array.from(attribute)
    expected[12] = 0
    expect(Array.from(bytes.subarray(2, 2 + attribute.length))).toEqual(expected)
    expect(Array.from(bytes.slice(-3))).toEqual([0x0a, 0x09, 7])
  })

  it('이미 0이거나 다른 속성이면 바꾸지 않는다', () => {
    const zero = Array.from(attribute)
    zero[12] = 0
    const other = Array.from(attribute)
    other[3] = 0x41
    const bytes = new Uint8Array([...zero, ...other])
    const copy = bytes.slice()
    expect(patchCeilMode(bytes)).toBe(0)
    expect(bytes).toEqual(copy)
  })

  it('패턴이 배열 끝에 걸쳐도 안전', () => {
    expect(patchCeilMode(attribute.slice(0, 10))).toBe(0)
    expect(patchCeilMode(attribute.slice())).toBe(1)
  })

  it('모델 기대 개수는 33', () => {
    expect(EXPECTED_CEIL_MODE_COUNT).toBe(33)
  })
})

describe('sha256Hex', () => {
  it('알려진 값', async () => {
    expect(await sha256Hex(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })
})

describe('toInputTensor', () => {
  it('최대값으로 나눈 뒤 0.5를 빼고 채널별(NCHW)로 나눈다', () => {
    // 2픽셀: (200, 100, 0) (50, 0, 100) — 최대 200
    const rgba = new Uint8ClampedArray([200, 100, 0, 255, 50, 0, 100, 128])
    const t = toInputTensor(rgba, 2)
    expect(Array.from(t)).toEqual([0.5, -0.25, 0, -0.5, -0.5, 0])
  })

  it('전부 검은 이미지도 0으로 나누지 않는다', () => {
    const t = toInputTensor(new Uint8ClampedArray(8), 2)
    expect(Array.from(t).every((v) => v === -0.5)).toBe(true)
  })
})

describe('toAlphaMask', () => {
  it('min-max 정규화 → 0~255', () => {
    expect(Array.from(toAlphaMask(new Float32Array([-1, 0, 3])))).toEqual([0, 64, 255])
  })

  it('값이 모두 같으면 전부 0', () => {
    expect(Array.from(toAlphaMask(new Float32Array([0.7, 0.7])))).toEqual([0, 0])
  })
})
