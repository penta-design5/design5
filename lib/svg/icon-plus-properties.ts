/**
 * ICON+ 병합 결과 속성 적용 유틸리티 (색상 / 선 두께 / 크기)
 *
 * `mergeSvgsByAnchor`가 만든 병합 결과(`[data-layer="main"]` / `[data-layer="merge"]` 그룹 구조)에
 * 색상·선 두께를 스코프된 `<style>` 블록으로 주입하고, 루트 width/height를 출력 크기로 재설정한다.
 * 미리보기·다운로드가 동일 함수를 쓰도록 순수 문자열 처리(클라이언트/서버 공용)로 유지한다.
 *
 * icon-merger `applySvgProperties` 이식본. 단, 라인 처리는 Design5의 조건부 규칙
 * (`[stroke]:not([fill])`만 라인으로 간주, fill 부분은 채움 보존)과 정합되게 조정했다.
 * → 선결요건 (a): 선 두께는 라인 획 요소에만 적용하고 fill 요소에는 색상만 반영한다.
 *
 * @see docs/ICON_PLUS_개발계획.md §7
 * @see app/globals.css `.svg-line-preview`(카드/입력 미리보기 규칙과 동일 사상)
 */

import type { MergedSvgResult } from './merge-svg'

/** 병합용 리소스 종류. 아이콘은 라인 처리, 텍스트는 채움(글자) 처리한다. */
export type ResourceKind = 'icon' | 'text'

/** 속성 적용 모드. preview는 화면 픽셀 기준 두께(non-scaling + 최소 플로어), download는 출력 크기 기준 절대 두께. */
export type PropertyMode = 'preview' | 'download'

export interface IconPlusPropertyOptions {
  /** 색상(hex). 흰색(#FFFFFF)이면 다운로드 포맷/카드 배경에서 별도 처리한다. */
  color: string
  /** 선 두께(px, 컨트롤 값 0.5~3). */
  strokeWidth: number
  /** 출력 높이(px). 결과 폭은 종횡비 유지로 파생한다. */
  outputHeight: number
  /** 병합용 리소스 종류(아이콘=라인, 텍스트=채움). */
  resourceKind: ResourceKind
  /** 적용 모드. 기본 download. */
  mode?: PropertyMode
  /** preview 모드에서 화면에 보장할 최소 선 두께(px). 기본 1. */
  minDisplayPx?: number
}

const PROPERTY_STYLE_MARKER = 'data-icon-plus-properties'

/**
 * 병합 결과 SVG에 색상/선 두께/크기를 적용한 새 결과를 반환한다.
 * 원본은 변경하지 않는다(순수 함수).
 */
export function applyIconPlusProperties(
  merged: MergedSvgResult,
  options: IconPlusPropertyOptions
): MergedSvgResult {
  const mode = options.mode ?? 'download'
  const outputHeight = clampPositive(options.outputHeight, merged.height || 1)
  const outputWidth = scaleWidthFromHeight(merged.width, merged.height, outputHeight)

  // 기존 주입 스타일 제거(재적용 안전)
  const withoutStyle = merged.svgContent.replace(
    new RegExp(`<style ${PROPERTY_STYLE_MARKER}="true">[\\s\\S]*?</style>`, 'i'),
    ''
  )

  const openingTag = withoutStyle.match(/^<svg\b[^>]*>/i)?.[0]
  if (!openingTag) {
    return { ...merged, width: outputWidth, height: outputHeight }
  }

  const withSizedRoot = setSvgRootAttributes(withoutStyle, {
    width: formatNumber(outputWidth),
    height: formatNumber(outputHeight),
  })

  const styleBlock = buildPropertyStyle(merged, { ...options, mode, outputHeight })
  const svgContent = withSizedRoot.replace(/^<svg\b[^>]*>/i, (tag) => `${tag}${styleBlock}`)

  return {
    svgContent,
    viewBox: merged.viewBox,
    width: outputWidth,
    height: outputHeight,
  }
}

/**
 * 주입할 `<style>` 블록을 만든다.
 * - 라인 요소(`[stroke]:not([fill])`): fill 제거 + stroke 색상/두께 적용.
 * - fill 요소(`[fill]:not([fill="none"])`): 색상만 적용(선 두께 미적용 — 선결요건 a).
 * - 텍스트 리소스: merge 레이어 전체를 채움 색상으로, stroke가 있으면 stroke 색상도 적용.
 */
function buildPropertyStyle(
  merged: MergedSvgResult,
  options: Required<Pick<IconPlusPropertyOptions, 'color' | 'strokeWidth' | 'resourceKind' | 'mode' | 'outputHeight'>> &
    Pick<IconPlusPropertyOptions, 'minDisplayPx'>
): string {
  const { color, resourceKind } = options

  // 라인 획을 적용할 레이어: 메인은 항상, 병합용은 아이콘일 때만.
  const lineLayers = ['[data-layer="main"]']
  if (resourceKind === 'icon') lineLayers.push('[data-layer="merge"]')

  const lineSelector = lineLayers.map((l) => `svg ${l} [stroke]:not([fill])`).join(', ')
  const fillSelector = lineLayers.map((l) => `svg ${l} [fill]:not([fill="none"])`).join(', ')

  const strokeDecl = buildStrokeDeclaration(merged, options)

  const rules = [
    // 라인 획: 채움 제거 + 색상/두께
    `${lineSelector} { fill: none !important; stroke: ${color} !important; ${strokeDecl} }`,
    // fill 부분: 색상만(선 두께 미적용)
    `${fillSelector} { fill: ${color} !important; }`,
  ]

  if (resourceKind === 'text') {
    // 병합용 텍스트: 글자(채움) 전체 색상 + stroke가 있으면 stroke 색상도
    rules.push(`svg [data-layer="merge"] * { fill: ${color} !important; }`)
    rules.push(`svg [data-layer="merge"] [stroke]:not([stroke="none"]) { stroke: ${color} !important; }`)
  }

  return `<style ${PROPERTY_STYLE_MARKER}="true">${rules.join('')}</style>`
}

/**
 * 라인 요소의 stroke-width 선언을 만든다.
 * - preview: `vector-effect: non-scaling-stroke` + 화면 픽셀 기준 두께(최소 플로어 보장) →
 *   소형 카드/저 DPR에서 얇게 끊겨 보이지 않게 하고, 컨트롤 값 변화가 미리보기에 반영된다.
 * - download: 출력 높이에서 컨트롤 두께(px)로 보이도록 viewBox 단위로 스케일한 절대 두께.
 */
function buildStrokeDeclaration(
  merged: MergedSvgResult,
  options: Pick<IconPlusPropertyOptions, 'strokeWidth' | 'mode' | 'outputHeight' | 'minDisplayPx'>
): string {
  const strokeWidth = Math.max(options.strokeWidth, 0)

  if (options.mode === 'preview') {
    const floor = options.minDisplayPx ?? 1
    const displayPx = Math.max(strokeWidth, floor)
    return `stroke-width: ${formatNumber(displayPx)}px !important; vector-effect: non-scaling-stroke;`
  }

  // download: viewBox 단위 = 컨트롤px × (결과 viewBox 높이 / 출력 높이)
  const outputHeight = clampPositive(options.outputHeight ?? merged.height, merged.height || 1)
  const scaled = merged.height > 0 ? (strokeWidth * merged.height) / outputHeight : strokeWidth
  return `stroke-width: ${formatNumber(scaled)} !important;`
}

/** 종횡비를 유지하며 출력 높이에서 폭을 계산한다. */
export function scaleWidthFromHeight(width: number, height: number, outputHeight: number): number {
  if (height <= 0) return outputHeight
  return Number(((width / height) * outputHeight).toFixed(3))
}

/** SVG 루트 태그의 지정 속성을 설정(있으면 교체, 없으면 추가)한다. */
function setSvgRootAttributes(svgContent: string, attributes: Record<string, string>): string {
  return svgContent.replace(/^<svg\b[^>]*>/i, (tag) => {
    let nextTag = tag
    for (const [name, value] of Object.entries(attributes)) {
      const pattern = new RegExp(`\\s${name}=["'][^"']*["']`, 'i')
      nextTag = pattern.test(nextTag)
        ? nextTag.replace(pattern, ` ${name}="${value}"`)
        : nextTag.replace(/>$/, ` ${name}="${value}">`)
    }
    return nextTag
  })
}

function clampPositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function formatNumber(value: number): string {
  return Number(value.toFixed(3)).toString()
}
