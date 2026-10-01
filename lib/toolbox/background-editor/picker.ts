/**
 * 스포이드 색 제거(P4-2) — 순수 함수(DOM 없음).
 * 원본에서 클릭한 곳의 색과 비슷한 색을 지운다. 색 거리는 RGB보다 사람 눈의 차이에 가까운 Lab(CIE76 ΔE)이다.
 * - 이어진 영역만(contiguous): 클릭한 곳에서 이어진(상하좌우) 비슷한 색만 — 대상 안의 같은 색은 지키기 쉽다
 * - 이미지 전체(global): 떨어져 있는 같은 색 조각까지 한 번에
 * 범위는 원본 색만으로 정한다(현재 결과의 알파와 무관) → 같은 설정이면 언제 다시 그려도 결과가 같다.
 */

export type PickRange = 'contiguous' | 'global'

export interface PickOptions {
  range: PickRange
  /** 허용 범위 0~100 — ΔE 기준 거리 */
  tolerance: number
}

export const DEFAULT_PICK: PickOptions = { range: 'contiguous', tolerance: 30 }

/** 허용 범위 중 이 비율 안쪽은 완전히 지우고, 그 바깥은 기준 거리까지 서서히 덜 지운다(경계가 계단처럼 보이지 않게) */
const SOLID_RATIO = 0.5

/** 완전히 지운 픽셀 둘레를 이만큼(px) 더 지운다 — 다른 색과 섞인 테두리 픽셀 정리 */
const EDGE_GROW = 1

export type Lab = [number, number, number]
export type RGB = [number, number, number]

const SRGB_TO_LINEAR = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const c = i / 255
  SRGB_TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const labF = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)

/** sRGB(0~255) → CIE Lab(D65) */
export function rgbToLab(r: number, g: number, b: number): Lab {
  const lr = SRGB_TO_LINEAR[r]
  const lg = SRGB_TO_LINEAR[g]
  const lb = SRGB_TO_LINEAR[b]
  const x = labF((lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047)
  const y = labF(lr * 0.2126 + lg * 0.7152 + lb * 0.0722)
  const z = labF((lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

/** 클릭한 곳 주변 (2r+1)² 픽셀의 평균색(이미지 안만) — 한 픽셀 잡음에 덜 흔들리게 */
export function sampleColor(rgba: Uint8ClampedArray, width: number, height: number, x: number, y: number, r = 1): RGB {
  let sr = 0
  let sg = 0
  let sb = 0
  let n = 0
  for (let yy = Math.max(0, y - r); yy <= Math.min(height - 1, y + r); yy++) {
    for (let xx = Math.max(0, x - r); xx <= Math.min(width - 1, x + r); xx++) {
      const p = (yy * width + xx) * 4
      sr += rgba[p]
      sg += rgba[p + 1]
      sb += rgba[p + 2]
      n++
    }
  }
  return n ? [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)] : [0, 0, 0]
}

/** 허용 범위(0~100) → 지울 정도 계산기(ΔE → 0~255). 기준 거리는 최소 1 */
function weightOf(tolerance: number) {
  const limit = Math.max(1, Math.min(100, tolerance))
  const solid = limit * SOLID_RATIO
  return (de: number) => (de >= limit ? 0 : de <= solid ? 255 : Math.round((255 * (limit - de)) / (limit - solid)))
}

/**
 * 비슷한 색의 「지울 정도」를 out 알파 채널(RGBA 버퍼, 원본 크기, 빈 버퍼)에 **최댓값으로** 기록한다.
 * 완전히 지운 픽셀 둘레 1px도 함께 지운다(섞인 테두리 픽셀).
 * rgba: 원본 RGBA. 바뀐 영역을 돌려주며, 지울 곳이 없으면 null.
 * 같은 색은 다시 계산하지 않도록 색별 결과를 기억한다.
 */
export function pickColorMask(
  rgba: Uint8ClampedArray,
  out: Uint8ClampedArray,
  width: number,
  height: number,
  seed: { x: number; y: number },
  color: RGB,
  options: PickOptions
): { x: number; y: number; width: number; height: number } | null {
  const [L0, a0, b0] = rgbToLab(color[0], color[1], color[2])
  const weight = weightOf(options.tolerance)
  const cache = new Map<number, number>()
  const weightAt = (p: number) => {
    const key = (rgba[p] << 16) | (rgba[p + 1] << 8) | rgba[p + 2]
    let w = cache.get(key)
    if (w === undefined) {
      const [L, a, b] = rgbToLab(rgba[p], rgba[p + 1], rgba[p + 2])
      w = weight(Math.sqrt((L - L0) ** 2 + (a - a0) ** 2 + (b - b0) ** 2))
      cache.set(key, w)
    }
    return w
  }

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  const mark = (i: number, w: number) => {
    const ai = i * 4 + 3
    if (w > out[ai]) out[ai] = w
    const x = i % width
    const y = (i / width) | 0
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  if (options.range === 'global') {
    for (let i = 0, n = width * height; i < n; i++) {
      const w = weightAt(i * 4)
      if (w > 0) mark(i, w)
    }
  } else {
    const sx = Math.min(width - 1, Math.max(0, Math.round(seed.x)))
    const sy = Math.min(height - 1, Math.max(0, Math.round(seed.y)))
    // 비슷한 색(지울 정도 > 0)을 따라 상하좌우로 퍼진다
    const visited = new Uint8Array(width * height)
    const stack = new Int32Array(width * height)
    let top = 0
    const visit = (j: number) => {
      if (visited[j]) return
      visited[j] = 1
      stack[top++] = j
    }
    visit(sy * width + sx)
    while (top > 0) {
      const i = stack[--top]
      const w = weightAt(i * 4)
      if (w === 0) continue
      mark(i, w)
      const x = i % width
      if (x > 0) visit(i - 1)
      if (x < width - 1) visit(i + 1)
      if (i >= width) visit(i - width)
      if (i < width * (height - 1)) visit(i + width)
    }
  }
  if (maxX < 0) return null

  // 가장자리 1px 함께 지우기 — 다른 색과 섞인 안티에일리어싱 테두리 픽셀은 색 거리가 멀어 남기 쉽다.
  // 완전히 지운 픽셀(255)의 상하좌우·대각선 이웃을 지운다. out은 스포이드마다 빈 버퍼로 받으므로 255는 이번 결과다.
  const bw = maxX - minX + 1
  const bh = maxY - minY + 1
  const solid = new Uint8Array(bw * bh)
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const i = (minY + y) * width + minX + x
      if (out[i * 4 + 3] === 255) solid[y * bw + x] = 1
    }
  }
  const gx0 = Math.max(0, minX - EDGE_GROW)
  const gy0 = Math.max(0, minY - EDGE_GROW)
  const gx1 = Math.min(width - 1, maxX + EDGE_GROW)
  const gy1 = Math.min(height - 1, maxY + EDGE_GROW)
  const grown: number[] = []
  for (let y = gy0; y <= gy1; y++) {
    for (let x = gx0; x <= gx1; x++) {
      const ai = (y * width + x) * 4 + 3
      if (out[ai] === 255) continue
      let near = false
      for (let dy = -EDGE_GROW; dy <= EDGE_GROW && !near; dy++) {
        const sy = y + dy - minY
        if (sy < 0 || sy >= bh) continue
        for (let dx = -EDGE_GROW; dx <= EDGE_GROW; dx++) {
          const sx = x + dx - minX
          if (sx >= 0 && sx < bw && solid[sy * bw + sx]) {
            near = true
            break
          }
        }
      }
      if (near) grown.push(ai)
    }
  }
  for (const ai of grown) out[ai] = 255
  if (grown.length === 0) return { x: minX, y: minY, width: bw, height: bh }
  return { x: gx0, y: gy0, width: gx1 - gx0 + 1, height: gy1 - gy0 + 1 }
}
