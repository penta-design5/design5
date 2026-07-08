/**
 * ICON+ 병합 결과 속성 적용 유틸리티 (색상 / 선 두께 / 크기)
 *
 * `mergeSvgsByAnchor`가 만든 병합 결과(`[data-layer="main"]` / `[data-layer="merge"]` 그룹 구조)에
 * 색상·선 두께를 **각 요소의 presentation 속성(fill/stroke/stroke-width)으로 직접 기록(bake)**하고,
 * 루트 width/height를 출력 크기로 재설정한다.
 * 미리보기·다운로드가 동일 함수를 쓰도록 순수 문자열 처리(클라이언트/서버 공용)로 유지한다.
 *
 * 초기 구현은 `<style>` 주입 방식이었으나, 다운로드한 .svg를 macOS 미리보기 등 일부 뷰어에서 열면
 * 내부 CSS(특히 `:not()`/속성 선택자)를 적용하지 않아 앱 화면과 결과가 달라졌다.
 * → 뷰어 독립성을 위해 ICON 탭과 동일하게 속성 baking 방식으로 전환하고
 *   Design5 `lib/svg/color.ts`의 `changeAllSvgColors`를 재사용한다.
 *
 * 선결요건 (a): 선 두께(stroke-width)는 라인 획(stroke가 있고 fill이 none인 요소)에만 적용하고
 * fill 요소에는 색상만 반영한다.
 *
 * @see docs/ICON_PLUS_개발계획.md §7
 * @see lib/svg/color.ts `changeAllSvgColors`
 */

import type { MergedSvgResult } from './merge-svg'
import { changeAllSvgColors } from './color'

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

/** 선/획 두께를 부여할 대상 요소 태그 */
const DRAWING_ELEMENTS = 'path|rect|circle|ellipse|line|polyline|polygon|g'

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

  const svg = merged.svgContent
  const mainIdx = svg.search(/<g\b[^>]*\bdata-layer=["']main["']/i)
  const mergeIdx = svg.search(/<g\b[^>]*\bdata-layer=["']merge["']/i)
  const endIdx = svg.lastIndexOf('</svg>')

  // 예상 구조가 아니면(레이어 마커 없음) 색상만 전체 적용 후 크기 재설정
  if (mainIdx < 0 || mergeIdx < 0 || endIdx < 0 || mainIdx > mergeIdx) {
    const colorized = changeAllSvgColors(svg, options.color)
    return {
      viewBox: merged.viewBox,
      width: outputWidth,
      height: outputHeight,
      svgContent: setSvgRootAttributes(colorized, {
        width: formatNumber(outputWidth),
        height: formatNumber(outputHeight),
      }),
    }
  }

  const strokeValue = resolveStrokeWidth(merged, {
    strokeWidth: options.strokeWidth,
    outputHeight,
    minDisplayPx: options.minDisplayPx,
  })

  const head = svg.slice(0, mainIdx)
  const mainSeg = svg.slice(mainIdx, mergeIdx)
  const mergeSeg = svg.slice(mergeIdx, endIdx)
  const tail = svg.slice(endIdx)

  // 메인 레이어: 항상 라인 처리
  const bakedMain = bakeLineLayer(mainSeg, options.color, mode, strokeValue)
  // 병합 레이어: 아이콘=라인, 텍스트=채움(색상만)
  const bakedMerge =
    options.resourceKind === 'icon'
      ? bakeLineLayer(mergeSeg, options.color, mode, strokeValue)
      : changeAllSvgColors(mergeSeg, options.color)

  const reassembled = `${head}${bakedMain}${bakedMerge}${tail}`
  const svgContent = setSvgRootAttributes(reassembled, {
    width: formatNumber(outputWidth),
    height: formatNumber(outputHeight),
  })

  return { svgContent, viewBox: merged.viewBox, width: outputWidth, height: outputHeight }
}

/**
 * 라인 레이어 처리: 색상 bake(`changeAllSvgColors`) 후, 라인 획(stroke+fill:none) 요소에만 stroke-width를 기록한다.
 * fill 요소는 색상만 반영되고 stroke-width는 적용되지 않는다(선결요건 a).
 */
function bakeLineLayer(
  segment: string,
  color: string,
  mode: PropertyMode,
  strokeValue: { downloadViewBox: number; previewPx: number }
): string {
  // 1. 색상: fill/stroke 재색상 + stroke-only 요소에 fill="none" 부여 + 채움 없는 도형에 fill 부여
  const colorized = changeAllSvgColors(segment, color)

  // 2. stroke-width: fill="none" + stroke 보유(=라인 획) 요소에만 적용
  const elementPattern = new RegExp(`<(${DRAWING_ELEMENTS})\\b([^>]*?)(/?)>`, 'gi')
  return colorized.replace(elementPattern, (match, tag: string, attrs: string, close: string) => {
    const strokeAttr = attrs.match(/\sstroke=["']([^"']*)["']/i)
    const hasStroke = Boolean(strokeAttr) && strokeAttr![1].toLowerCase() !== 'none'
    const fillAttr = attrs.match(/\sfill=["']([^"']*)["']/i)
    const isNoneFill = Boolean(fillAttr) && fillAttr![1].toLowerCase() === 'none'

    if (!hasStroke || !isNoneFill) return match

    const swValue = mode === 'preview' ? String(strokeValue.previewPx) : formatNumber(strokeValue.downloadViewBox)
    let nextAttrs = attrs
    if (/\sstroke-width=["'][^"']*["']/i.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/\sstroke-width=["'][^"']*["']/i, ` stroke-width="${swValue}"`)
    } else {
      nextAttrs = `${nextAttrs.replace(/\s*$/, '')} stroke-width="${swValue}"`
    }
    // preview: 아이콘마다 다른 native 스케일 상쇄 + 소형 타일에서 끊김 방지
    if (mode === 'preview' && !/\svector-effect=/i.test(nextAttrs)) {
      nextAttrs = `${nextAttrs} vector-effect="non-scaling-stroke"`
    }
    return `<${tag}${nextAttrs}${close}>`
  })
}

/**
 * 선 두께 값을 계산한다.
 * - download: 출력 높이에서 컨트롤 두께(px)로 보이도록 viewBox 단위로 스케일한 절대 두께.
 * - preview: 화면 픽셀 기준 두께(최소 표시 플로어 보장, non-scaling-stroke와 함께 사용).
 */
function resolveStrokeWidth(
  merged: MergedSvgResult,
  options: Pick<IconPlusPropertyOptions, 'strokeWidth' | 'outputHeight' | 'minDisplayPx'>
): { downloadViewBox: number; previewPx: number } {
  const strokeWidth = Math.max(options.strokeWidth, 0)
  const outputHeight = clampPositive(options.outputHeight ?? merged.height, merged.height || 1)
  const downloadViewBox = merged.height > 0 ? (strokeWidth * merged.height) / outputHeight : strokeWidth
  const previewPx = Math.max(strokeWidth, options.minDisplayPx ?? 1)
  return { downloadViewBox, previewPx }
}

/** 종횡비를 유지하며 출력 높이에서 폭을 계산한다. */
export function scaleWidthFromHeight(width: number, height: number, outputHeight: number): number {
  if (height <= 0) return outputHeight
  return Number(((width / height) * outputHeight).toFixed(3))
}

/** SVG 루트 태그의 지정 속성을 설정(있으면 교체, 없으면 추가)한다. */
function setSvgRootAttributes(svgContent: string, attributes: Record<string, string>): string {
  return svgContent.replace(/<svg\b[^>]*>/i, (tag) => {
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
