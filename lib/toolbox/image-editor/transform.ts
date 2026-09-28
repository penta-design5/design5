import { MAX_PIXELS } from './constants'

/**
 * 기하 변환(회전·반전·리사이즈). 모든 캔버스 함수는 원본을 건드리지 않고 새 캔버스를 반환한다.
 * P4 이후: 주석이 있으면 호출 전에 베이스에 합쳐야 한다(docs/TOOLBOX_handoff.md 공통 설계 — flatten 규칙).
 */

/** 캔버스 한 변 최대 길이 (브라우저 공통 안전 범위) */
export const MAX_SIDE = 16384

export interface Size {
  width: number
  height: number
}

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

/** 결과 크기 검증. 문제가 없으면 null, 있으면 사용자 안내 메시지 */
export function validateOutputSize({ width, height }: Size): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return '너비와 높이는 1px 이상이어야 합니다.'
  }
  if (width > MAX_SIDE || height > MAX_SIDE) {
    return `한 변의 길이는 ${MAX_SIDE.toLocaleString()}px 이하여야 합니다.`
  }
  if (width * height > MAX_PIXELS) {
    return '결과 이미지가 약 1,670만 픽셀(예: 4096×4096)을 넘습니다. 크기를 줄여 주세요.'
  }
  return null
}

// ---------- 리사이즈 입력 계산 ----------

export type ResizeUnit = 'px' | 'percent'

/** 입력값(px 또는 %)을 실제 픽셀 크기로 */
export function resolveResize(original: Size, unit: ResizeUnit, width: number, height: number): Size {
  if (unit === 'percent') {
    return {
      width: Math.round((original.width * width) / 100),
      height: Math.round((original.height * height) / 100),
    }
  }
  return { width: Math.round(width), height: Math.round(height) }
}

/** 비율 유지 시, 한쪽 입력이 바뀌면 다른 쪽 값을 계산 */
export function linkedDimension(
  original: Size,
  unit: ResizeUnit,
  changed: 'width' | 'height',
  value: number
): number {
  if (unit === 'percent') return value
  const ratio = changed === 'width' ? original.height / original.width : original.width / original.height
  return Math.max(1, Math.round(value * ratio))
}

// ---------- 캔버스 연산 ----------

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('브라우저에서 캔버스를 사용할 수 없습니다.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx }
}

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

/**
 * 고품질 리사이즈. 크게 줄일 때는 절반씩 단계적으로 줄여 계단 현상·뭉개짐을 줄인다.
 */
export function resizeCanvas(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  let current = source
  while (current.width / 2 >= width && current.height / 2 >= height) {
    const half = createCanvas(Math.max(width, Math.floor(current.width / 2)), Math.max(height, Math.floor(current.height / 2)))
    half.ctx.drawImage(current, 0, 0, half.canvas.width, half.canvas.height)
    current = half.canvas
  }
  const { canvas, ctx } = createCanvas(width, height)
  ctx.drawImage(current, 0, 0, width, height)
  return canvas
}
