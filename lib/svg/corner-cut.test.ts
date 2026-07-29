import { describe, it, expect } from 'vitest'
import {
  applyCornerCutToSvg,
  buildCutMaskDefs,
  buildCutMaskId,
  isValidCornerCut,
  CUT_MASK_PADDING_RATIO,
} from './corner-cut'

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M2 2h20v20H2z" stroke="#000"/></svg>'

const CUT = { cutX: 20.4, cutY: 20.4, cutRadius: 5.28 }

describe('isValidCornerCut', () => {
  it('3값이 모두 유효할 때만 true', () => {
    expect(isValidCornerCut(CUT)).toBe(true)
    expect(isValidCornerCut(null)).toBe(false)
    expect(isValidCornerCut(undefined)).toBe(false)
    expect(isValidCornerCut({ cutX: 1, cutY: 1 })).toBe(false)
    expect(isValidCornerCut({ cutX: 1, cutY: 1, cutRadius: null })).toBe(false)
  })

  it('반경이 0 이하이거나 유한하지 않으면 false', () => {
    expect(isValidCornerCut({ ...CUT, cutRadius: 0 })).toBe(false)
    expect(isValidCornerCut({ ...CUT, cutRadius: -3 })).toBe(false)
    expect(isValidCornerCut({ ...CUT, cutRadius: Number.NaN })).toBe(false)
    expect(isValidCornerCut({ ...CUT, cutX: Number.POSITIVE_INFINITY })).toBe(false)
  })

  it('음수 중심 좌표는 허용한다(아이콘 밖 절단)', () => {
    expect(isValidCornerCut({ cutX: -2, cutY: -2, cutRadius: 4 })).toBe(true)
  })
})

describe('applyCornerCutToSvg', () => {
  it('cut이 null이면 원본 문자열을 그대로 반환한다', () => {
    expect(applyCornerCutToSvg(SVG, null, 'm1')).toBe(SVG)
  })

  it('반경이 0이면 마스킹하지 않는다', () => {
    expect(applyCornerCutToSvg(SVG, { ...CUT, cutRadius: 0 }, 'm1')).toBe(SVG)
  })

  it('SVG 루트 태그가 없으면 손대지 않는다', () => {
    const notSvg = '<div>nope</div>'
    expect(applyCornerCutToSvg(notSvg, CUT, 'm1')).toBe(notSvg)
  })

  it('제약 ①: <defs>가 mask를 쓰는 <g>보다 앞에 위치한다', () => {
    const out = applyCornerCutToSvg(SVG, CUT, 'm1')

    expect(out.indexOf('<defs>')).toBeGreaterThan(-1)
    expect(out.indexOf('<defs>')).toBeLessThan(out.indexOf('<g mask='))
  })

  it('제약 ②: 마스크 도형에 fill을 명시하고 stroke를 쓰지 않는다', () => {
    const out = applyCornerCutToSvg(SVG, CUT, 'm1')
    const defs = out.slice(out.indexOf('<defs>'), out.indexOf('</defs>'))

    expect(defs).toContain('fill="#fff"')
    expect(defs).toContain('fill="#000"')
    // stroke가 있고 fill이 없는 요소는 globals.css가 fill:none으로 덮어써 마스크가 깨진다
    expect(defs).not.toContain('stroke')
  })

  it('제약 ③: mask를 부여한 래퍼 <g>에는 transform이 없다', () => {
    const out = applyCornerCutToSvg(SVG, CUT, 'm1')
    const wrapper = out.match(/<g mask="[^"]+"[^>]*>/)![0]

    expect(wrapper).not.toContain('transform')
  })

  it('maskUnits="userSpaceOnUse"와 25% 확장 영역을 사용한다', () => {
    const out = applyCornerCutToSvg(SVG, CUT, 'm1')

    expect(out).toContain('maskUnits="userSpaceOnUse"')
    // viewBox 0 0 24 24 → 25% 확장 → x=-6 y=-6 width=36 height=36
    expect(out).toContain('x="-6" y="-6" width="36" height="36"')
    expect(CUT_MASK_PADDING_RATIO).toBe(0.25)
  })

  it('주입한 maskId가 id와 url(#…)에 동일하게 반영된다', () => {
    const out = applyCornerCutToSvg(SVG, CUT, 'iconplus-cut-abc-TOP_RIGHT')

    expect(out).toContain('<mask id="iconplus-cut-abc-TOP_RIGHT"')
    expect(out).toContain('<g mask="url(#iconplus-cut-abc-TOP_RIGHT)">')
  })

  it('원본 내용(inner)을 보존하고 원 좌표를 그대로 사용한다', () => {
    const out = applyCornerCutToSvg(SVG, CUT, 'm1')

    expect(out).toContain('<path d="M2 2h20v20H2z" stroke="#000"/>')
    expect(out).toContain('<circle cx="20.4" cy="20.4" r="5.28" fill="#000"/>')
    expect(out.endsWith('</g></svg>')).toBe(true)
  })

  it('viewBox min이 0이 아닌 SVG도 그 좌표계로 마스크 영역을 잡는다', () => {
    const shifted = '<svg viewBox="10 10 20 20" width="20" height="20"><path d="M0 0h1v1H0z"/></svg>'
    const out = applyCornerCutToSvg(shifted, CUT, 'm1')

    // minX=10 minY=10 w=20 h=20 → pad 5 → x=5 y=5 width=30 height=30
    expect(out).toContain('x="5" y="5" width="30" height="30"')
  })

  it('viewBox가 없으면 width/height로 영역을 잡는다', () => {
    const noViewBox = '<svg width="16" height="16"><path d="M0 0h1v1H0z"/></svg>'
    const out = applyCornerCutToSvg(noViewBox, CUT, 'm1')

    // 0 0 16 16 → pad 4 → x=-4 y=-4 width=24 height=24
    expect(out).toContain('x="-4" y="-4" width="24" height="24"')
  })
})

describe('buildCutMaskDefs', () => {
  it('defs와 maskAttr을 함께 반환한다', () => {
    const { defs, maskAttr } = buildCutMaskDefs({
      maskId: 'm2',
      cut: CUT,
      bounds: { minX: 0, minY: 0, width: 24, height: 24 },
    })

    expect(maskAttr).toBe('url(#m2)')
    expect(defs.startsWith('<defs><mask id="m2"')).toBe(true)
    expect(defs.endsWith('</mask></defs>')).toBe(true)
    // 흰 사각형(보이는 영역) → 검은 원(투명해질 영역) 순서
    expect(defs.indexOf('fill="#fff"')).toBeLessThan(defs.indexOf('fill="#000"'))
  })
})

describe('buildCutMaskId', () => {
  it('리소스 id와 위치를 조합해 고유 id를 만든다', () => {
    expect(buildCutMaskId('cms5m0d44', 'TOP_RIGHT')).toBe('iconplus-cut-cms5m0d44-TOP_RIGHT')
  })

  it('id에 쓸 수 없는 문자는 제거한다', () => {
    expect(buildCutMaskId('a b"c<d', 'BOTTOM_RIGHT')).toBe('iconplus-cut-abcd-BOTTOM_RIGHT')
  })
})
