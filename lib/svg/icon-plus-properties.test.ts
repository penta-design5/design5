import { describe, it, expect } from 'vitest'
import { XMLValidator } from 'fast-xml-parser'
import { applyIconPlusProperties, scaleWidthFromHeight } from './icon-plus-properties'
import type { MergedSvgResult } from './merge-svg'

/**
 * main(라인 + fill + fill&stroke 혼재) + merge(라인) 레이어를 가진 병합 결과 스텁.
 * 저장 SVG는 sanitize-html 출력이라 self-closing이 아닌 `<tag></tag>` 형태다.
 */
const MERGED: MergedSvgResult = {
  svgContent: [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">',
    '<g data-layer="main" transform="translate(0 0)">',
    '<path data-line="1" stroke="#000000" d="M0 0h10"></path>',
    '<rect data-fill="1" fill="#000000" x="0" y="0" width="4" height="4"></rect>',
    '<path data-both="1" fill="#000000" stroke="#000000" d="M2 2h4"></path>',
    '</g>',
    '<g data-layer="merge" transform="translate(20 20)">',
    '<circle data-res="1" stroke="#000000" cx="6" cy="6" r="6"></circle>',
    '</g>',
    '</svg>',
  ].join(''),
  width: 32,
  height: 32,
  viewBox: '0 0 32 32',
}

/** 특정 data-* 요소의 열림 태그를 추출 */
function tagOf(svg: string, dataAttr: string): string {
  return svg.match(new RegExp(`<[a-z]+[^>]*\\b${dataAttr}\\b[^>]*>`, 'i'))![0]
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
  it('<style> 주입 없이 루트 크기를 출력값으로 재설정한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#0060A9',
      strokeWidth: 1,
      outputHeight: 48,
      resourceKind: 'icon',
    })

    expect(result.svgContent).not.toContain('<style')
    expect(result.svgContent).toMatch(/<svg[^>]*width="48"/)
    expect(result.svgContent).toMatch(/<svg[^>]*height="48"/)
    expect(result.height).toBe(48)
    expect(result.width).toBe(48) // 32:32 → 정사각
    expect(result.viewBox).toBe('0 0 32 32') // 내부 좌표 보존
  })

  it('라인 획(stroke+fill:none)에 색상/두께를 속성으로 bake한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#0060A9',
      strokeWidth: 2,
      outputHeight: 32, // = 원본 → download 두께 = 2
      resourceKind: 'icon',
    })
    const line = tagOf(result.svgContent, 'data-line')
    expect(line).toContain('stroke="#0060A9"')
    expect(line).toContain('fill="none"')
    expect(line).toMatch(/stroke-width="2"/)
  })

  it('선결요건 a: fill 요소는 색상만, stroke-width는 붙지 않는다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#DD524C',
      strokeWidth: 2,
      outputHeight: 32,
      resourceKind: 'icon',
    })
    // fill 전용
    const fill = tagOf(result.svgContent, 'data-fill')
    expect(fill).toContain('fill="#DD524C"')
    expect(fill).not.toContain('stroke-width')
    // fill + stroke 동시 보유 → 색상은 바뀌되 stroke-width 미적용
    const both = tagOf(result.svgContent, 'data-both')
    expect(both).toContain('fill="#DD524C"')
    expect(both).toContain('stroke="#DD524C"')
    expect(both).not.toContain('stroke-width')
  })

  it('아이콘 리소스는 merge 레이어 라인에도 두께를 적용한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#000000',
      strokeWidth: 1,
      outputHeight: 32,
      resourceKind: 'icon',
    })
    expect(tagOf(result.svgContent, 'data-res')).toMatch(/stroke-width="1"/)
  })

  it('텍스트 리소스는 merge 레이어에 두께를 적용하지 않는다(색상만)', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#302BCF',
      strokeWidth: 1,
      outputHeight: 32,
      resourceKind: 'text',
    })
    const res = tagOf(result.svgContent, 'data-res')
    expect(res).toContain('stroke="#302BCF"')
    expect(res).not.toContain('stroke-width')
  })

  it('preview 모드는 non-scaling-stroke + 최소 표시 두께를 보장한다', () => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#000000',
      strokeWidth: 0.5,
      outputHeight: 56,
      resourceKind: 'icon',
      mode: 'preview',
      minDisplayPx: 1,
    })
    const line = tagOf(result.svgContent, 'data-line')
    expect(line).toContain('vector-effect="non-scaling-stroke"')
    expect(line).toMatch(/stroke-width="1"/) // 0.5 < floor 1 → 1
  })

  it('download 두께는 출력 높이에 맞춰 viewBox 단위로 스케일한다', () => {
    // strokeWidth 2, 결과 높이 32, 출력 48 → 2 * 32/48 = 1.333
    const result = applyIconPlusProperties(MERGED, {
      color: '#000000',
      strokeWidth: 2,
      outputHeight: 48,
      resourceKind: 'icon',
    })
    expect(tagOf(result.svgContent, 'data-line')).toMatch(/stroke-width="1.333"/)
  })

  // 래스터화(PNG/JPG)는 엄격한 XML 파싱을 거치므로 bake 결과가 항상 유효한 XML이어야 한다.
  it.each([
    ['icon', 'download'],
    ['icon', 'preview'],
    ['text', 'download'],
  ] as const)('%s/%s 결과는 유효한 XML이다', (resourceKind, mode) => {
    const result = applyIconPlusProperties(MERGED, {
      color: '#0060A9',
      strokeWidth: 1.5,
      outputHeight: 48,
      resourceKind,
      mode,
    })
    expect(XMLValidator.validate(result.svgContent)).toBe(true)
  })
})
