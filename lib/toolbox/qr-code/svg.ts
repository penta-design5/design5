import { HEX_COLOR } from './contrast'
import { isKnocked, logoPlacement } from './logo'
import { isDark, type QrMatrix } from './matrix'
import type { QrPaint } from './render'

/** SVG에 넣을 로고 — 래스터 이미지를 data URL로 포함한다(벡터 로고는 지원하지 않음). */
export interface QrSvgLogo {
  /** `data:image/png;base64,…` */
  href: string
  /** 가로 / 세로 */
  aspect: number
  percent: number
}

const DATA_PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/

/**
 * 행렬 → SVG 문자열. 모듈 좌표계(viewBox = 여백 포함 모듈 수)라 어떤 크기로 확대해도 선명하고,
 * 어두운 모듈의 가로 연속 구간을 **하나의 `<path>`**로 합쳐 파일이 작고 이웃 모듈 사이에 틈이 생기지 않는다.
 * 투명 배경(`paint.bg === null`)이면 배경 `<rect>`를 넣지 않는다.
 * 색은 `#rrggbb`만 받는다(속성 주입 방지).
 */
export function renderQrSvg(matrix: QrMatrix, size: number, margin: number, paint: QrPaint, logo?: QrSvgLogo | null): string {
  if (!HEX_COLOR.test(paint.fg) || (paint.bg !== null && !HEX_COLOR.test(paint.bg))) {
    throw new Error('색상 형식이 올바르지 않습니다.')
  }
  if (logo && !DATA_PNG.test(logo.href)) throw new Error('로고 이미지 형식이 올바르지 않습니다.')
  const total = matrix.size + margin * 2
  const placement = logo ? logoPlacement(matrix.size, logo.percent) : null

  let d = ''
  for (let row = 0; row < matrix.size; row++) {
    let runStart = -1
    for (let col = 0; col <= matrix.size; col++) {
      const dark = col < matrix.size && isDark(matrix, row, col) && !(placement && isKnocked(placement, row, col))
      if (dark && runStart < 0) runStart = col
      if (!dark && runStart >= 0) {
        d += `M${runStart + margin} ${row + margin}h${col - runStart}v1h-${col - runStart}z`
        runStart = -1
      }
    }
  }

  // 로고: 지우는 영역의 한가운데에 비율을 유지(meet)해 넣는다
  let image = ''
  if (logo && placement) {
    const c = total / 2
    const w = logo.aspect >= 1 ? placement.side : placement.side * logo.aspect
    const h = logo.aspect >= 1 ? placement.side / logo.aspect : placement.side
    image = `<image href="${logo.href}" x="${+(c - w / 2).toFixed(4)}" y="${+(c - h / 2).toFixed(4)}" width="${+w.toFixed(4)}" height="${+h.toFixed(4)}"/>`
  }

  const bg = paint.bg === null ? '' : `<rect width="${total}" height="${total}" fill="${paint.bg}"/>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}">` +
    bg +
    `<path fill="${paint.fg}" d="${d}"/>` +
    image +
    `</svg>\n`
  )
}
