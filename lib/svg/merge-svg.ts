/**
 * SVG anchor 기반 병합 유틸리티 (ICON+)
 *
 * 메인 아이콘의 anchor(viewBox 좌표계) 지점에 병합용 리소스의 좌상단을 정렬하여
 * 하나의 SVG로 합성한다. 결과 viewBox/width/height를 재계산한다.
 * 미리보기·다운로드가 동일 함수를 사용하도록 순수 함수로 유지한다(클라이언트/서버 공용).
 *
 * icon-merger `src/lib/svg/merge-svg.ts` 이식본. 하드코딩 의존성 없음(순수 문자열 처리).
 *
 * P8(마스킹 프리셋)에서 세 가지가 추가되었다:
 * - **앵커 기준 코너**(`anchorBasis`): 우측 하단 프리셋은 앵커에 리소스 **좌상단**을, 우측 상단 프리셋은
 *   앵커에 리소스 **좌하단**을 맞춘다(배지가 앵커 위로 쌓여 아래쪽 변이 정렬된다).
 * - **오프셋 정규화**: anchor가 음수여도(배지가 아이콘 위/왼쪽으로 오버플로) 잘리지 않도록
 *   viewBox min을 음수로 만들지 않고 두 레이어를 평행이동한다. anchor ≥ 0이면 기존 출력과 동일하다.
 * - **절단 마스크 통합**: `cutX/cutY/cutRadius`가 모두 유효하면 `<defs><mask>`를 head에 삽입하고
 *   메인 레이어에만 적용한다(원본 SVG는 훼손하지 않음).
 *
 * @see lib/svg/corner-cut.ts 마스크 생성 및 하드 제약 3가지
 * @see docs/ICON_PLUS_절단마스킹_구현계획.md §5
 */

import { buildCutMaskDefs, isValidCornerCut } from './corner-cut'

export type MergeSvgIcon = {
  svgContent: string
  width: number
  height: number
}

/**
 * 앵커 지점이 병합 리소스의 **어느 코너**와 맞춰지는지.
 * - `TOP_LEFT`(기본): 앵커에 리소스의 좌상단을 붙인다(기존 동작 = 우측 하단 프리셋).
 * - `BOTTOM_LEFT`: 앵커에 리소스의 좌하단을 붙인다(우측 상단 프리셋 — 배지가 앵커 위쪽으로 쌓인다).
 */
export type MergeAnchorBasis = 'TOP_LEFT' | 'BOTTOM_LEFT'

export type MainMergeSvgIcon = MergeSvgIcon & {
  anchorX: number | null
  anchorY: number | null
  /** 앵커 기준 코너. 기본 `TOP_LEFT`(기존 호출부·출력 불변) */
  anchorBasis?: MergeAnchorBasis
  /**
   * 절단 원(마스킹 프리셋). 3값이 모두 유효할 때만 `<mask>`를 삽입한다.
   * 옵셔널이므로 프리셋이 없는 legacy pre-cut 아이콘 호출부는 변경 없이 동작한다.
   */
  cutX?: number | null
  cutY?: number | null
  cutRadius?: number | null
  /** 페이지 내 고유 마스크 id. 여러 SVG가 인라인되므로 호출부에서 주입한다 */
  maskId?: string
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

  // 앵커 기준 코너에 따라 리소스의 상단 y를 정한다.
  // BOTTOM_LEFT면 앵커가 리소스의 **아래쪽 변**이므로 높이만큼 위로 올려 배치한다.
  const resourceTop =
    (mainIcon.anchorBasis ?? 'TOP_LEFT') === 'BOTTOM_LEFT' ? anchorY - resource.height : anchorY

  // 오프셋 정규화: 리소스가 아이콘 위/왼쪽으로 삐져나오면(우측 상단 프리셋)
  // viewBox min을 음수로 만들지 않고 두 레이어를 오버플로만큼 평행이동한다.
  // 오버플로가 없으면 off = 0이 되어 기존 출력과 완전히 동일하다.
  const left = Math.min(0, anchorX)
  const right = Math.max(main.width, anchorX + resource.width)
  const top = Math.min(0, resourceTop)
  const bottom = Math.max(main.height, resourceTop + resource.height)
  const offX = -left
  const offY = -top
  const resultWidth = right - left
  const resultHeight = bottom - top

  const viewBox = `0 0 ${formatNumber(resultWidth)} ${formatNumber(resultHeight)}`

  // 절단 마스크: 원 좌표를 결과 좌표계로 변환(cut - main.min + off)하고,
  // 마스크 영역 기준은 결과 좌표계에서 메인 아이콘이 차지하는 사각형으로 잡는다.
  const cut = { cutX: mainIcon.cutX, cutY: mainIcon.cutY, cutRadius: mainIcon.cutRadius }
  const mask = isValidCornerCut(cut)
    ? buildCutMaskDefs({
        maskId: mainIcon.maskId ?? 'iconplus-cut-mask',
        cut: {
          cutX: cut.cutX - main.minX + offX,
          cutY: cut.cutY - main.minY + offY,
          cutRadius: cut.cutRadius,
        },
        bounds: { minX: offX, minY: offY, width: main.width, height: main.height },
      })
    : null

  const mainTranslate = `translate(${formatNumber(offX - main.minX)} ${formatNumber(offY - main.minY)})`
  // 마스크가 있으면 래퍼 <g>가 mask만 담당하고 translate는 안쪽 <g>로 내린다(제약 ③)
  const mainLayer = mask
    ? `<g data-layer="main" mask="${mask.maskAttr}"><g transform="${mainTranslate}">${main.innerSvg}</g></g>`
    : `<g data-layer="main" transform="${mainTranslate}">${main.innerSvg}</g>`

  const svgContent = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${formatNumber(resultWidth)}" height="${formatNumber(resultHeight)}">`,
    // defs는 data-layer="main"보다 반드시 앞(제약 ①) — 색상 baking이 마스크 fill을 덮어쓰지 않게 한다
    mask?.defs ?? '',
    mainLayer,
    `<g data-layer="merge" transform="translate(${formatNumber(offX + anchorX - resource.minX)} ${formatNumber(offY + resourceTop - resource.minY)})">`,
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
