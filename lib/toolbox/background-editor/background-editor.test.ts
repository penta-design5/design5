import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_BACKGROUND, fitRect, hasBackground } from './compose'
import { toAlphaMask, toInputTensor } from './mask'
import { MAX_FEATHER_RADIUS, boxBlur, decontaminateColors, defringeRadius, featherMask, featherRadius } from './refine'
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

describe('fitRect', () => {
  it('꽉 채우기: 대상 전체를 덮고 가운데 정렬(넘치는 쪽이 음수 위치)', () => {
    // 가로로 긴 배경(200×100)을 정사각(100×100)에 → 높이 맞춤 200×100, 좌우 50씩 잘림
    expect(fitRect({ width: 200, height: 100 }, { width: 100, height: 100 }, 'cover')).toEqual({ x: -50, y: 0, width: 200, height: 100 })
  })

  it('맞추기: 전체가 들어가고 남는 쪽 여백', () => {
    expect(fitRect({ width: 200, height: 100 }, { width: 100, height: 100 }, 'contain')).toEqual({ x: 0, y: 25, width: 100, height: 50 })
  })

  it('작은 배경도 비율을 유지해 키운다', () => {
    expect(fitRect({ width: 10, height: 20 }, { width: 100, height: 100 }, 'cover')).toEqual({ x: 0, y: -50, width: 100, height: 200 })
  })
})

describe('hasBackground', () => {
  it('투명·이미지 미선택은 배경 없음, 단색·이미지 선택은 있음', () => {
    expect(hasBackground(DEFAULT_BACKGROUND)).toBe(false)
    expect(hasBackground({ ...DEFAULT_BACKGROUND, kind: 'image' })).toBe(false)
    expect(hasBackground({ ...DEFAULT_BACKGROUND, kind: 'color' })).toBe(true)
    expect(hasBackground({ ...DEFAULT_BACKGROUND, kind: 'image', image: {} as HTMLCanvasElement })).toBe(true)
  })
})

describe('경계 다듬기', () => {
  it('featherRadius: 0~100% → 0~MAX, 범위 밖은 자름', () => {
    expect(featherRadius(0)).toBe(0)
    expect(featherRadius(50)).toBe(Math.round(MAX_FEATHER_RADIUS / 2))
    expect(featherRadius(100)).toBe(MAX_FEATHER_RADIUS)
    expect(featherRadius(150)).toBe(MAX_FEATHER_RADIUS)
    expect(featherRadius(-5)).toBe(0)
  })

  it('defringeRadius: 큰 이미지일수록 넓게, 최소 3', () => {
    expect(defringeRadius(400, 300)).toBe(3)
    expect(defringeRadius(1024, 768)).toBe(6)
    expect(defringeRadius(4096, 2048)).toBe(24)
  })

  it('boxBlur: 합(밝기 총량)을 보존하고 계단을 완만하게, 원본은 그대로', () => {
    const v = new Float32Array([0, 0, 0, 10, 10, 10])
    const out = boxBlur(v, 6, 1, 1)
    expect(Array.from(v)).toEqual([0, 0, 0, 10, 10, 10])
    expect(out[2]).toBeGreaterThan(0)
    expect(out[3]).toBeLessThan(10)
    expect(out[0]).toBeCloseTo(0)
    expect(out[5]).toBeCloseTo(10)
  })

  it('featherMask: 반경 0이면 같은 배열, 반경이 있으면 경계에 중간 알파', () => {
    const a = new Uint8ClampedArray([0, 0, 255, 255])
    expect(featherMask(a, 4, 1, 0)).toBe(a)
    const f = featherMask(a, 4, 1, 1)
    expect(f[1]).toBeGreaterThan(0)
    expect(f[2]).toBeLessThan(255)
  })

  it('decontaminateColors: 경계 띠(반투명 + 경계 바로 안쪽 불투명)의 배경색을 안쪽 전경색 쪽으로, 안쪽·투명 픽셀은 그대로', () => {
    // 가로 8픽셀: 안쪽 전경(파랑) ×5 | 경계 안쪽 불투명이지만 빨강이 묻음 | 반투명 빨강(알파 64) | 투명
    const px = [...Array(5).fill([0, 0, 255, 255]), [255, 0, 0, 255], [255, 0, 0, 64], [9, 9, 9, 0]].flat()
    const rgba = new Uint8ClampedArray(px)
    decontaminateColors(rgba, 8, 1, 1, 1)
    expect(Array.from(rgba.slice(0, 16))).toEqual(px.slice(0, 16)) // 안쪽 전경 그대로
    expect(Array.from(rgba.slice(28))).toEqual([9, 9, 9, 0]) // 투명 그대로
    expect(rgba[20]).toBeLessThan(255) // 경계 안쪽 불투명 픽셀의 빨강도 줄고
    expect(rgba[24]).toBeLessThan(128) // 반투명 경계는 더 많이 줄고
    expect(rgba[26]).toBeGreaterThan(128) // 파랑 쪽으로
    expect(rgba[23]).toBe(255) // 알파는 그대로
    expect(rgba[27]).toBe(64)
  })

  it('decontaminateColors: 강도 0이면 변화 없음', () => {
    const rgba = new Uint8ClampedArray([0, 0, 255, 255, 255, 0, 0, 64])
    const copy = rgba.slice()
    decontaminateColors(rgba, 2, 1, 0, 1)
    expect(rgba).toEqual(copy)
  })
})

describe('decontaminateColors — 큰 이미지(작업 해상도)', () => {
  it('긴 변이 1024를 넘어도 경계 띠만 고치고 안쪽·투명·알파는 그대로', () => {
    // 2100×4: 왼쪽 2044px 안쪽 파랑, 2044~2049 빨강이 묻은 불투명 경계(6px), 2050~2059 반투명 빨강, 나머지 투명
    const W = 2100, H = 4
    const rgba = new Uint8ClampedArray(W * H * 4)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = (y * W + x) * 4
        if (x < 2044) rgba.set([0, 0, 255, 255], p)
        else if (x < 2050) rgba.set([255, 0, 0, 255], p)
        else if (x < 2060) rgba.set([255, 0, 0, 64], p)
      }
    const before = rgba.slice()
    decontaminateColors(rgba, W, H, 1, defringeRadius(W, H))
    const px = (x: number) => Array.from(rgba.slice(x * 4, x * 4 + 4))
    expect(px(100)).toEqual(Array.from(before.slice(400, 404))) // 안쪽
    expect(px(2090)).toEqual([0, 0, 0, 0]) // 투명
    expect(px(2055)[0]).toBeLessThan(128) // 반투명 경계 빨강 감소
    expect(px(2055)[2]).toBeGreaterThan(128) // 파랑 쪽으로
    expect(px(2055)[3]).toBe(64)
    expect(px(2049)[0]).toBeLessThan(255) // 경계 바로 안쪽 불투명 빨강도 감소
  })
})
