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

  // --- P8: 오프셋 정규화 + 절단 마스크 ---

  describe('오프셋 정규화 (음수 anchor)', () => {
    it('anchor ≥ 0이면 출력이 P8 이전과 동일하다(회귀)', () => {
      const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 20, anchorY: 20 }, RESOURCE)

      // off = 0 → 평행이동 없음. 마스크 미지정이므로 구조도 종전과 같다.
      expect(result!.svgContent).toBe(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">' +
          '<g data-layer="main" transform="translate(0 0)"><path data-main d="M0 0h24v24H0z"/></g>' +
          '<g data-layer="merge" transform="translate(20 20)"><circle data-res cx="6" cy="6" r="6"/></g>' +
          '</svg>'
      )
    })

    it('anchorY가 음수면(우측 상단 프리셋) 잘리지 않고 결과 높이가 확장된다', () => {
      // anchorY=-6 → top=-6, bottom=24 → height=30, offY=6
      const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 18, anchorY: -6 }, RESOURCE)

      expect(result!.height).toBe(30)
      expect(result!.width).toBe(30) // max(24, 18+12)=30, left=0
      expect(result!.viewBox).toBe('0 0 30 30')
      // 메인은 아래로 6 밀리고, 배지는 y=0에서 시작해 잘리지 않는다
      expect(result!.svgContent).toContain('<g data-layer="main" transform="translate(0 6)">')
      expect(result!.svgContent).toContain('<g data-layer="merge" transform="translate(18 0)">')
    })

    it('viewBox min은 항상 0을 유지한다(canvas 래스터화 호환)', () => {
      const result = mergeSvgsByAnchor({ ...MAIN, anchorX: -10, anchorY: -10 }, RESOURCE)

      expect(result!.viewBox).toBe('0 0 34 34')
      expect(result!.svgContent).toContain('<g data-layer="main" transform="translate(10 10)">')
      expect(result!.svgContent).toContain('<g data-layer="merge" transform="translate(0 0)">')
    })
  })

  describe('앵커 기준 코너 (anchorBasis)', () => {
    it('기본값(TOP_LEFT)은 기존 동작 — 앵커에 리소스 좌상단이 붙는다', () => {
      const implicit = mergeSvgsByAnchor({ ...MAIN, anchorX: 15, anchorY: 15 }, RESOURCE)
      const explicit = mergeSvgsByAnchor(
        { ...MAIN, anchorX: 15, anchorY: 15, anchorBasis: 'TOP_LEFT' },
        RESOURCE
      )

      expect(implicit!.svgContent).toBe(explicit!.svgContent)
      expect(implicit!.svgContent).toContain('<g data-layer="merge" transform="translate(15 15)">')
    })

    it('BOTTOM_LEFT는 앵커에 리소스 좌하단이 붙는다(높이만큼 위로 배치)', () => {
      // resource height=12, anchorY=20 → 리소스 상단 y = 20 - 12 = 8
      const result = mergeSvgsByAnchor(
        { ...MAIN, anchorX: 15, anchorY: 20, anchorBasis: 'BOTTOM_LEFT' },
        RESOURCE
      )

      expect(result!.svgContent).toContain('<g data-layer="merge" transform="translate(15 8)">')
      // main 24 안에 들어가므로 크기 변화 없음(가로는 15+12=27로 확장)
      expect(result!.height).toBe(24)
      expect(result!.width).toBe(27)
    })

    it('BOTTOM_LEFT에서 리소스가 위로 넘치면 평행이동으로 잘리지 않는다', () => {
      // anchorY=6, height=12 → 상단 y=-6 → offY=6, 결과 높이 30
      const result = mergeSvgsByAnchor(
        { ...MAIN, anchorX: 18, anchorY: 6, anchorBasis: 'BOTTOM_LEFT' },
        RESOURCE
      )

      expect(result!.height).toBe(30)
      expect(result!.viewBox).toBe('0 0 30 30')
      expect(result!.svgContent).toContain('<g data-layer="main" transform="translate(0 6)">')
      expect(result!.svgContent).toContain('<g data-layer="merge" transform="translate(18 0)">')
    })

    it('BOTTOM_LEFT는 높이가 다른 리소스의 아래쪽 변을 같은 y에 정렬한다', () => {
      const tall = { ...RESOURCE, height: 20, svgContent: RESOURCE.svgContent.replace('0 0 12 12', '0 0 12 20') }
      const short = RESOURCE

      const tallResult = mergeSvgsByAnchor(
        { ...MAIN, anchorX: 15, anchorY: 22, anchorBasis: 'BOTTOM_LEFT' },
        tall
      )
      const shortResult = mergeSvgsByAnchor(
        { ...MAIN, anchorX: 15, anchorY: 22, anchorBasis: 'BOTTOM_LEFT' },
        short
      )

      // 두 결과 모두 하단이 y=22에 맞춰진다: 상단 = 22 - 각자 높이
      expect(tallResult!.svgContent).toContain('transform="translate(15 2)"')
      expect(shortResult!.svgContent).toContain('transform="translate(15 10)"')
    })

    it('마스크와 함께 써도 절단 원 좌표는 앵커 기준과 무관하다', () => {
      const result = mergeSvgsByAnchor(
        {
          ...MAIN,
          anchorX: 15,
          anchorY: 6,
          anchorBasis: 'BOTTOM_LEFT',
          cutX: 20,
          cutY: 4,
          cutRadius: 5,
          maskId: 'm1',
        },
        RESOURCE
      )

      // offY=6 → cy = 4 - 0 + 6 = 10 (원은 메인과 함께 이동)
      expect(result!.svgContent).toContain('<circle cx="20" cy="10" r="5" fill="#000"/>')
    })
  })

  describe('절단 마스크', () => {
    const CUT = { cutX: 20, cutY: 20, cutRadius: 5 }

    it('cut 3값이 모두 있으면 마스크를 삽입한다', () => {
      const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 15, anchorY: 15, ...CUT, maskId: 'm1' }, RESOURCE)

      expect(result!.svgContent).toContain('<mask id="m1"')
      expect(result!.svgContent).toContain('<g data-layer="main" mask="url(#m1)">')
    })

    it('cut 3값 중 하나라도 없으면 마스크를 삽입하지 않는다', () => {
      const noRadius = mergeSvgsByAnchor(
        { ...MAIN, anchorX: 15, anchorY: 15, cutX: 20, cutY: 20, cutRadius: null, maskId: 'm1' },
        RESOURCE
      )
      const noCenter = mergeSvgsByAnchor(
        { ...MAIN, anchorX: 15, anchorY: 15, cutX: null, cutY: null, cutRadius: 5, maskId: 'm1' },
        RESOURCE
      )

      expect(noRadius!.svgContent).not.toContain('<mask')
      expect(noCenter!.svgContent).not.toContain('<mask')
      expect(noRadius!.svgContent).toContain('<g data-layer="main" transform=')
    })

    it('제약 ①: <defs>가 data-layer="main"보다 앞에 온다', () => {
      const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 15, anchorY: 15, ...CUT, maskId: 'm1' }, RESOURCE)
      const svg = result!.svgContent

      expect(svg.indexOf('<defs>')).toBeGreaterThan(-1)
      expect(svg.indexOf('<defs>')).toBeLessThan(svg.indexOf('data-layer="main"'))
    })

    it('제약 ③: mask 래퍼에는 transform이 없고 translate는 안쪽 <g>가 담당한다', () => {
      const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 15, anchorY: -4, ...CUT, maskId: 'm1' }, RESOURCE)

      expect(result!.svgContent).toContain(
        '<g data-layer="main" mask="url(#m1)"><g transform="translate(0 4)">'
      )
    })

    it('마스크 원 좌표를 결과 좌표계(cut - main.min + off)로 변환한다', () => {
      // main viewBox min=(0,0), anchorY=-4 → offY=4 → cy = 20 - 0 + 4 = 24
      const result = mergeSvgsByAnchor({ ...MAIN, anchorX: 15, anchorY: -4, ...CUT, maskId: 'm1' }, RESOURCE)

      expect(result!.svgContent).toContain('<circle cx="20" cy="24" r="5" fill="#000"/>')
    })

    it('viewBox min이 0이 아닌 메인도 좌표를 정규화한다', () => {
      const shiftedMain = {
        svgContent:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 24 24" width="24" height="24"><path data-main d="M0 0h1v1H0z"/></svg>',
        width: 24,
        height: 24,
      }
      // main.min=(10,10), anchor=(28,28) → a=(18,18), off=0 → cx = 30 - 10 + 0 = 20
      const result = mergeSvgsByAnchor(
        { ...shiftedMain, anchorX: 28, anchorY: 28, cutX: 30, cutY: 30, cutRadius: 5, maskId: 'm1' },
        RESOURCE
      )

      expect(result!.svgContent).toContain('<circle cx="20" cy="20" r="5" fill="#000"/>')
    })
  })
})
