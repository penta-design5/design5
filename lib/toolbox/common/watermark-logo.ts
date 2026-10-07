import { ImageLoadError, decodeImageFile, validateImageFile } from './load'
import type { WatermarkLogo } from './watermark'

/** 로고 썸네일(패널 표시용) — 큰 로고도 가볍게 */
export function createThumbnailUrl(source: HTMLCanvasElement, maxSide = 96): string {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

/**
 * 로고 이미지 파일 → 워터마크 로고. 본 이미지와 같은 검증(형식·20MB·픽셀 상한)과 EXIF 방향 보정을 거친다.
 * 실패하면 사용자에게 보여 줄 한국어 메시지를 담은 ImageLoadError를 던진다.
 */
export async function loadWatermarkLogo(file: File): Promise<WatermarkLogo> {
  const error = validateImageFile(file)
  if (error) throw new ImageLoadError(error)
  const canvas = await decodeImageFile(file)
  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    name: file.name || 'logo.png',
    previewUrl: createThumbnailUrl(canvas),
  }
}
