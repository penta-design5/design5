import { describe, it, expect } from 'vitest'
import { mergeSvgsByAnchor } from './merge-svg'

const MAIN = {
  svgContent:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path data-main d="M0 0h24v24H0z"/></svg>',
  width: 24,
  height: 24,
}

const RESOURCE = {
  svgContent:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12"><circle data-res cx="6" cy="6" r="6"/></svg>',
  width: 12,
  height: 12,
}

describe('mergeSvgsByAnchor', () => {
  it('anchor가 null이면 null을 반환한다', () => {
    expect(mergeSvgsByAnchor({ ...MAIN, anchorX: null, anchorY: null }, RESOURCE)).toBeNull()
  })

  it('main/merge 두 레이어를 가진 SVG를 생성한다', () => {
    const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 20, anchorY: 20 }, RESOURCE)

    expect(result).not.toBeNull()
    expect(result!.svgContent).toContain('data-layer="main"')
    expect(result!.svgContent).toContain('data-layer="merge"')
    expect(result!.svgContent).toContain('data-main')
    expect(result!.svgContent).toContain('data-res')
  })

  it('anchor + 리소스 크기가 메인을 넘으면 결과 크기를 확장한다', () => {
    // anchorX=20, resource width=12 → 20+12=32 > main 24 → 32
    const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 20, anchorY: 20 }, RESOURCE)

    expect(result!.width).toBe(32)
    expect(result!.height).toBe(32)
    expect(result!.viewBox).toBe('0 0 32 32')
  })

  it('anchor가 메인 내부면 메인 크기를 유지한다', () => {
    // anchorX=4, resource width=12 → 16 < main 24 → 24 유지
    const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 4, anchorY: 4 }, RESOURCE)

    expect(result!.width).toBe(24)
    expect(result!.height).toBe(24)
    expect(result!.viewBox).toBe('0 0 24 24')
  })
})
