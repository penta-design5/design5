import { describe, expect, it } from 'vitest'
import { MAX_FILE_BYTES, MAX_ZOOM, MIN_ZOOM } from './constants'
import { validateImageFile, validatePixelCount } from './load'
import { centerPosition, clampZoom, fitZoom, zoomAroundPoint } from './view'
import { buildExportFileName, defaultExportBaseName } from './export'
import { MAX_SIDE, linkedDimension, resolveResize, validateOutputSize } from './canvas'

describe('validateImageFile', () => {
  const file = (name: string, type: string, size = 1000) => ({ name, type, size })

  it('지원 형식은 통과', () => {
    expect(validateImageFile(file('a.png', 'image/png'))).toBeNull()
    expect(validateImageFile(file('a.jpg', 'image/jpeg'))).toBeNull()
    expect(validateImageFile(file('a.webp', 'image/webp'))).toBeNull()
    expect(validateImageFile(file('a.gif', 'image/gif'))).toBeNull()
    expect(validateImageFile(file('a.bmp', 'image/bmp'))).toBeNull()
  })

  it('MIME이 비어 있으면 확장자로 판단', () => {
    expect(validateImageFile(file('a.JPEG', ''))).toBeNull()
    expect(validateImageFile(file('a.txt', ''))).not.toBeNull()
  })

  it('HEIC는 전용 안내', () => {
    expect(validateImageFile(file('a.heic', 'image/heic'))).toContain('HEIC')
    expect(validateImageFile(file('a.HEIF', ''))).toContain('HEIC')
  })

  it('미지원 형식·용량 초과·빈 파일 거부', () => {
    expect(validateImageFile(file('a.svg', 'image/svg+xml'))).not.toBeNull()
    expect(validateImageFile(file('a.pdf', 'application/pdf'))).not.toBeNull()
    expect(validateImageFile(file('a.png', 'image/png', MAX_FILE_BYTES))).toBeNull()
    expect(validateImageFile(file('a.png', 'image/png', MAX_FILE_BYTES + 1))).toContain('20MB')
    expect(validateImageFile(file('a.png', 'image/png', 0))).not.toBeNull()
  })
})

describe('validatePixelCount', () => {
  it('4096×4096까지 허용, 초과 거부', () => {
    expect(validatePixelCount(4096, 4096)).toBeNull()
    expect(validatePixelCount(8192, 2048)).toBeNull()
    expect(validatePixelCount(4097, 4096)).not.toBeNull()
  })
})

describe('view', () => {
  it('clampZoom 범위', () => {
    expect(clampZoom(100)).toBe(MAX_ZOOM)
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('fitZoom: 큰 이미지는 축소, 작은 이미지는 100% 유지', () => {
    // 여백 24px×2를 뺀 가용 폭 1024px / 이미지 2048px = 0.5
    expect(fitZoom(2048, 1024, 1072, 1072, 24)).toBeCloseTo(0.5)
    expect(fitZoom(100, 100, 1000, 800)).toBe(1)
  })

  it('centerPosition', () => {
    expect(centerPosition(200, 100, 1000, 500, 1)).toEqual({ x: 400, y: 200 })
    expect(centerPosition(200, 100, 1000, 500, 2)).toEqual({ x: 300, y: 150 })
  })

  it('zoomAroundPoint: 기준점 아래의 이미지 좌표가 유지됨', () => {
    const pos = { x: 100, y: 50 }
    const anchor = { x: 300, y: 250 }
    const next = zoomAroundPoint(pos, 1, 2, anchor)
    // 기준점의 이미지 좌표 = (anchor - pos) / zoom
    expect((anchor.x - next.x) / 2).toBeCloseTo((anchor.x - pos.x) / 1)
    expect((anchor.y - next.y) / 2).toBeCloseTo((anchor.y - pos.y) / 1)
  })
})

describe('export file name', () => {
  it('확장자 제거 + _edited', () => {
    expect(defaultExportBaseName('photo.final.JPG')).toBe('photo.final_edited')
    expect(defaultExportBaseName('clipboard')).toBe('clipboard_edited')
    expect(defaultExportBaseName('.png')).toBe('image_edited')
  })

  it('형식별 확장자 + 금지 문자 치환', () => {
    expect(buildExportFileName('a_edited', 'png')).toBe('a_edited.png')
    expect(buildExportFileName('a_edited', 'jpeg')).toBe('a_edited.jpg')
    expect(buildExportFileName('a_edited', 'webp')).toBe('a_edited.webp')
    expect(buildExportFileName('a/b:c', 'png')).toBe('a_b_c.png')
    expect(buildExportFileName('   ', 'png')).toBe('image_edited.png')
  })
})

describe('validateOutputSize', () => {
  it('정상 범위', () => {
    expect(validateOutputSize({ width: 1, height: 1 })).toBeNull()
    expect(validateOutputSize({ width: 4096, height: 4096 })).toBeNull()
    expect(validateOutputSize({ width: MAX_SIDE, height: 1000 })).toBeNull()
  })

  it('0·음수·NaN, 변 길이 초과, 픽셀 수 초과 거부', () => {
    expect(validateOutputSize({ width: 0, height: 10 })).not.toBeNull()
    expect(validateOutputSize({ width: NaN, height: 10 })).not.toBeNull()
    expect(validateOutputSize({ width: MAX_SIDE + 1, height: 1 })).toContain('한 변')
    expect(validateOutputSize({ width: 6000, height: 4000 })).toContain('1,670만')
  })
})

describe('resize 입력 계산', () => {
  const original = { width: 1920, height: 1080 }

  it('px는 반올림, %는 원본 기준', () => {
    expect(resolveResize(original, 'px', 800.4, 450.6)).toEqual({ width: 800, height: 451 })
    expect(resolveResize(original, 'percent', 50, 50)).toEqual({ width: 960, height: 540 })
    expect(resolveResize(original, 'percent', 200, 100)).toEqual({ width: 3840, height: 1080 })
  })

  it('비율 유지 연동', () => {
    expect(linkedDimension(original, 'px', 'width', 960)).toBe(540)
    expect(linkedDimension(original, 'px', 'height', 540)).toBe(960)
    expect(linkedDimension({ width: 300, height: 200 }, 'px', 'width', 150)).toBe(100)
    expect(linkedDimension(original, 'percent', 'width', 75)).toBe(75)
    // 아주 작은 값도 최소 1px
    expect(linkedDimension(original, 'px', 'width', 1)).toBe(1)
  })
})
