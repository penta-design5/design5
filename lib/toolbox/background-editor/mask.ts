/**
 * 배경 제거 전·후처리 — rembg(isnet-general-use)와 같은 계산.
 * - 입력: 모델 크기(1024²)로 줄인 RGBA → 최대값으로 나눈 뒤 0.5를 빼서 NCHW float32
 * - 출력: 전경 확률 맵을 min-max 정규화해 0~255 알파로
 * 순수 함수(DOM 없음) — 캔버스 처리는 cutout.ts
 */

/** RGBA 픽셀(가로×세로 = pixelCount) → 모델 입력 [1, 3, H, W] */
export function toInputTensor(rgba: Uint8ClampedArray, pixelCount: number): Float32Array {
  let max = 1e-6
  for (let i = 0; i < pixelCount * 4; i += 4) {
    const m = Math.max(rgba[i], rgba[i + 1], rgba[i + 2])
    if (m > max) max = m
  }
  const out = new Float32Array(3 * pixelCount)
  for (let p = 0; p < pixelCount; p++) {
    const i = p * 4
    out[p] = rgba[i] / max - 0.5
    out[pixelCount + p] = rgba[i + 1] / max - 0.5
    out[2 * pixelCount + p] = rgba[i + 2] / max - 0.5
  }
  return out
}

/** 전경 확률 맵 → 0~255 알파(min-max 정규화). 값이 모두 같으면 전부 0(전경 없음) */
export function toAlphaMask(prob: Float32Array): Uint8ClampedArray {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < prob.length; i++) {
    const v = prob[i]
    if (v < min) min = v
    if (v > max) max = v
  }
  const alpha = new Uint8ClampedArray(prob.length)
  const range = max - min
  if (!(range > 0)) return alpha
  for (let i = 0; i < prob.length; i++) alpha[i] = Math.round(((prob[i] - min) / range) * 255)
  return alpha
}
