/**
 * 경계 다듬기 — 순수 함수(DOM 없음).
 * - 부드럽게: 알파 마스크(모델 해상도 1024²)를 흐려 경계를 부드럽게
 * - 색 번짐 줄이기: 반투명 경계 픽셀에 남은 배경색을, 가까운 불투명 전경 픽셀의 평균색 쪽으로 옮긴다(색 오염 제거)
 */

export interface EdgeSettings {
  /** 부드럽게 0~100(%) */
  feather: number
  /** 색 번짐 줄이기 0~100(%) */
  defringe: number
}

export const DEFAULT_EDGE: EdgeSettings = { feather: 0, defringe: 0 }

/** 부드럽게 100%일 때 마스크 흐림 반경(모델 해상도 1024 기준 px) */
export const MAX_FEATHER_RADIUS = 6

/** 이 값 이상인 알파를 「불투명 전경」으로 보고 색 기준으로 쓴다 */
const SOLID_ALPHA = 250

/** 부드럽게(%) → 마스크 흐림 반경(px) */
export function featherRadius(feather: number): number {
  return Math.round((Math.min(100, Math.max(0, feather)) / 100) * MAX_FEATHER_RADIUS)
}

/**
 * 색 번짐 기준색을 모으는 반경(원본 px) — 마스크를 원본 크기로 늘린 배율에 비례한다(경계 띠 두께가 배율만큼 넓어지므로).
 * 1024px 이하 이미지는 최소 3px.
 */
export function defringeRadius(width: number, height: number): number {
  return Math.max(3, Math.round((Math.max(width, height) / 1024) * 6))
}

/**
 * 한 방향 상자 흐림(running sum, 가장자리는 끝값 반복). src → dst, 길이 = width × height.
 * 반경과 무관하게 픽셀당 상수 시간이다.
 */
function boxBlurPass(src: Float32Array, dst: Float32Array, width: number, height: number, r: number, horizontal: boolean) {
  const lines = horizontal ? height : width
  const len = horizontal ? width : height
  const stride = horizontal ? 1 : width
  const lineStep = horizontal ? width : 1
  const inv = 1 / (2 * r + 1)
  for (let line = 0; line < lines; line++) {
    const base = line * lineStep
    const last = base + (len - 1) * stride
    let sum = 0
    for (let i = -r; i <= r; i++) sum += src[base + Math.min(len - 1, Math.max(0, i)) * stride]
    let out = base
    for (let i = 0; i < len; i++) {
      dst[out] = sum * inv
      out += stride
      const add = i + r + 1 < len ? base + (i + r + 1) * stride : last
      const sub = i - r > 0 ? base + (i - r) * stride : base
      sum += src[add] - src[sub]
    }
  }
}

/** 상자 흐림 2회(가로·세로) × passes — 2회면 삼각형, 3회면 가우스에 가깝다. 원본은 그대로 두고 새 배열을 돌려준다 */
export function boxBlur(values: Float32Array, width: number, height: number, r: number, passes = 2): Float32Array {
  if (r <= 0) return values.slice()
  const a = values.slice()
  const b = new Float32Array(values.length)
  for (let p = 0; p < passes; p++) {
    boxBlurPass(a, b, width, height, r, true)
    boxBlurPass(b, a, width, height, r, false)
  }
  return a
}

/** 알파 마스크 흐림(부드럽게). 반경 0이면 그대로 */
export function featherMask(alpha: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return alpha
  const blurred = boxBlur(Float32Array.from(alpha), width, height, radius, 3)
  return Uint8ClampedArray.from(blurred, (v) => Math.round(v))
}

/**
 * 색 번짐 줄이기 — RGBA(원본 해상도, 직선 알파)를 제자리에서 고친다.
 * 배경색은 반투명 픽셀뿐 아니라 경계 바로 안쪽의 거의 불투명한 픽셀에도 묻어 있다(예: 고양이 귀 끝의 빨간 테두리).
 * 그래서 「경계 띠」를 알파가 아니라 주변 알파 평균(반경 radius)으로 정한다.
 * - 안쪽: 주변이 모두 불투명(평균 ≥ 250) → 색 기준(전경색)으로만 쓴다.
 * - 경계 띠: 그 밖의 보이는 픽셀 → 반경 2×radius 안 안쪽 픽셀의 평균색 쪽으로 섞는다. 바깥(투명 쪽)일수록 많이 섞는다.
 * strength 0~1. 알파는 바꾸지 않는다. 근처에 안쪽 픽셀이 없으면(얇은 털 끝 등) 그대로 둔다.
 *
 * 속도: 주변 알파·전경 평균색은 넓은 범위의 평균이라 **작업 해상도(긴 변 ≤ 1024, k×k 칸 평균)** 에서 구하고,
 * 원본 해상도에서는 경계 띠 픽셀만 그 값을 겹선형 보간해 섞는다(약 1,400만 px 이미지 3.2초 → 수백 ms).
 */
export const DEFRINGE_WORK_SIDE = 1024

export function decontaminateColors(rgba: Uint8ClampedArray, width: number, height: number, strength: number, radius: number) {
  if (strength <= 0) return
  const k = Math.max(1, Math.ceil(Math.max(width, height) / DEFRINGE_WORK_SIDE))
  const lw = Math.ceil(width / k)
  const lh = Math.ceil(height / k)
  const ln = lw * lh
  const lr = Math.max(1, Math.round(radius / k))

  // 칸별 알파 평균, 불투명 픽셀 수·색 합
  const alphaLow = new Float32Array(ln)
  const count = new Float32Array(ln)
  const solid = new Float32Array(ln)
  const rSum = new Float32Array(ln)
  const gSum = new Float32Array(ln)
  const bSum = new Float32Array(ln)
  let visible = 0
  for (let y = 0; y < height; y++) {
    const row = ((y / k) | 0) * lw
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4
      const a = rgba[p + 3]
      const c = row + ((x / k) | 0)
      alphaLow[c] += a
      count[c]++
      if (a > 0) visible++
      if (a >= SOLID_ALPHA) {
        solid[c]++
        rSum[c] += rgba[p]
        gSum[c] += rgba[p + 1]
        bSum[c] += rgba[p + 2]
      }
    }
  }
  if (visible === 0) return
  for (let c = 0; c < ln; c++) alphaLow[c] /= count[c]
  const around = boxBlur(alphaLow, lw, lh, lr, 1)

  // 안쪽 칸(주변이 모두 불투명)의 불투명 픽셀 색만 기준으로 모은다
  for (let c = 0; c < ln; c++) {
    if (around[c] < SOLID_ALPHA) {
      solid[c] = 0
      rSum[c] = 0
      gSum[c] = 0
      bSum[c] = 0
    }
  }
  const colorRadius = lr * 2
  const w = boxBlur(solid, lw, lh, colorRadius)
  const rs = boxBlur(rSum, lw, lh, colorRadius)
  const gs = boxBlur(gSum, lw, lh, colorRadius)
  const bs = boxBlur(bSum, lw, lh, colorRadius)

  /** 작업 해상도 배열을 원본 좌표(x, y)에서 겹선형 보간 — 칸 가운데를 기준점으로 */
  const sampler = (fx: number, fy: number) => {
    const x0 = Math.min(lw - 1, Math.max(0, Math.floor(fx)))
    const y0 = Math.min(lh - 1, Math.max(0, Math.floor(fy)))
    const x1 = Math.min(lw - 1, x0 + 1)
    const y1 = Math.min(lh - 1, y0 + 1)
    const tx = Math.min(1, Math.max(0, fx - x0))
    const ty = Math.min(1, Math.max(0, fy - y0))
    const i00 = y0 * lw + x0
    const i10 = y0 * lw + x1
    const i01 = y1 * lw + x0
    const i11 = y1 * lw + x1
    return (arr: Float32Array) =>
      (arr[i00] * (1 - tx) + arr[i10] * tx) * (1 - ty) + (arr[i01] * (1 - tx) + arr[i11] * tx) * ty
  }

  for (let y = 0; y < height; y++) {
    const cy = (y / k) | 0
    const fy = (y + 0.5) / k - 0.5
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4
      const a = rgba[p + 3]
      if (a === 0) continue
      // 안쪽 픽셀은 빠르게 건너뛴다(가장 가까운 칸 기준)
      if (a >= SOLID_ALPHA && around[cy * lw + ((x / k) | 0)] >= SOLID_ALPHA) continue
      const at = sampler((x + 0.5) / k - 0.5, fy)
      const wv = at(w)
      if (wv < 1e-3) continue
      // 경계에서 바깥쪽일수록(주변 알파가 낮을수록) 배경색이 많이 섞여 있다
      const outside = 1 - Math.min(at(around), a) / 255
      const t = Math.min(1, strength * Math.min(1, 1.5 * Math.sqrt(Math.max(0, outside))))
      if (t <= 0) continue
      rgba[p] = rgba[p] + (at(rs) / wv - rgba[p]) * t
      rgba[p + 1] = rgba[p + 1] + (at(gs) / wv - rgba[p + 1]) * t
      rgba[p + 2] = rgba[p + 2] + (at(bs) / wv - rgba[p + 2]) * t
    }
  }
}
