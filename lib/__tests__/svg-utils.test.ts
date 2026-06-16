import { describe, it, expect } from 'vitest'
import { extractColors, changeSvgColor, resizeSvg } from '@/lib/svg-utils'

describe('svg-utils', () => {
  describe('extractColors', () => {
    it('fill과 stroke 색상을 추출한다', () => {
      const svg = '<svg><path fill="#FF0000" stroke="#00FF00"/></svg>'
      const colors = extractColors(svg)
      expect(colors).toContain('#FF0000')
      expect(colors).toContain('#00FF00')
    })

    it('"none"과 url(...) 참조는 제외한다', () => {
      const svg = '<svg><path fill="none" stroke="url(#grad)"/><rect fill="#123456"/></svg>'
      const colors = extractColors(svg)
      expect(colors).toEqual(['#123456'])
    })

    it('style 속성 내부 색상도 추출한다', () => {
      const svg = '<svg><path style="fill:#abcdef;stroke:#000000"/></svg>'
      const colors = extractColors(svg)
      expect(colors).toContain('#abcdef')
      expect(colors).toContain('#000000')
    })

    it('중복 색상을 제거한다', () => {
      const svg = '<svg><path fill="#111111"/><rect fill="#111111"/></svg>'
      expect(extractColors(svg)).toEqual(['#111111'])
    })
  })

  describe('changeSvgColor', () => {
    it('fill 속성 색상을 교체한다', () => {
      const out = changeSvgColor('<path fill="#000000"/>', '#000000', '#ffffff')
      expect(out).toContain('fill="#ffffff"')
      expect(out).not.toContain('fill="#000000"')
    })

    it('배열로 여러 색상을 한 번에 교체한다', () => {
      const out = changeSvgColor(
        '<path fill="#aaaaaa" stroke="#bbbbbb"/>',
        ['#aaaaaa', '#bbbbbb'],
        '#cccccc'
      )
      expect(out).toContain('fill="#cccccc"')
      expect(out).toContain('stroke="#cccccc"')
    })
  })

  describe('resizeSvg', () => {
    it('width/height를 px 단위로 적용한다', () => {
      const out = resizeSvg('<svg viewBox="0 0 10 10"><rect/></svg>', 100, 50)
      expect(out).toContain('width="100px"')
      expect(out).toContain('height="50px"')
    })

    it('기존 viewBox를 보존한다', () => {
      const out = resizeSvg('<svg viewBox="0 0 10 10"><rect/></svg>', 100, 50)
      expect(out).toContain('viewBox="0 0 10 10"')
    })

    it('문자열 단위 입력을 그대로 사용한다', () => {
      const out = resizeSvg('<svg viewBox="0 0 10 10"></svg>', '2em', '2em')
      expect(out).toContain('width="2em"')
      expect(out).toContain('height="2em"')
    })
  })
})
