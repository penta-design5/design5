/**
 * SVG 복합 속성 유틸리티
 * 색상·크기·stroke-width를 한 번에 적용하는 조합 함수.
 */

import { changeAllSvgColors } from './color'
import { resizeSvg } from './resize'
import { changeSvgStrokeWidth } from './stroke'

/**
 * ICON 페이지용 SVG 속성 통합 변경 함수
 * 색상, stroke-width, 크기를 한 번에 적용합니다.
 * fill="none"을 명시적으로 보장합니다.
 *
 * @param svgContent SVG 문자열
 * @param color 색상 (hex 코드)
 * @param strokeWidth stroke-width 값 (px)
 * @param size 크기 (px)
 * @returns 속성이 변경된 SVG 문자열
 */
export function changeIconSvgProperties(
  svgContent: string,
  color: string,
  strokeWidth: number,
  size: number
): string {
  let modifiedSvg = svgContent

  // 1. 색상 변경 (fill="none" 유지)
  modifiedSvg = changeAllSvgColors(modifiedSvg, color)

  // 2. 크기를 먼저 변경 (stroke-width 계산을 위해)
  modifiedSvg = resizeSvg(modifiedSvg, size, size, true)

  // 3. stroke-width 변경 (크기 변경 후 actualWidth가 올바르게 설정됨)
  modifiedSvg = changeSvgStrokeWidth(modifiedSvg, strokeWidth)

  // 4. 모든 stroke 요소에 fill="none" 명시적 추가 (없는 경우만)
  modifiedSvg = modifiedSvg.replace(
    /<(rect|circle|ellipse|line|polyline|polygon|path|g)([^>]*?)>/gi,
    (match, tagName, attrs) => {
      // stroke가 있고 fill이 없으면 fill="none" 추가
      if (/stroke=/i.test(attrs) && !/fill=/i.test(attrs)) {
        attrs = attrs.trim() + (attrs.trim() ? ' ' : '') + 'fill="none"'
      }
      return `<${tagName}${attrs ? ' ' + attrs : ''}>`
    }
  )

  return modifiedSvg
}
