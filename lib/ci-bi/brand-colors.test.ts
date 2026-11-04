import { describe, it, expect } from 'vitest'
import {
  normalizeSvgColor,
  uniqueNormalizedColors,
  findOffBrandColors,
  getRenderedSvgColors,
} from './brand-colors'

describe('normalizeSvgColor', () => {
  it.each([
    ['#3948E5', '#3948e5'],
    ['#3948e5', '#3948e5'],
    ['#fff', '#ffffff'],
    ['#FFFF', '#ffffff'],
    ['#3948e5ff', '#3948e5'],
    ['rgb(57, 72, 229)', '#3948e5'],
    ['rgb(57 72 229 / 1)', '#3948e5'],
    ['rgba(0,0,0,0.5)', '#000000'],
    ['black', '#000000'],
    [' WHITE ', '#ffffff'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeSvgColor(raw)).toBe(expected)
  })

  it.each(['none', 'transparent', 'url(#grad)', 'rgba(0,0,0,0)', '#3948e500', 'currentColor', ''])(
    '%s → null',
    (raw) => {
      expect(normalizeSvgColor(raw)).toBeNull()
    },
  )
})

describe('uniqueNormalizedColors', () => {
  it('표기만 다른 같은 색을 하나로 합친다', () => {
    expect(uniqueNormalizedColors(['#3948E5', 'rgb(57, 72, 229)', '#3948e5', 'black', '#000'])).toEqual([
      '#3948e5',
      '#000000',
    ])
  })
})

describe('findOffBrandColors', () => {
  it('브랜드 색만 있으면 빈 배열', () => {
    expect(findOffBrandColors(['#3948E5', '#000', 'white', '#0060A9', '#999B9E'])).toEqual([])
  })

  it('브랜드 색과 조금이라도 다르면 골라낸다', () => {
    expect(findOffBrandColors(['#3948e5', '#3a49e4', '#3948e6', '#000000'])).toEqual(['#3a49e4', '#3948e6'])
  })

  it('팔레트를 지정할 수 있다', () => {
    expect(findOffBrandColors(['#123456'], [{ hex: '#123456', name: 'x' }])).toEqual([])
  })
})

describe('getRenderedSvgColors', () => {
  it('fill 속성의 색을 통일된 표기로 추출한다', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#3948E5" d="M0 0h1v1z"/><path fill="rgb(0,0,0)" d="M0 0h1v1z"/></svg>'
    expect(getRenderedSvgColors(svg)).toEqual(['#3948e5', '#000000'])
  })

  it('defs·clipPath 안의 도형은 제외한다', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="c"><rect fill="#ff0000" width="1" height="1"/></clipPath></defs><path fill="#3948e5" d="M0 0h1v1z"/></svg>'
    expect(getRenderedSvgColors(svg)).toEqual(['#3948e5'])
  })

  it('fill을 생략한 도형은 기본값 검정으로 본다', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#3948e5" d="M0 0h1v1z"/><path d="M0 0h1v1z"/></svg>'
    expect(getRenderedSvgColors(svg)).toEqual(['#3948e5', '#000000'])
  })

  it('일러스트레이터식 <style> 클래스 색을 반영한다', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><defs><style>.cls-1{fill:#3948E5;}.cls-2,.cls-3{fill:#231f20}</style></defs>' +
      '<path class="cls-1" d="M0 0h1v1z"/><path class="cls-3" d="M0 0h1v1z"/></svg>'
    expect(getRenderedSvgColors(svg)).toEqual(['#3948e5', '#231f20'])
  })

  it('부모 <g>의 fill을 상속하고, 인라인 style이 속성보다 우선한다', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><g fill="#3948e5"><path d="M0 0h1v1z"/>' +
      '<path fill="#ff0000" style="fill:#000" d="M0 0h1v1z"/></g></svg>'
    expect(getRenderedSvgColors(svg)).toEqual(['#3948e5', '#000000'])
  })

  it('stroke를 함께 추출하고 currentColor를 color 값으로 해석한다', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" color="#3948e5"><line stroke="currentColor" fill="none" x2="1"/></svg>'
    expect(getRenderedSvgColors(svg)).toEqual(['#3948e5'])
  })

  it('display:none·opacity 0 요소는 제외한다', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><g display="none"><path fill="#ff0000" d="M0 0h1v1z"/></g>' +
      '<path style="opacity:0" fill="#00ff00" d="M0 0h1v1z"/><path fill="#3948e5" d="M0 0h1v1z"/></svg>'
    expect(getRenderedSvgColors(svg)).toEqual(['#3948e5'])
  })

  it('파싱할 수 없는 문자열이면 빈 배열', () => {
    expect(getRenderedSvgColors('not svg')).toEqual([])
  })
})
