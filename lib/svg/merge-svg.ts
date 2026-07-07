/**
 * SVG anchor 기반 병합 유틸리티 (ICON+)
 *
 * 메인 아이콘의 anchor(viewBox 좌표계) 지점에 병합용 리소스의 좌상단을 정렬하여
 * 하나의 SVG로 합성한다. 결과 viewBox/width/height를 재계산한다.
 * 미리보기·다운로드가 동일 함수를 사용하도록 순수 함수로 유지한다(클라이언트/서버 공용).
 *
 * icon-merger `src/lib/svg/merge-svg.ts` 이식본. 하드코딩 의존성 없음(순수 문자열 처리).
 */

export type MergeSvgIcon = {
  svgContent: string
  width: number
  height: number
}

export type MainMergeSvgIcon = MergeSvgIcon & {
  anchorX: number | null
  anchorY: number | null
}

export type MergedSvgResult = {
  svgContent: string
  width: number
  height: number
  viewBox: string
}

type SvgParts = {
  innerSvg: string
  minX: number
  minY: number
  width: number
  height: number
}

/**
 * 메인 아이콘 anchor 기준으로 병합용 리소스를 붙여 새 SVG를 생성한다.
 * anchor가 지정되지 않은 메인 아이콘이면 `null`을 반환한다.
 */
export function mergeSvgsByAnchor(
  mainIcon: MainMergeSvgIcon,
  resourceIcon: MergeSvgIcon
): MergedSvgResult | null {
  if (mainIcon.anchorX === null || mainIcon.anchorY === null) {
    return null
  }

  const main = readSvgParts(mainIcon.svgContent, mainIcon)
  const resource = readSvgParts(resourceIcon.svgContent, resourceIcon)
  const anchorX = mainIcon.anchorX - main.minX
  const anchorY = mainIcon.anchorY - main.minY
  const resultWidth = Math.max(main.width, anchorX + resource.width)
  const resultHeight = Math.max(main.height, anchorY + resource.height)
  const viewBox = `0 0 ${formatNumber(resultWidth)} ${formatNumber(resultHeight)}`
  const svgContent = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${formatNumber(resultWidth)}" height="${formatNumber(resultHeight)}">`,
    `<g data-layer="main" transform="translate(${formatNumber(-main.minX)} ${formatNumber(-main.minY)})">`,
    main.innerSvg,
    '</g>',
    `<g data-layer="merge" transform="translate(${formatNumber(anchorX - resource.minX)} ${formatNumber(anchorY - resource.minY)})">`,
    resource.innerSvg,
    '</g>',
    '</svg>',
  ].join('')

  return {
    svgContent,
    width: resultWidth,
    height: resultHeight,
    viewBox,
  }
}

function readSvgParts(svgContent: string, fallback: MergeSvgIcon): SvgParts {
  const openingTag = svgContent.match(/<svg\b[^>]*>/i)?.[0] ?? ''
  const viewBox = getAttribute(openingTag, 'viewBox')
  const [minX, minY, width, height] = viewBox
    ? parseViewBox(viewBox, fallback)
    : [0, 0, fallback.width, fallback.height]

  return {
    innerSvg: extractSvgInnerContent(svgContent),
    minX,
    minY,
    width,
    height,
  }
}

function extractSvgInnerContent(svgContent: string) {
  return svgContent
    .replace(/^<svg\b[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim()
}

function parseViewBox(viewBox: string, fallback: MergeSvgIcon) {
  const values = viewBox.trim().split(/[\s,]+/).map(Number)

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return [0, 0, fallback.width, fallback.height]
  }

  return values
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}=["']([^"']+)["']`, 'i'))

  return match?.[1] ?? null
}

function formatNumber(value: number) {
  return Number(value.toFixed(3)).toString()
}
