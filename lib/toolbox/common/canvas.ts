import { MAX_PIXELS } from './constants'

/**
 * 공용 캔버스 유틸 — 크기 검증·리사이즈 입력 계산·캔버스 생성·고품질 리사이즈.
 * 모든 캔버스 함수는 원본을 건드리지 않고 새 캔버스를 반환한다(이미지 편집 히스토리의 불변 규칙).
 */

/** 캔버스 한 변 최대 길이 (브라우저 공통 안전 범위) */
export const MAX_SIDE = 16384

export interface Size {
  width: number
  height: number
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

export function createCanvas(width: number, height: number) {
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
