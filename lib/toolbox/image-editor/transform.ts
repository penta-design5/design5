import { createCanvas, type Size } from '../common/canvas'

/**
 * 기하 변환(회전·반전·자르기). 리사이즈·크기 검증은 공용 lib/toolbox/common/canvas.ts. 모든 캔버스 함수는 원본을 건드리지 않고 새 캔버스를 반환한다.
 * P4 이후: 주석이 있으면 호출 전에 베이스에 합쳐야 한다(docs/TOOLBOX_image-editor_handoff.md 공통 설계 — flatten 규칙).
 */

const EPSILON = 1e-9

/** -180 < angle <= 180 로 정규화 */
export function normalizeAngle(angle: number): number {
  let a = angle % 360
  if (a > 180) a -= 360
  if (a <= -180) a += 360
  return a
}

/** 회전 후 이미지 전체를 담는 bounding box 크기 (90° 배수는 정확히 가로·세로 교환) */
export function rotatedBounds(width: number, height: number, angle: number): Size {
  const rad = (normalizeAngle(angle) * Math.PI) / 180
  let cos = Math.abs(Math.cos(rad))
  let sin = Math.abs(Math.sin(rad))
  if (cos < EPSILON) cos = 0
  if (sin < EPSILON) sin = 0
  return {
    width: Math.max(1, Math.ceil(width * cos + height * sin - 1e-6)),
    height: Math.max(1, Math.ceil(width * sin + height * cos - 1e-6)),
  }
}

// ---------- 캔버스 연산 ----------

/**
 * 회전. 캔버스는 bounding box로 확장되고, 빈 영역은 fill 색(null이면 투명)으로 채운다.
 * 90° 배수는 픽셀 격자에 정확히 맞아 화질 손실이 없다.
 */
export function rotateCanvas(source: HTMLCanvasElement, angle: number, fill: string | null = null): HTMLCanvasElement {
  const normalized = normalizeAngle(angle)
  const bounds = rotatedBounds(source.width, source.height, normalized)
  const { canvas, ctx } = createCanvas(bounds.width, bounds.height)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, bounds.width, bounds.height)
  }
  ctx.translate(bounds.width / 2, bounds.height / 2)
  ctx.rotate((normalized * Math.PI) / 180)
  ctx.drawImage(source, -source.width / 2, -source.height / 2)
  return canvas
}

export type FlipDirection = 'horizontal' | 'vertical'

export function flipCanvas(source: HTMLCanvasElement, direction: FlipDirection): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(source.width, source.height)
  if (direction === 'horizontal') {
    ctx.translate(source.width, 0)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(0, source.height)
    ctx.scale(1, -1)
  }
  ctx.drawImage(source, 0, 0)
  return canvas
}

/** 자르기. rect는 원본 px 좌표(정수, 이미지 안) — `clampCropRect`를 거친 값을 넘긴다 */
export function cropCanvas(
  source: HTMLCanvasElement,
  rect: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(rect.width, rect.height)
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
  return canvas
}
