import type { Size } from '@/lib/toolbox/common/canvas'
import type { Rect } from './types'

/** 픽셀 데이터 일부 — 원본 이미지의 (originX, originY)에서 시작하는 RGBA(비곱셈) 조각 */
export interface PixelSource {
  data: Uint8ClampedArray
  width: number
  height: number
  originX: number
  originY: number
}

/**
 * 영역을 덮는 **셀 격자에 맞춘 범위**(이미지 안으로 제한).
 * 셀 격자는 이미지 왼쪽 위(0,0) 기준으로 고정이라, 영역 가장자리에서 잘리는 셀도 전체 셀 기준으로 평균을 낸다.
 */
export function alignedExtent(rect: Rect, cell: number, size: Size): Rect {
  const x = Math.floor(rect.x / cell) * cell
  const y = Math.floor(rect.y / cell) * cell
  const right = Math.min(size.width, Math.ceil((rect.x + rect.width) / cell) * cell)
  const bottom = Math.min(size.height, Math.ceil((rect.y + rect.height) / cell) * cell)
  return { x, y, width: right - x, height: bottom - y }
}

/**
 * 거친 픽셀 — 셀 평균색으로 채운 영역 크기의 RGBA를 돌려준다.
 * - 평균은 **알파 가중**(투명 픽셀이 색을 오염시키지 않음), 알파는 셀 평균 알파
 * - src는 alignedExtent 범위 이상을 덮어야 하고, originX·originY는 셀 크기의 배수여야 한다
 */
export function pixelateData(src: PixelSource, rect: Rect, cell: number): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(new ArrayBuffer(rect.width * rect.height * 4))
  const { data, width: sw, height: sh } = src
  const cols = Math.ceil(sw / cell)
  const rows = Math.ceil(sh / cell)
  const sums = new Float64Array(cols * 4)
  const counts = new Uint32Array(cols)
  const avg = new Uint8ClampedArray(cols * 4)

  // 영역(src 좌표 기준)이 걸친 셀 행만 처리
  const rx = rect.x - src.originX
  const ry = rect.y - src.originY
  const firstRow = Math.floor(ry / cell)
  const lastRow = Math.min(rows - 1, Math.floor((ry + rect.height - 1) / cell))

  for (let cy = firstRow; cy <= lastRow; cy++) {
    sums.fill(0)
    counts.fill(0)
    const y0 = cy * cell
    const y1 = Math.min(sh, y0 + cell)
    for (let y = y0; y < y1; y++) {
      let i = y * sw * 4
      for (let x = 0; x < sw; x++, i += 4) {
        const c = (x / cell) | 0
        const a = data[i + 3]
        const k = c * 4
        sums[k] += data[i] * a
        sums[k + 1] += data[i + 1] * a
        sums[k + 2] += data[i + 2] * a
        sums[k + 3] += a
        counts[c]++
      }
    }
    for (let c = 0; c < cols; c++) {
      const k = c * 4
      const alphaSum = sums[k + 3]
      if (alphaSum > 0) {
        avg[k] = sums[k] / alphaSum
        avg[k + 1] = sums[k + 1] / alphaSum
        avg[k + 2] = sums[k + 2] / alphaSum
      } else {
        avg[k] = avg[k + 1] = avg[k + 2] = 0
      }
      avg[k + 3] = counts[c] ? alphaSum / counts[c] : 0
    }
    const yStart = Math.max(y0, ry)
    const yEnd = Math.min(y1, ry + rect.height)
    for (let y = yStart; y < yEnd; y++) {
      let oi = (y - ry) * rect.width * 4
      for (let x = rx; x < rx + rect.width; x++, oi += 4) {
        const k = ((x / cell) | 0) * 4
        out[oi] = avg[k]
        out[oi + 1] = avg[k + 1]
        out[oi + 2] = avg[k + 2]
        out[oi + 3] = avg[k + 3]
      }
    }
  }
  return out
}

// ---------- 부드러운 블러 ----------

/** 상자 흐림 반복 횟수(3회 ≈ 가우시안) */
export const BLUR_PASSES = 3

/** 블러를 한 번에 계산하는 작업 픽셀 수 상한 — 넘으면 줄인 해상도에서 흐린 뒤 다시 키운다(P0·P3 측정) */
export const BLUR_WORK_PIXELS = 400_000

/**
 * 블러 작업 해상도를 줄이는 배율(1·2·4·8).
 * 작업 넓이가 상한을 넘을 때만 줄이고, 줄인 뒤 반경이 1px 아래로 내려가지 않도록 배율은 반경을 넘지 않는다.
 * 작은 영역은 1(원본 해상도, 정밀 계산)이라 결과가 정확하다.
 */
export function blurScaleFor(radius: number, width: number, height: number): number {
  let f = 1
  while (f < 8 && f * 2 <= radius && (width / f) * (height / f) > BLUR_WORK_PIXELS) f *= 2
  return f
}

/**
 * 상자 흐림 한 번(가로 + 세로) — 가장자리는 끝 픽셀을 이어 붙여 계산. buf·tmp는 같은 크기의 premultiplied RGBA(Uint8).
 * 가로는 행마다 네 채널의 누적합을 한 번에 훑고, 세로는 행 단위로 열 누적합(colSums)을 갱신한다 —
 * 열 방향 접근(캐시 미스)을 없애 큰 영역에서 빠르다.
 */
function boxPass(buf: Uint8ClampedArray, tmp: Uint8ClampedArray, width: number, height: number, r: number) {
  const n = 2 * r + 1
  const half = n >> 1
  const clampX = (x: number) => (x < 0 ? 0 : x >= width ? width - 1 : x)
  const clampY = (y: number) => (y < 0 ? 0 : y >= height ? height - 1 : y)

  for (let y = 0; y < height; y++) {
    const row = y * width * 4
    let s0 = 0
    let s1 = 0
    let s2 = 0
    let s3 = 0
    for (let x = -r; x <= r; x++) {
      const i = row + clampX(x) * 4
      s0 += buf[i]
      s1 += buf[i + 1]
      s2 += buf[i + 2]
      s3 += buf[i + 3]
    }
    for (let x = 0; x < width; x++) {
      const o = row + x * 4
      tmp[o] = ((s0 + half) / n) | 0
      tmp[o + 1] = ((s1 + half) / n) | 0
      tmp[o + 2] = ((s2 + half) / n) | 0
      tmp[o + 3] = ((s3 + half) / n) | 0
      const add = row + clampX(x + r + 1) * 4
      const drop = row + clampX(x - r) * 4
      s0 += buf[add] - buf[drop]
      s1 += buf[add + 1] - buf[drop + 1]
      s2 += buf[add + 2] - buf[drop + 2]
      s3 += buf[add + 3] - buf[drop + 3]
    }
  }

  const rowLen = width * 4
  const colSums = new Int32Array(rowLen)
  for (let y = -r; y <= r; y++) {
    const src = clampY(y) * rowLen
    for (let i = 0; i < rowLen; i++) colSums[i] += tmp[src + i]
  }
  for (let y = 0; y < height; y++) {
    const out = y * rowLen
    for (let i = 0; i < rowLen; i++) buf[out + i] = ((colSums[i] + half) / n) | 0
    const add = clampY(y + r + 1) * rowLen
    const drop = clampY(y - r) * rowLen
    for (let i = 0; i < rowLen; i++) colSums[i] += tmp[add + i] - tmp[drop + i]
  }
}

/**
 * RGBA 이미지를 제자리에서 흐린다(상자 흐림 3회 ≈ 가우시안).
 * **알파 가중**: 색을 알파로 곱한(premultiplied) 값으로 흐린 뒤 되돌려, 투명한 픽셀의 색이 번지지 않는다.
 */
export function boxBlurRGBA(data: Uint8ClampedArray, width: number, height: number, radius: number, passes = BLUR_PASSES): void {
  const r = Math.max(0, Math.round(radius))
  if (r === 0 || width === 0 || height === 0) return
  const total = width * height * 4
  let hasAlpha = false
  for (let i = 3; i < total; i += 4) {
    const a = data[i]
    if (a < 255) {
      hasAlpha = true
      data[i - 3] = Math.round((data[i - 3] * a) / 255)
      data[i - 2] = Math.round((data[i - 2] * a) / 255)
      data[i - 1] = Math.round((data[i - 1] * a) / 255)
    }
  }
  const tmp = new Uint8ClampedArray(total)
  for (let p = 0; p < passes; p++) boxPass(data, tmp, width, height, r)
  if (!hasAlpha) {
    // 흐리기 전에 모두 불투명이었으면 알파는 255 그대로(반올림 오차 방지)
    for (let i = 3; i < total; i += 4) data[i] = 255
    return
  }
  for (let i = 3; i < total; i += 4) {
    const a = data[i]
    if (a > 0 && a < 255) {
      const k = 255 / a
      data[i - 3] = Math.min(255, Math.round(data[i - 3] * k))
      data[i - 2] = Math.min(255, Math.round(data[i - 2] * k))
      data[i - 1] = Math.min(255, Math.round(data[i - 1] * k))
    }
  }
}
