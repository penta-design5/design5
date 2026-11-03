import { describe, it, expect } from 'vitest'
import {
  createHtmlMenuSchema,
  updateMenuSchema,
  reorderMenusSchema,
  parseHtmlMenuConfig,
  isHtmlMenu,
  isMenuSectionType,
  MENU_HTML_MAX_BYTES,
} from '@/lib/menus/schemas'
import { getHtmlFileError, hasHtmlExtension } from '@/lib/html-document'

describe('createHtmlMenuSchema', () => {
  const valid = { name: '브랜드 가이드', slug: 'brand-guide', type: 'WORK' }

  it('유효한 입력을 통과시키고 앞뒤 공백을 제거한다', () => {
    const parsed = createHtmlMenuSchema.parse({ ...valid, name: '  브랜드 가이드 ', slug: ' brand-guide ' })
    expect(parsed).toEqual(valid)
  })

  it.each(['Brand', 'brand_guide', 'brand--guide', '-brand', 'brand-', '한글', 'a b', ''])(
    'slug "%s"는 거부한다',
    (slug) => {
      expect(createHtmlMenuSchema.safeParse({ ...valid, slug }).success).toBe(false)
    }
  )

  it.each(['admin', 'toolbox', 'penta-design-system', 'api', 'img'])('예약 주소 "%s"는 거부한다', (slug) => {
    const result = createHtmlMenuSchema.safeParse({ ...valid, slug })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0]?.message).toBe('사이트에서 이미 쓰는 주소라 사용할 수 없습니다.')
  })

  it('51자 이상 slug는 거부한다', () => {
    expect(createHtmlMenuSchema.safeParse({ ...valid, slug: 'a'.repeat(51) }).success).toBe(false)
  })

  it.each(['TOOLBOX', 'ETC', 'ADMIN', ''])('관리 대상이 아닌 섹션 "%s"는 거부한다', (type) => {
    expect(createHtmlMenuSchema.safeParse({ ...valid, type }).success).toBe(false)
  })

  it('빈 이름은 거부한다', () => {
    expect(createHtmlMenuSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
  })
})

describe('updateMenuSchema', () => {
  it('일부 항목만 변경할 수 있다', () => {
    expect(updateMenuSchema.parse({ isHidden: true })).toEqual({ isHidden: true })
  })

  it('변경 항목이 없으면 거부한다', () => {
    expect(updateMenuSchema.safeParse({}).success).toBe(false)
  })
})

describe('reorderMenusSchema', () => {
  it('빈 목록은 거부한다', () => {
    expect(reorderMenusSchema.safeParse({ type: 'WORK', ids: [] }).success).toBe(false)
  })
})

describe('parseHtmlMenuConfig', () => {
  const config = {
    html: { url: 'http://minio/posts/menus/a/x.html', fileName: 'a.html', size: 10, updatedAt: '2026-11-03T00:00:00.000Z' },
  }

  it('올바른 config를 해석한다', () => {
    expect(parseHtmlMenuConfig(config)).toEqual(config)
  })

  it.each([null, undefined, {}, { html: { url: '' } }, { allowedTypes: ['CI'] }])('잘못된 config %j는 null', (value) => {
    expect(parseHtmlMenuConfig(value)).toBeNull()
  })
})

describe('isHtmlMenu / isMenuSectionType', () => {
  it('pageType html만 HTML 메뉴다', () => {
    expect(isHtmlMenu({ pageType: 'html' })).toBe(true)
    expect(isHtmlMenu({ pageType: 'gallery' })).toBe(false)
    expect(isHtmlMenu({ pageType: null })).toBe(false)
  })

  it('다섯 섹션만 관리 대상이다', () => {
    expect(['WORK', 'SOURCE', 'TEMPLATE', 'BROCHURE', 'INSIGHTS'].every(isMenuSectionType)).toBe(true)
    expect(['ETC', 'ADMIN'].some(isMenuSectionType)).toBe(false)
  })
})

describe('getHtmlFileError', () => {
  const file = (name: string, type: string, size: number) => ({ name, type, size })

  it('정상 HTML은 null', () => {
    expect(getHtmlFileError(file('a.html', 'text/html', 100), MENU_HTML_MAX_BYTES)).toBeNull()
    expect(getHtmlFileError(file('A.HTM', '', 100), MENU_HTML_MAX_BYTES)).toBeNull()
  })

  it('확장자·MIME·빈 파일·크기 초과를 거부한다', () => {
    expect(getHtmlFileError(file('a.pdf', 'application/pdf', 100), MENU_HTML_MAX_BYTES)).toContain('.html')
    expect(getHtmlFileError(file('a.html', 'image/png', 100), MENU_HTML_MAX_BYTES)).toContain('text/html')
    expect(getHtmlFileError(file('a.html', 'text/html', 0), MENU_HTML_MAX_BYTES)).toContain('빈 파일')
    expect(getHtmlFileError(file('a.html', 'text/html', MENU_HTML_MAX_BYTES + 1), MENU_HTML_MAX_BYTES)).toBe(
      'HTML 문서는 8MB 이하만 업로드할 수 있습니다.'
    )
  })

  it('INSIGHTS 5MB 메시지는 기존과 동일하다', () => {
    expect(getHtmlFileError(file('a.html', 'text/html', 5 * 1024 * 1024 + 1), 5 * 1024 * 1024)).toBe(
      'HTML 문서는 5MB 이하만 업로드할 수 있습니다.'
    )
  })

  it('hasHtmlExtension', () => {
    expect(hasHtmlExtension('doc.html')).toBe(true)
    expect(hasHtmlExtension('doc.html.zip')).toBe(false)
  })
})
