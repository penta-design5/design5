import { createCanvas } from '@/lib/toolbox/common/canvas'
import { toInputTensor } from './mask'
import { decontaminateColors, defringeRadius, featherMask, featherRadius, type EdgeSettings } from './refine'

/** 원본 캔버스 → 모델 입력 텐서 데이터(정사각 size² 로 늘려 그린다 — 학습 때와 같은 방식) */
export function prepareModelInput(source: HTMLCanvasElement, size: number): Float32Array {
  const { canvas, ctx } = createCanvas(size, size)
  ctx.drawImage(source, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  canvas.width = 0 // 메모리 즉시 반환
  return toInputTensor(data, size * size)
}

/**
 * 알파 마스크(maskSize²)를 원본 해상도로 부드럽게 늘려 원본에 적용한 투명 배경 캔버스.
 * 원본은 건드리지 않는다.
 */
export function applyAlphaMask(source: HTMLCanvasElement, alpha: Uint8ClampedArray, maskSize: number): HTMLCanvasElement {
  const mask = createCanvas(maskSize, maskSize)
  const image = mask.ctx.createImageData(maskSize, maskSize)
  for (let i = 0; i < alpha.length; i++) {
    const p = i * 4
    image.data[p] = 255
    image.data[p + 1] = 255
    image.data[p + 2] = 255
    image.data[p + 3] = alpha[i]
  }
  mask.ctx.putImageData(image, 0, 0)

  const { canvas, ctx } = createCanvas(source.width, source.height)
  ctx.drawImage(mask.canvas, 0, 0, source.width, source.height)
  ctx.globalCompositeOperation = 'source-in'
  ctx.drawImage(source, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  mask.canvas.width = 0
  return canvas
}

/**
 * 모델 마스크(maskSize²) + 경계 다듬기 → 투명 배경 캔버스(원본 해상도).
 * 부드럽게는 마스크 해상도에서, 색 번짐 줄이기는 원본 해상도에서 처리한다.
 */
export function buildCutout(
  source: HTMLCanvasElement,
  alpha: Uint8ClampedArray,
  maskSize: number,
  edge: EdgeSettings
): HTMLCanvasElement {
  const mask = featherMask(alpha, maskSize, maskSize, featherRadius(edge.feather))
  const canvas = applyAlphaMask(source, mask, maskSize)
  if (edge.defringe > 0) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
      decontaminateColors(image.data, canvas.width, canvas.height, edge.defringe / 100, defringeRadius(canvas.width, canvas.height))
      ctx.putImageData(image, 0, 0)
    }
  }
  return canvas
}
