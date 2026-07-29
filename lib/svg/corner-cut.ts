/**
 * SVG 원형 절단(마스킹) 유틸리티 (ICON+ 마스킹 프리셋)
 *
 * 메인 아이콘 원본(`svgContent`)은 **훼손하지 않고**, 렌더 시점에 SVG `<mask>`로 구멍을 뚫는다.
 * 관리자가 프리셋으로 지정한 원(중심 + 반경)만큼 메인 아이콘의 획을 투명하게 만들어,
 * 그 자리에 병합용 배지가 여백을 두고 놓이게 한다.
 *
 * 반드시 지켜야 하는 3가지 하드 제약 (docs/ICON_PLUS_절단마스킹_구현계획.md §4.1):
 *
 * ① **`<defs>`는 `data-layer="main"` 그룹보다 앞(head)에 둔다.**
 *    `lib/svg/icon-plus-properties.ts`는 SVG를 head/main/merge/tail로 잘라 main·merge 구간에만
 *    `changeAllSvgColors`를 적용하고, 이 함수는 `none`/`url()`을 제외한 **모든 `fill` 값을 선택 색상으로
 *    덮어쓴다**. 마스크가 main 구간 안에 있으면 `#fff`/`#000`이 같은 색이 되어 마스크가 완전히 깨진다.
 *    head 구간은 그대로 통과하므로 여기 두면 안전하다.
 *
 * ② **마스크 도형에 `fill`을 명시하고 `stroke`는 쓰지 않는다.**
 *    `app/globals.css`의 `.svg-line-preview svg *[stroke]:not([fill]) { fill: none !important }`가
 *    `<defs>` 내부까지 내려간다. 선택자가 "stroke 있고 fill 없는 요소"만 잡으므로
 *    `fill="#fff"`/`fill="#000"`을 명시하면 대상에서 제외된다. fill을 생략하면(기본 black)
 *    흰 사각형이 검게 변해 전체가 사라진다.
 *
 * ③ **`mask` 속성은 `transform`이 없는 래퍼 `<g>`에 부여한다.**
 *    `maskUnits="userSpaceOnUse"`가 요소 자신의 transform 적용 전/후 어느 좌표계로 해석되는지
 *    렌더러 간 차이가 있어, translate는 안쪽 `<g>`로 내리고 바깥 래퍼는 mask만 담당하게 한다.
 *
 * 순수 문자열 처리(클라이언트/서버 공용)로 유지한다.
 *
 * @see docs/ICON_PLUS_절단마스킹_구현계획.md §4
 * @see lib/svg/merge-svg.ts 병합 결과에 마스크를 통합하는 호출부
 */

/** 절단 원 (메인 아이콘 viewBox 좌표계) */
export type CornerCut = {
  cutX: number
  cutY: number
  cutRadius: number
}

/** 마스크 영역 계산용 기준 사각형 (보통 메인 아이콘의 viewBox) */
export type CutBounds = {
  minX: number
  minY: number
  width: number
  height: number
}

/**
 * 마스크 영역을 기준 사각형 대비 상하좌우로 확장하는 비율.
 * 기본 mask 영역은 bbox의 -10%~120%라서 가장자리 획이 잘릴 수 있어 넉넉히 잡는다.
 */
export const CUT_MASK_PADDING_RATIO = 0.25

/** 마스크 id 기본값. 한 페이지에 여러 SVG가 인라인되므로 호출부에서 고유 id를 주입하는 것을 권장한다. */
const DEFAULT_MASK_ID = 'iconplus-cut-mask'

/**
 * 절단 원 입력값. DB/프리셋에서 온 값은 `null`일 수 있으므로 nullable로 받는다.
 */
export type MaybeCornerCut = {
  cutX?: number | null
  cutY?: number | null
  cutRadius?: number | null
}

/**
 * 절단 원 3값이 모두 유효한지 검사한다(마스크 삽입 조건).
 * 하나라도 없거나 반경이 0 이하면 마스킹하지 않는다(= 완전한 모습 유지).
 */
export function isValidCornerCut(cut: MaybeCornerCut | null | undefined): cut is CornerCut {
  if (!cut) return false
  const { cutX, cutY, cutRadius } = cut
  return (
    typeof cutX === 'number' &&
    Number.isFinite(cutX) &&
    typeof cutY === 'number' &&
    Number.isFinite(cutY) &&
    typeof cutRadius === 'number' &&
    Number.isFinite(cutRadius) &&
    cutRadius > 0
  )
}

/** 마스크 id를 생성한다. 페이지 내 id 충돌을 막기 위해 리소스·위치를 조합한다. */
export function buildCutMaskId(resourceId: string, position: string): string {
  return `iconplus-cut-${sanitizeId(resourceId)}-${sanitizeId(position)}`
}

/**
 * `<defs><mask>…</mask></defs>` 문자열과 `mask` 속성값을 생성한다.
 *
 * 흰 사각형(=보이는 영역) 위에 검은 원(=투명해질 영역)을 얹는 표준 마스크 구성이며,
 * 두 도형 모두 `fill`을 명시하고 `stroke`를 쓰지 않는다(제약 ②).
 */
export function buildCutMaskDefs(params: {
  maskId: string
  cut: CornerCut
  bounds: CutBounds
}): { defs: string; maskAttr: string } {
  const { maskId, cut, bounds } = params

  const padX = bounds.width * CUT_MASK_PADDING_RATIO
  const padY = bounds.height * CUT_MASK_PADDING_RATIO
  const x = bounds.minX - padX
  const y = bounds.minY - padY
  const width = bounds.width + padX * 2
  const height = bounds.height + padY * 2

  const defs =
    `<defs>` +
    `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}">` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}" fill="#fff"/>` +
    `<circle cx="${n(cut.cutX)}" cy="${n(cut.cutY)}" r="${n(cut.cutRadius)}" fill="#000"/>` +
    `</mask>` +
    `</defs>`

  return { defs, maskAttr: `url(#${maskId})` }
}

/**
 * 단독 표시용(관리자 편집 미리보기): `svgContent`에 절단 마스크를 적용한 문자열을 반환한다.
 * `cut`이 null이거나 유효하지 않으면 **원본을 그대로** 반환한다(비파괴).
 *
 * @param svgContent 저장된 SVG(sanitize 완료본)
 * @param cut 절단 원. null이면 마스킹하지 않는다
 * @param maskId 페이지 내 고유 마스크 id
 */
export function applyCornerCutToSvg(
  svgContent: string,
  cut: CornerCut | null,
  maskId: string = DEFAULT_MASK_ID
): string {
  if (!isValidCornerCut(cut)) return svgContent

  const openingTag = svgContent.match(/<svg\b[^>]*>/i)?.[0]
  const closingIdx = svgContent.toLowerCase().lastIndexOf('</svg>')

  // 예상 구조가 아니면 손대지 않는다(비파괴 원칙)
  if (!openingTag || closingIdx < 0) return svgContent

  const bounds = readBoundsFromOpeningTag(openingTag)
  if (!bounds) return svgContent

  const inner = svgContent.slice(openingTag.length, closingIdx)
  const { defs, maskAttr } = buildCutMaskDefs({ maskId, cut, bounds })

  // defs는 래퍼 그룹보다 앞(제약 ①), 래퍼 <g>에는 transform 없이 mask만(제약 ③)
  return `${openingTag}${defs}<g mask="${maskAttr}">${inner}</g></svg>`
}

/** 루트 태그의 viewBox(없으면 width/height)로 기준 사각형을 만든다. */
function readBoundsFromOpeningTag(openingTag: string): CutBounds | null {
  const viewBox = getAttribute(openingTag, 'viewBox')

  if (viewBox) {
    const values = viewBox.trim().split(/[\s,]+/).map(Number)
    if (values.length === 4 && values.every((value) => Number.isFinite(value)) && values[2] > 0 && values[3] > 0) {
      return { minX: values[0], minY: values[1], width: values[2], height: values[3] }
    }
  }

  const width = Number(getAttribute(openingTag, 'width'))
  const height = Number(getAttribute(openingTag, 'height'))

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { minX: 0, minY: 0, width, height }
  }

  return null
}

function getAttribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\s${name}=["']([^"']+)["']`, 'i'))?.[1] ?? null
}

/** id에 쓸 수 없는 문자를 제거한다(cuid/enum 값이라 실질적으로는 통과). */
function sanitizeId(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, '')
}

function n(value: number) {
  return Number(value.toFixed(3)).toString()
}
