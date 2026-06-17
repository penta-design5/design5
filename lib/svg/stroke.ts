/**
 * SVG stroke 유틸리티
 * stroke-width 조정, 점선(dasharray) 제거.
 */

/** 아이콘 목록 표시 시 기본 크기(px). stroke 최소값 계산에 사용 */
const ICON_DISPLAY_SIZE_PX = 56

/**
 * SVG의 stroke-width를 변경합니다.
 * 개별 속성, 인라인 스타일, CSS 클래스 모두 지원합니다.
 *
 * @param svgContent SVG 문자열
 * @param strokeWidth stroke-width 값 (px 단위)
 * @param minDisplayPx 표시 시 stroke 최소 두께(px). 지정 시 저해상도/데스크톱에서 점선으로 보이는 것 방지 (예: 1.5)
 * @returns stroke-width가 변경된 SVG 문자열
 */
export function changeSvgStrokeWidth(
  svgContent: string,
  strokeWidth: number,
  minDisplayPx?: number
): string {
  let modifiedSvg = svgContent

  // viewBox 추출하여 stroke-width를 viewBox 기준으로 계산
  const viewBoxMatch = modifiedSvg.match(/viewBox=["']([^"']+)["']/i)
  let viewBoxWidth = 24 // 기본값

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(Number)
    if (parts.length === 4 && parts.every(n => !isNaN(n))) {
      viewBoxWidth = parts[2] // viewBox width
    }
  }

  // SVG의 실제 width 추출
  const widthMatch = modifiedSvg.match(/width=["']([^"']+)["']/i)
  let actualWidth = viewBoxWidth

  if (widthMatch) {
    const widthStr = widthMatch[1].replace(/px$/, '')
    const widthNum = parseFloat(widthStr)
    if (!isNaN(widthNum)) {
      actualWidth = widthNum
    }
  }

  // stroke-width를 viewBox 기준으로 계산
  // 일러스트레이터는 viewBox 기준으로 해석하므로
  // 설정한 strokeWidth(px)가 실제 크기에서 올바르게 표시되려면:
  // stroke-width(viewBox 단위) = strokeWidth(px) * (viewBoxWidth / actualWidth)
  const scale = viewBoxWidth / actualWidth
  let strokeWidthValue = strokeWidth * scale

  // 데스크톱 등 저 DPR에서 서브픽셀 stroke가 점선으로 보이는 것 방지: 표시 시 최소 1.5px 이상 보장
  if (minDisplayPx != null && minDisplayPx > 0) {
    const minStrokeViewBox = minDisplayPx * (viewBoxWidth / ICON_DISPLAY_SIZE_PX)
    strokeWidthValue = Math.max(strokeWidthValue, minStrokeViewBox)
  }

  // 단위 없이 설정 (일러스트레이터가 viewBox 기준으로 해석)
  const strokeWidthStr = strokeWidthValue.toString()

  // 1. 개별 stroke-width 속성 변경 (단위 없이)
  modifiedSvg = modifiedSvg.replace(
    /stroke-width=["']([^"']+)["']/gi,
    `stroke-width="${strokeWidthStr}"`
  )

  // 2. 인라인 style 속성 내부의 stroke-width 변경/추가
  modifiedSvg = modifiedSvg.replace(
    /style=["']([^"']*)["']/gi,
    (match, styleContent) => {
      let newStyle = styleContent

      // 기존 stroke-width가 있으면 변경
      if (/stroke-width:\s*[^;'"\s]+/gi.test(newStyle)) {
        newStyle = newStyle.replace(
          /stroke-width:\s*[^;'"\s]+/gi,
          `stroke-width: ${strokeWidthStr}`
        )
      } else {
        // stroke 속성이 있으면 stroke-width 추가
        if (/stroke:\s*[^;'"\s]+/gi.test(newStyle)) {
          newStyle = newStyle.trim()
          if (!newStyle.endsWith(';')) {
            newStyle += ';'
          }
          newStyle += ` stroke-width: ${strokeWidthStr}`
        }
      }

      return `style="${newStyle}"`
    }
  )

  // 3. CSS 클래스 내부의 stroke-width 변경/추가 (<style> 태그)
  modifiedSvg = modifiedSvg.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (match, styleContent) => {
      let newStyleContent = styleContent

      // 각 클래스 내부의 stroke-width 변경/추가
      newStyleContent = newStyleContent.replace(
        /\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/gi,
        (classMatch: string, className: string, classProps: string) => {
          // stroke 속성이 있으면 stroke-width 추가/변경
          if (/stroke:\s*[^;'"\s]+/gi.test(classProps)) {
            if (/stroke-width:\s*[^;'"\s]+/gi.test(classProps)) {
              // 기존 stroke-width 변경
              classProps = classProps.replace(
                /stroke-width:\s*[^;'"\s]+/gi,
                `stroke-width: ${strokeWidthStr}`
              )
            } else {
              // stroke-width 추가
              classProps = classProps.trim()
              if (!classProps.endsWith(';')) {
                classProps += ';'
              }
              classProps += ` stroke-width: ${strokeWidthStr};`
            }
          }
          return `.${className}{${classProps}}`
        }
      )

      return match.replace(styleContent, newStyleContent)
    }
  )

  // 4. stroke 속성이 있지만 stroke-width가 없는 경우 추가 (모든 요소, style 속성 없는 경우)
  // rect, circle, ellipse, line, polyline, polygon, path, g 모두 포함
  // self-closing 태그 처리 개선
  modifiedSvg = modifiedSvg.replace(
    /<(rect|circle|ellipse|line|polyline|polygon|path|g)([^>]*?)(\/?)>/gi,
    (match, tagName, attrs, selfClose) => {
      // stroke 속성이 있고, stroke-width가 없고, style 속성이 없으면 stroke-width 추가
      if (/stroke=/i.test(attrs) && !/stroke-width=/i.test(attrs) && !/style=/i.test(attrs)) {
        attrs = attrs.trim() + (attrs.trim() ? ' ' : '') + `stroke-width="${strokeWidthStr}"`
      }
      return `<${tagName}${attrs ? ' ' + attrs : ''}${selfClose}>`
    }
  )

  return modifiedSvg
}

/**
 * SVG에서 stroke-dasharray, stroke-dashoffset을 제거·무력화하여 항상 실선으로 렌더되게 합니다.
 * 속성, 인라인 style, <style> 블록 내부를 모두 처리합니다.
 *
 * @param svgContent SVG 문자열
 * @returns 점선이 제거된 SVG 문자열 (실선만 표시)
 */
export function stripSvgStrokeDash(svgContent: string): string {
  let modifiedSvg = svgContent

  // 1. 요소 속성에서 stroke-dasharray, stroke-dashoffset 제거 (공백 포함)
  modifiedSvg = modifiedSvg.replace(/\s*stroke-dasharray=["'][^"']*["']/gi, '')
  modifiedSvg = modifiedSvg.replace(/\s*stroke-dashoffset=["'][^"']*["']/gi, '')

  // 2. 인라인 style 속성 내부: stroke-dasharray / stroke-dashoffset → none, 0
  modifiedSvg = modifiedSvg.replace(
    /style=["']([^"']*)["']/gi,
    (match, styleContent) => {
      let newStyle = styleContent
        .replace(/\bstroke-dasharray\s*:\s*[^;'"\s]+;?/gi, 'stroke-dasharray: none;')
        .replace(/\bstroke-dashoffset\s*:\s*[^;'"\s]+;?/gi, 'stroke-dashoffset: 0;')
      return `style="${newStyle}"`
    }
  )

  // 3. <style> 블록 내부의 stroke-dasharray, stroke-dashoffset 규칙을 실선으로 변경
  modifiedSvg = modifiedSvg.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (match, styleContent) => {
      const newStyleContent = styleContent
        .replace(/\bstroke-dasharray\s*:\s*[^;}\s]+/gi, 'stroke-dasharray: none')
        .replace(/\bstroke-dashoffset\s*:\s*[^;}\s]+/gi, 'stroke-dashoffset: 0')
      return match.replace(styleContent, newStyleContent)
    }
  )

  return modifiedSvg
}
