import { MAX_SIDE, resizeCanvas, validateOutputSize } from '@/lib/toolbox/common/canvas'
import { isKnocked, logoPlacement } from './logo'
import { isDark, type QrMatrix } from './matrix'

export interface QrLayout {
  /** 여백 포함 한 변의 모듈 수 */
  total: number
  /** 모듈 한 칸의 px(정수 — 가장자리가 번지지 않게) */
  moduleSize: number
  /** QR 본체(여백 제외) 시작 좌표 — 남는 픽셀은 양쪽 여백으로 나눈다 */
  offset: number
}

/**
 * 요청 크기 안에서 모듈을 정수 px로 맞춘다. 크기가 모듈 수로 나누어 떨어지지 않으면
 * 캔버스는 요청 크기 그대로 두고 남는 픽셀을 여백(배경색)에 더한다.
 * 모듈이 1px도 안 되면 null.
 */
export function computeLayout(moduleCount: number, size: number, margin: number): QrLayout | null {
  const total = moduleCount + margin * 2
  const moduleSize = Math.floor(size / total)
  if (moduleSize < 1) return null
  return { total, moduleSize, offset: Math.floor((size - moduleCount * moduleSize) / 2) }
}

/** 형식별 저장 크기 검증. SVG는 벡터라 모듈 정수 배·픽셀 수 제약이 없어 정수·한 변 상한만 본다. */
export function qrOutputSizeError(format: 'png' | 'svg', moduleCount: number, size: number, margin: number): string | null {
  if (format === 'png') return qrSizeError(moduleCount, size, margin)
  if (!Number.isInteger(size) || size < 1) return '크기를 1 이상의 정수(px)로 입력해 주세요.'
  if (size > MAX_SIDE) return `한 변의 길이는 ${MAX_SIDE.toLocaleString()}px 이하여야 합니다.`
  return null
}

/** 이 QR을 만들 수 있는 최소 한 변(px) */
export const minQrSize = (moduleCount: number, margin: number) => moduleCount + margin * 2

export interface QrPaint {
  fg: string
  /** null = 투명 배경 */
  bg: string | null
}

/** 중앙 로고(그리기용) — `percent`는 QR 본체 한 변 대비 % */
export interface QrLogo {
  source: HTMLCanvasElement
  percent: number
}

/** 저장 크기 입력 검증 → 안내 문구(문제 없으면 null) */
export function qrSizeError(moduleCount: number, size: number, margin: number): string | null {
  if (!Number.isInteger(size)) return '크기를 정수(px)로 입력해 주세요.'
  const tooLarge = validateOutputSize({ width: size, height: size })
  if (tooLarge) return tooLarge
  if (!computeLayout(moduleCount, size, margin)) {
    return `이 QR 코드는 최소 ${minQrSize(moduleCount, margin)}px 이상이어야 합니다.`
  }
  return null
}

/** 행렬을 캔버스에 그린다(어두운 모듈의 가로 연속 구간을 한 번에 칠한다). 캔버스 크기는 `size`. */
export function drawQr(
  canvas: HTMLCanvasElement,
  matrix: QrMatrix,
  layout: QrLayout,
  size: number,
  paint: QrPaint,
  logo?: QrLogo | null
) {
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('브라우저에서 캔버스를 사용할 수 없습니다.')

  ctx.clearRect(0, 0, size, size)
  if (paint.bg) {
    ctx.fillStyle = paint.bg
    ctx.fillRect(0, 0, size, size)
  }
  ctx.fillStyle = paint.fg

  const { moduleSize, offset } = layout
  const placement = logo ? logoPlacement(matrix.size, logo.percent) : null
  for (let row = 0; row < matrix.size; row++) {
    let runStart = -1
    for (let col = 0; col <= matrix.size; col++) {
      const dark = col < matrix.size && isDark(matrix, row, col) && !(placement && isKnocked(placement, row, col))
      if (dark && runStart < 0) runStart = col
      if (!dark && runStart >= 0) {
        ctx.fillRect(offset + runStart * moduleSize, offset + row * moduleSize, (col - runStart) * moduleSize, moduleSize)
        runStart = -1
      }
    }
  }

  if (logo && placement) drawLogo(ctx, logo.source, placement.side * moduleSize, offset + (matrix.size * moduleSize) / 2)
}

/** 로고를 한 변 `box`px 정사각형 안에 비율을 유지해(contain) 중심 `center`에 그린다. */
function drawLogo(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement, box: number, center: number) {
  const scale = Math.min(box / source.width, box / source.height)
  const w = Math.max(1, Math.round(source.width * scale))
  const h = Math.max(1, Math.round(source.height * scale))
  // 크게 줄일 때는 단계적 축소로 계단·모아레를 막는다
  const image = scale < 0.5 ? resizeCanvas(source, w, h) : source
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, Math.round(center - w / 2), Math.round(center - h / 2), w, h)
}

/** 저장용: 요청 크기의 새 캔버스를 만든다. */
export function renderQrCanvas(
  matrix: QrMatrix,
  size: number,
  margin: number,
  paint: QrPaint,
  logo?: QrLogo | null
): HTMLCanvasElement {
  const layout = computeLayout(matrix.size, size, margin)
  if (!layout) throw new Error(`크기가 너무 작습니다. 최소 ${minQrSize(matrix.size, margin)}px 이상이어야 합니다.`)
  const canvas = document.createElement('canvas')
  drawQr(canvas, matrix, layout, size, paint, logo)
  return canvas
}

/** 미리보기 캔버스 한 변: 모듈 정수 배(번짐 없음)이면서 목표 크기에 가깝게 */
export function previewSize(moduleCount: number, margin: number, target: number, minModulePx: number): number {
  const total = moduleCount + margin * 2
  return total * Math.max(minModulePx, Math.floor(target / total))
}
