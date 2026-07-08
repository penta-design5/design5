import { describe, it, expect } from 'vitest'
import { applyIconPlusProperties, scaleWidthFromHeight } from './icon-plus-properties'
import type { MergedSvgResult } from './merge-svg'

/** main(라인+fill 혼재) + merge 레이어를 가진 병합 결과 스텁 */
const MERGED: MergedSvgResult = {
  svgContent: [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">',
    '<g data-layer="main" transform="translate(0 0)">',
    '<path data-line stroke="#000" d="M0 0h10"/>',
    '<rect data-fill fill="#000" x="0" y="0" width="4" height="4"/>',
    '</g>',
    '<g data-layer="merge" transform="translate(20 20)">',
    '<circle data-res stroke="#000" cx="6" cy="6" r="6"/>',
    '</g>',
    '</svg>',
  ].join(''),
  width: 32,
  height: 32,
  viewBox: '0 0 32 32',
}

describe('scaleWidthFromHeight', () => {
  it('종횡비를 유지하며 폭을 계산한다', () => {
    expect(scaleWidthFromHeight(32, 16, 48)).toBe(96)
  })
  it('height가 0이면 outputHeight를 반환한다', () => {
    expect(scaleWidthFromHeight(10, 0, 24)).toBe(24)
  })
})

describe('applyIconPlusProperties', () => {
  it('스코프된 <style> 블록을 주입하고 루트 크기를 출력값으로 재설정한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#0060A9',
      strokeWidth: 1,
      outputHeight: 48,
      resourceKind: 'icon',
    })

    expect(result.svgContent).toContain('data-icon-plus-properties="true"')
    expect(result.svgContent).toMatch(/<svg[^>]*width="48"/)
    expect(result.svgContent).toMatch(/<svg[^>]*height="48"/)
    expect(result.height).toBe(48)
    expect(result.width).toBe(48) // 32:32 → 정사각
    expect(result.viewBox).toBe('0 0 32 32') // viewBox는 유지(내부 좌표 보존)
  })

  it('선결요건 a: 선 두께는 라인([stroke]:not([fill]))에만, fill 부분은 색상만 적용한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#DD524C',
      strokeWidth: 2,
      outputHeight: 24,
      resourceKind: 'icon',
    })
    const style = result.svgContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)![1]

    // 라인 규칙에만 stroke-width가 붙는다
    const lineRule = style.match(/\[stroke\]:not\(\[fill\]\)\s*\{[^}]*\}/)![0]
    expect(lineRule).toContain('stroke-width')
    expect(lineRule).toContain('fill: none')
    expect(lineRule).toContain('stroke: #DD524C')

    // fill 규칙에는 색상만, stroke-width 없음
    const fillRule = style.match(/\[fill\]:not\(\[fill="none"\]\)\s*\{[^}]*\}/)![0]
    expect(fillRule).toContain('fill: #DD524C')
    expect(fillRule).not.toContain('stroke-width')
  })

  it('아이콘 리소스는 merge 레이어도 라인 처리한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#000',
      strokeWidth: 1,
      outputHeight: 24,
      resourceKind: 'icon',
    })
    expect(result.svgContent).toContain('svg [data-layer="merge"] [stroke]:not([fill])')
  })

  it('텍스트 리소스는 merge 레이어를 채움 색상으로 처리한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#302BCF',
      strokeWidth: 1,
      outputHeight: 24,
      resourceKind: 'text',
    })
    expect(result.svgContent).toContain('svg [data-layer="merge"] * { fill: #302BCF !important; }')
    // 텍스트일 때 merge 레이어는 라인(fill:none) 대상에서 제외
    const style = result.svgContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)![1]
    expect(style).not.toContain('[data-layer="merge"] [stroke]:not([fill])')
  })

  it('preview 모드는 non-scaling-stroke + 최소 표시 두께를 보장한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#000',
      strokeWidth: 0.5,
      outputHeight: 56,
      resourceKind: 'icon',
      mode: 'preview',
      minDisplayPx: 1,
    })
    expect(result.svgContent).toContain('vector-effect: non-scaling-stroke')
    // 0.5 < floor 1 → 1px
    expect(result.svgContent).toContain('stroke-width: 1px')
  })

  it('재적용 시 기존 주입 스타일을 중복 없이 교체한다', () => {
    const once = applyIconPlusProperties(MERGED, {
      color: '#000',
      strokeWidth: 1,
      outputHeight: 24,
      resourceKind: 'icon',
    })
    const twice = applyIconPlusProperties(once, {
      color: '#FFF',
      strokeWidth: 1,
      outputHeight: 24,
      resourceKind: 'icon',
    })
    const count = (twice.svgContent.match(/data-icon-plus-properties/g) ?? []).length
    expect(count).toBe(1)
    expect(twice.svgContent).toContain('stroke: #FFF')
  })
})
