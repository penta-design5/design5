import { resizeCanvas } from '@/lib/toolbox/common/canvas'
import type { QrSvgLogo } from './svg'

/** SVG에 포함할 로고의 최대 한 변(px) — 큰 로고가 SVG 용량을 키우지 않게 한다 */
export const SVG_LOGO_MAX_SIDE = 512

/** 로고 캔버스 → SVG 포함용 PNG data URL(필요하면 축소) */
export function createSvgLogo(source: HTMLCanvasElement, percent: number): QrSvgLogo {
  const scale = Math.min(1, SVG_LOGO_MAX_SIDE / Math.max(source.width, source.height))
  const canvas =
    scale < 1 ? resizeCanvas(source, Math.max(1, Math.round(source.width * scale)), Math.max(1, Math.round(source.height * scale))) : source
  return { href: canvas.toDataURL('image/png'), aspect: source.width / source.height, percent }
}
