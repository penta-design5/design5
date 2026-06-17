/**
 * SVG 크기 유틸리티
 * SVG 루트의 width/height/viewBox 조정.
 */

/**
 * SVG의 크기를 변경합니다.
 *
 * @param svgContent SVG 문자열
 * @param width 너비 (px 또는 숫자)
 * @param height 높이 (px 또는 숫자)
 * @param maintainAspectRatio 정비율 유지 여부
 * @returns 크기가 변경된 SVG 문자열
 */
export function resizeSvg(
  svgContent: string,
  width?: number | string,
  height?: number | string,
  maintainAspectRatio: boolean = true
): string {
  let modifiedSvg = svgContent

  // SVG 태그의 width와 height 속성만 제거 (rect 등의 width/height는 유지, viewBox는 유지)
  modifiedSvg = modifiedSvg.replace(
    /<svg([^>]*?)>/i,
    (match, attrs) => {
      // SVG 태그의 width, height만 제거 (viewBox는 유지)
      let newAttrs = attrs.replace(/\s+width=["'][^"']*["']/gi, '')
      newAttrs = newAttrs.replace(/\s+height=["'][^"']*["']/gi, '')
      return `<svg${newAttrs ? ' ' + newAttrs : ''}>`
    }
  )

  // width 속성 추가
  if (width !== undefined) {
    const widthValue = typeof width === 'number' ? `${width}px` : width
    modifiedSvg = modifiedSvg.replace(
      /<svg([^>]*?)>/i,
      (match, attrs) => {
        const trimmedAttrs = attrs.trim()
        const separator = trimmedAttrs ? ' ' : ''
        return `<svg${separator}${trimmedAttrs} width="${widthValue}">`
      }
    )
  }

  // height 속성 추가
  if (height !== undefined) {
    const heightValue = typeof height === 'number' ? `${height}px` : height
    modifiedSvg = modifiedSvg.replace(
      /<svg([^>]*?)>/i,
      (match, attrs) => {
        const trimmedAttrs = attrs.trim()
        const separator = trimmedAttrs ? ' ' : ''
        return `<svg${separator}${trimmedAttrs} height="${heightValue}">`
      }
    )
  }

  // viewBox가 없으면 추가 (기본값)
  if (!modifiedSvg.match(/viewBox=["'][^"']*["']/i)) {
    modifiedSvg = modifiedSvg.replace(
      /<svg([^>]*?)>/i,
      (match, attrs) => {
        if (!attrs.includes('viewBox')) {
          // width와 height에서 값 추출
          const widthMatch = match.match(/width=["']([^"']*)["']/i)
          const heightMatch = match.match(/height=["']([^"']*)["']/i)

          if (widthMatch && heightMatch) {
            const w = widthMatch[1].replace(/px$/, '')
            const h = heightMatch[1].replace(/px$/, '')
            return `<svg${attrs} viewBox="0 0 ${w} ${h}">`
          }
        }
        return match
      }
    )
  }

  return modifiedSvg
}
