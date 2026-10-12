import { describe, expect, it } from 'vitest'
import { buildQrMatrix, isDark } from './matrix'
import { computeLayout, minQrSize, previewSize, qrOutputSizeError, qrSizeError } from './render'
import { renderQrSvg } from './svg'
import { isKnocked, logoPlacement } from './logo'
import { contrastRatio, parseHex, scanWarnings } from './contrast'
import { DEFAULT_LOGO_PERCENT, EC_LEVEL_OPTIONS, LOGO_MAX_KNOCKOUT_AREA, LOGO_MIN_VERSION, LOGO_PERCENT_RANGE, getQrFormat, normalizeQrText, qrFileName, QR_BYTE_CAPACITY, QR_FORMATS, SIZE_PRESETS, utf8ByteLength } from './options'

describe('buildQrMatrix', () => {
  it('짧은 URL은 버전 1~3 크기(21~29)의 정사각 행렬을 만든다', () => {
    const r = buildQrMatrix('https://example.com', 'M')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.matrix.size).toBe(17 + r.matrix.version * 4)
    expect(r.matrix.dark.length).toBe(r.matrix.size ** 2)
  })

  it('왼쪽 위 파인더 패턴(7×7 테두리)이 어둡다', () => {
    const r = buildQrMatrix('hello', 'L')
    if (!r.ok) throw new Error('fail')
    const m = r.matrix
    for (let i = 0; i < 7; i++) {
      expect(isDark(m, 0, i)).toBe(true)
      expect(isDark(m, i, 0)).toBe(true)
      expect(isDark(m, 6, i)).toBe(true)
      expect(isDark(m, i, 6)).toBe(true)
    }
    expect(isDark(m, 1, 1)).toBe(false)
    expect(isDark(m, 3, 3)).toBe(true)
  })

  it('오류 정정이 높을수록 같은 내용도 행렬이 커지거나 같다', () => {
    const text = 'https://example.com/path?query=1234567890'
    const l = buildQrMatrix(text, 'L')
    const h = buildQrMatrix(text, 'H')
    if (!l.ok || !h.ok) throw new Error('fail')
    expect(h.matrix.size).toBeGreaterThanOrEqual(l.matrix.size)
  })

  it('한글·이모지도 만들 수 있다', () => {
    expect(buildQrMatrix('안녕하세요 QR 😀', 'M').ok).toBe(true)
  })

  it('용량을 넘으면 안내 문구를 돌려준다', () => {
    const r = buildQrMatrix('a'.repeat(QR_BYTE_CAPACITY.M + 500), 'M')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('너무 길어')
  })
})

describe('computeLayout', () => {
  it('모듈을 정수 px로 맞추고 남는 픽셀을 양쪽 여백에 나눈다', () => {
    // 25모듈 + 여백 4×2 = 33, 1024 / 33 = 31.03 → 31px
    const l = computeLayout(25, 1024, 4)
    expect(l).toEqual({ total: 33, moduleSize: 31, offset: Math.floor((1024 - 25 * 31) / 2) })
  })

  it('QR 본체와 양쪽 여백이 캔버스를 벗어나지 않는다', () => {
    for (const size of [100, 257, 512, 1000, 2048]) {
      const l = computeLayout(29, size, 4)
      if (!l) continue
      expect(l.offset).toBeGreaterThanOrEqual(l.moduleSize * 4)
      expect(l.offset + 29 * l.moduleSize).toBeLessThanOrEqual(size)
    }
  })

  it('모듈이 1px 미만이면 null, 최소 크기는 모듈 수 + 여백', () => {
    expect(computeLayout(25, 32, 4)).toBeNull()
    expect(minQrSize(25, 4)).toBe(33)
    expect(computeLayout(25, 33, 4)?.moduleSize).toBe(1)
  })
})

describe('previewSize', () => {
  it('모듈 정수 배이고 목표에 가깝다', () => {
    expect(previewSize(25, 4, 640, 2)).toBe(33 * 19)
    expect(previewSize(177, 4, 640, 2) % (177 + 8)).toBe(0)
  })
  it('목표보다 모듈이 많아도 최소 모듈 크기를 지킨다', () => {
    expect(previewSize(177, 4, 100, 2)).toBe((177 + 8) * 2)
  })
})

describe('options', () => {
  it('앞뒤 공백·개행을 제외한다', () => {
    expect(normalizeQrText('  https://a.com\n')).toBe('https://a.com')
  })
  it('바이트 수는 UTF-8 기준이다', () => {
    expect(utf8ByteLength('abc')).toBe(3)
    expect(utf8ByteLength('한')).toBe(3)
  })
})

describe('contrast', () => {
  it('검정/흰색 대비는 21:1, 같은 색은 1:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5)
  })
  it('잘못된 색은 파싱하지 않는다', () => {
    expect(parseHex('#fff')).toBeNull()
    expect(parseHex('red')).toBeNull()
    expect(parseHex('#FF0000')).toEqual([255, 0, 0])
  })
})

describe('scanWarnings', () => {
  const base = { fg: '#000000', bg: '#ffffff', bgTransparent: false, margin: 4, moduleSize: 10 }
  const keys = (o: Partial<typeof base>) => scanWarnings({ ...base, ...o }).map((w) => w.key)

  it('기본값은 경고가 없다', () => expect(keys({})).toEqual([]))
  it('반전(밝은 점 + 어두운 배경)', () => expect(keys({ fg: '#ffffff', bg: '#000000' })).toEqual(['inverted']))
  it('대비가 낮으면 안내', () => expect(keys({ fg: '#cccccc' })).toEqual(['contrast']))
  it('대비가 충분한 유색 조합은 경고 없음', () => expect(keys({ fg: '#1e3a8a', bg: '#fef9c3' })).toEqual([]))
  it('투명 배경은 대비 대신 투명 안내만', () => expect(keys({ bgTransparent: true, fg: '#ffffff' })).toEqual(['transparent']))
  it('여백 1칸 이하·점 3px 미만', () => expect(keys({ margin: 1, moduleSize: 2 })).toEqual(['margin', 'module']))
  it('여백 2칸·점 3px은 경계 통과', () => expect(keys({ margin: 2, moduleSize: 3 })).toEqual([]))
})

describe('qrSizeError', () => {
  it('정상 크기는 null', () => expect(qrSizeError(25, 1024, 4)).toBeNull())
  it('소수·NaN은 정수 안내', () => {
    expect(qrSizeError(25, 512.5, 4)).toContain('정수')
    expect(qrSizeError(25, NaN, 4)).toContain('정수')
  })
  it('모듈 수 + 여백보다 작으면 최소 크기를 알려준다', () => expect(qrSizeError(25, 20, 4)).toContain('최소 33px'))
  it('상한 초과는 공용 검증 문구', () => expect(qrSizeError(25, 20000, 4)).toContain('16,384'))
})

describe('EC_LEVEL_OPTIONS', () => {
  it('L·M·Q·H 네 가지가 순서대로 있고 라벨에 수준 문자·복원율·용도가 들어 있다', () => {
    expect(EC_LEVEL_OPTIONS.map((o) => o.value)).toEqual(['L', 'M', 'Q', 'H'])
    const percents = ['7%', '15%', '25%', '30%']
    EC_LEVEL_OPTIONS.forEach((o, i) => {
      expect(o.label).toContain(`(${o.value})`)
      expect(o.label).toContain(percents[i])
      expect(o.label).toContain('—')
      expect(o.hint.length).toBeGreaterThan(10)
    })
  })
})

describe('renderQrSvg', () => {
  const m = (() => {
    const r = buildQrMatrix('hello', 'M')
    if (!r.ok) throw new Error('fail')
    return r.matrix
  })()

  it('viewBox는 여백 포함 모듈 수, width/height는 요청 크기', () => {
    const svg = renderQrSvg(m, 512, 4, { fg: '#000000', bg: '#ffffff' })
    expect(svg).toContain(`viewBox="0 0 ${m.size + 8} ${m.size + 8}"`)
    expect(svg).toContain('width="512" height="512"')
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
  })

  it('경로의 칠해진 면적 = 어두운 모듈 수(가로 구간 합)', () => {
    const svg = renderQrSvg(m, 256, 0, { fg: '#000000', bg: '#ffffff' })
    const d = svg.match(/ d="([^"]*)"/)![1]
    const area = [...d.matchAll(/h(\d+)v1/g)].reduce((a, x) => a + Number(x[1]), 0)
    expect(area).toBe(m.dark.reduce((a, v) => a + v, 0))
  })

  it('여백만큼 경로 좌표가 밀린다', () => {
    const a = renderQrSvg(m, 256, 0, { fg: '#000000', bg: null }).match(/ d="M(\d+) (\d+)/)!
    const b = renderQrSvg(m, 256, 3, { fg: '#000000', bg: null }).match(/ d="M(\d+) (\d+)/)!
    expect([Number(b[1]) - Number(a[1]), Number(b[2]) - Number(a[2])]).toEqual([3, 3])
  })

  it('투명 배경이면 배경 rect가 없다', () => {
    expect(renderQrSvg(m, 256, 4, { fg: '#000000', bg: null })).not.toContain('<rect')
    expect(renderQrSvg(m, 256, 4, { fg: '#000000', bg: '#fef9c3' })).toContain('<rect width="')
  })

  it('색상은 #rrggbb만 허용한다(속성 주입 방지)', () => {
    expect(() => renderQrSvg(m, 256, 4, { fg: '#000" onload="x', bg: '#ffffff' })).toThrow()
    expect(() => renderQrSvg(m, 256, 4, { fg: '#000000', bg: 'red' })).toThrow()
  })
})

describe('qrOutputSizeError', () => {
  it('PNG는 기존 규칙(모듈 수·픽셀 상한)', () => {
    expect(qrOutputSizeError('png', 25, 20, 4)).toContain('최소 33px')
  })
  it('SVG는 정수·상한만 본다 — 작아도(1px) 큰 크기(16384)도 가능', () => {
    expect(qrOutputSizeError('svg', 25, 20, 4)).toBeNull()
    expect(qrOutputSizeError('svg', 25, 16384, 4)).toBeNull()
    expect(qrOutputSizeError('svg', 25, 16385, 4)).toContain('16,384')
    expect(qrOutputSizeError('svg', 25, 0, 4)).toContain('정수')
    expect(qrOutputSizeError('svg', 25, 1.5, 4)).toContain('정수')
  })
})

describe('qrFileName · 형식 · 프리셋', () => {
  it('확장자·기본 이름·금지 문자', () => {
    expect(qrFileName('', 'png')).toBe('qrcode.png')
    expect(qrFileName('  ', 'svg')).toBe('qrcode.svg')
    expect(qrFileName('내/파일:명', 'svg')).toBe('내_파일_명.svg')
  })
  it('형식 2종·프리셋 4종', () => {
    expect(QR_FORMATS.map((f) => f.value)).toEqual(['png', 'svg'])
    expect(getQrFormat('svg').mime).toBe('image/svg+xml')
    expect([...SIZE_PRESETS]).toEqual([256, 512, 1024, 2048])
  })
})

describe('buildQrMatrix minVersion', () => {
  it('짧은 내용은 최소 버전으로 올리고, 이미 크면 그대로 둔다', () => {
    const small = buildQrMatrix('hi', 'H')
    const raised = buildQrMatrix('hi', 'H', LOGO_MIN_VERSION)
    if (!small.ok || !raised.ok) throw new Error('fail')
    expect(small.matrix.version).toBeLessThan(LOGO_MIN_VERSION)
    expect(raised.matrix.version).toBe(LOGO_MIN_VERSION)
    expect(raised.matrix.size).toBe(17 + 4 * LOGO_MIN_VERSION)
    const big = buildQrMatrix('x'.repeat(300), 'H', LOGO_MIN_VERSION)
    if (!big.ok) throw new Error('fail')
    expect(big.matrix.version).toBeGreaterThan(LOGO_MIN_VERSION)
  })
  it('최소 버전으로 올려도 내용이 넘치면 용량 오류', () => {
    expect(buildQrMatrix('a'.repeat(5000), 'H', LOGO_MIN_VERSION).ok).toBe(false)
  })
})

describe('logoPlacement', () => {
  const sizes = [17 + 4 * LOGO_MIN_VERSION, 37, 41, 57, 81, 101, 133, 177]
  const percents = [LOGO_PERCENT_RANGE.min, DEFAULT_LOGO_PERCENT, LOGO_PERCENT_RANGE.max]

  it('모든 크기·로고 크기에서 가운데 정렬(홀짝 일치)이고 지우는 면적이 상한 이하', () => {
    for (const n of sizes) for (const pct of percents) {
      const p = logoPlacement(n, pct)
      expect(Number.isInteger(p.start)).toBe(true)
      expect(p.start * 2 + p.knock).toBe(n) // 양쪽 대칭
      expect(p.knock * p.knock).toBeLessThanOrEqual(LOGO_MAX_KNOCKOUT_AREA * n * n)
      expect(p.side).toBeLessThanOrEqual(p.knock) // 로고가 지운 영역 안
    }
  })
  it('지움 면적 상한은 실측 안전 한계(10%) 이하로 유지한다 — 함부로 올리면 작은 QR에서 스캔이 불안해진다', () => {
    expect(LOGO_MAX_KNOCKOUT_AREA).toBeLessThanOrEqual(0.1)
  })
  it('로고 변이 요청 비율에 가깝고, 클수록 커진다', () => {
    const n = 57
    const a = logoPlacement(n, 10), b = logoPlacement(n, 20), c = logoPlacement(n, 25)
    expect(a.side).toBeCloseTo(5.7, 5)
    expect(b.side).toBeCloseTo(11.4, 5)
    expect(a.side).toBeLessThan(b.side)
    expect(b.side).toBeLessThan(c.side)
  })
  it('지움 영역은 파인더(모서리 7×7)와 겹치지 않는다', () => {
    for (const n of sizes) {
      const p = logoPlacement(n, LOGO_PERCENT_RANGE.max)
      expect(p.start).toBeGreaterThan(8)
    }
  })
  it('isKnocked: 영역 안쪽만 true', () => {
    const p = logoPlacement(37, 20)
    expect(isKnocked(p, p.start, p.start)).toBe(true)
    expect(isKnocked(p, p.start + p.knock - 1, p.start + p.knock - 1)).toBe(true)
    expect(isKnocked(p, p.start - 1, p.start)).toBe(false)
    expect(isKnocked(p, p.start + p.knock, 18)).toBe(false)
    expect(isKnocked(p, 0, 0)).toBe(false)
  })
})

describe('SVG 로고', () => {
  const r = buildQrMatrix('https://example.com', 'H', LOGO_MIN_VERSION)
  if (!r.ok) throw new Error('fail')
  const m = r.matrix
  const href = 'data:image/png;base64,iVBORw0KGgo='
  const paint = { fg: '#000000', bg: '#ffffff' }
  const area = (svg: string) => [...svg.match(/ d="([^"]*)"/)![1].matchAll(/h(\d+)v1/g)].reduce((a, x) => a + Number(x[1]), 0)

  it('로고 영역 모듈은 경로에서 빠지고 <image>가 가운데에 들어간다', () => {
    const plain = renderQrSvg(m, 512, 4, paint)
    const withLogo = renderQrSvg(m, 512, 4, paint, { href, aspect: 1, percent: 20 })
    expect(area(withLogo)).toBeLessThan(area(plain))
    const p = logoPlacement(m.size, 20)
    let inside = 0
    for (let row = p.start; row < p.start + p.knock; row++) for (let col = p.start; col < p.start + p.knock; col++) inside += m.dark[row * m.size + col]
    expect(area(plain) - area(withLogo)).toBe(inside)
    const total = m.size + 8
    const img = withLogo.match(/<image href="[^"]+" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/)!
    expect(Number(img[1]) + Number(img[3]) / 2).toBeCloseTo(total / 2, 3)
    expect(Number(img[2]) + Number(img[4]) / 2).toBeCloseTo(total / 2, 3)
    expect(Number(img[3])).toBeCloseTo(p.side, 3)
  })
  it('가로로 긴 로고는 높이가 줄어 비율을 유지한다', () => {
    const svg = renderQrSvg(m, 512, 4, paint, { href, aspect: 4, percent: 20 })
    const img = svg.match(/width="([\d.]+)" height="([\d.]+)"\/><\/svg>/)!
    expect(Number(img[1]) / Number(img[2])).toBeCloseTo(4, 2)
  })
  it('PNG data URL이 아니면 거부(속성 주입 방지)', () => {
    expect(() => renderQrSvg(m, 512, 4, paint, { href: 'javascript:alert(1)', aspect: 1, percent: 20 })).toThrow()
    expect(() => renderQrSvg(m, 512, 4, paint, { href: 'data:image/png;base64,AA" onload="x', aspect: 1, percent: 20 })).toThrow()
  })
  it('로고 없으면 <image>가 없다', () => expect(renderQrSvg(m, 512, 4, paint)).not.toContain('<image'))
})

describe('scanWarnings 로고', () => {
  it('로고가 있으면 스캔 확인 안내를 추가한다', () => {
    const base = { fg: '#000000', bg: '#ffffff', bgTransparent: false, margin: 4, moduleSize: 10 }
    expect(scanWarnings({ ...base, hasLogo: true }).map((w) => w.key)).toEqual(['logo'])
    expect(scanWarnings(base)).toEqual([])
  })
})
