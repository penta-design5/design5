import { describe, it, expect } from 'vitest'
import {
  buildSidebarSections,
  type SidebarCategory,
  type SidebarItem,
} from '@/lib/menus/sidebar-sections'
import { TOOLBOX_MENU } from '@/lib/toolbox/menu'

const cat = (
  id: string,
  type: SidebarCategory['type'],
  extra: Partial<SidebarCategory> = {}
): SidebarCategory => ({ id, name: id, slug: id, type, ...extra })

const categories: SidebarCategory[] = [
  cat('wallpaper', 'WORK'),
  cat('welcomeboard', 'WORK'),
  cat('secret', 'WORK', { isHidden: true }),
  cat('icon', 'SOURCE', {
    children: [cat('icon-line', 'SOURCE'), cat('icon-hidden', 'SOURCE', { isHidden: true })],
  }),
  cat('wapples', 'BROCHURE'),
  cat('report', 'INSIGHTS'),
  cat('edm', 'ETC', { isHidden: true }),
]

const build = (opts: Partial<Parameters<typeof buildSidebarSections>[0]> = {}) =>
  buildSidebarSections({ categories, isAdmin: false, showDesignSystem: false, ...opts })

const section = (sections: ReturnType<typeof build>, id: string) => sections.find((s) => s.id === id)
const hrefs = (items: SidebarItem[] | undefined) => items?.map((i) => i.href)

describe('buildSidebarSections', () => {
  it('섹션 순서를 지키고 빈 일반 섹션(TEMPLATE)은 뺀다', () => {
    expect(build({ isAdmin: true }).map((s) => s.id)).toEqual([
      'WORK',
      'SOURCE',
      'BROCHURE',
      'TOOLBOX',
      'ETC',
      'INSIGHTS',
      'ADMIN',
    ])
  })

  it('카테고리가 없어도 TOOLBOX·LABs는 항상 표시', () => {
    expect(build({ categories: [] }).map((s) => s.id)).toEqual(['TOOLBOX', 'ETC'])
  })

  it('섹션 제목: ETC는 LABs, 모든 섹션에 제목이 있다', () => {
    const sections = build({ isAdmin: true })
    expect(section(sections, 'ETC')?.label).toBe('LABs')
    expect(sections.every((s) => typeof s.label === 'string' && s.label.length > 0)).toBe(true)
  })

  it('isHidden 카테고리와 하위 카테고리를 제외한다', () => {
    const sections = build()
    expect(hrefs(section(sections, 'WORK')?.items)).toEqual(['/wallpaper', '/welcomeboard'])
    const icon = section(sections, 'SOURCE')?.items[0]
    expect(hrefs(icon?.children)).toEqual(['/icon-line'])
  })

  it('하위 카테고리가 모두 숨김이면 children 없이 링크가 된다', () => {
    const sections = build({
      categories: [cat('icon', 'SOURCE', { children: [cat('x', 'SOURCE', { isHidden: true })] })],
    })
    expect(section(sections, 'SOURCE')?.items[0].children).toBeUndefined()
  })

  it('LABs는 DB ETC 카테고리 대신 하드코딩 메뉴를 쓰고, Mind5는 외부 링크', () => {
    const labs = section(build(), 'ETC')?.items ?? []
    expect(labs.map((i) => i.label)).toEqual(['eDM', 'PDF Extractor', 'Chart Generator', 'Mind5'])
    expect(labs.find((i) => i.label === 'Mind5')?.external).toBe(true)
    // LABs는 로그인 가드 없음(기존 동작)
    expect(labs.some((i) => i.requiresAuth)).toBe(false)
  })

  it('TOOLBOX는 메뉴 정의 순서대로, OCR만 fullReload', () => {
    const items = section(build(), 'TOOLBOX')?.items ?? []
    expect(items.map((i) => i.label)).toEqual(TOOLBOX_MENU.map((m) => m.label))
    expect(items.filter((i) => i.fullReload).map((i) => i.href)).toEqual(['/toolbox/text-extractor'])
    expect(items.every((i) => i.requiresAuth)).toBe(true)
  })

  it('ADMIN은 관리자만, 디자인 시스템은 권한이 있을 때만', () => {
    expect(section(build(), 'ADMIN')).toBeUndefined()
    expect(hrefs(section(build({ isAdmin: true }), 'ADMIN')?.items)).not.toContain('/admin/design-system')
    const admin = section(build({ isAdmin: true, showDesignSystem: true }), 'ADMIN')?.items ?? []
    expect(hrefs(admin)).toEqual([
      '/admin/dashboard',
      '/admin/users',
      '/admin/notices',
      '/admin/menus',
      '/admin/design-system',
    ])
    expect(admin.every((i) => i.icon && i.requiresAuth)).toBe(true)
  })

  describe('활성 판정', () => {
    const sections = build({ isAdmin: true })
    const item = (id: string, href: string) => {
      const found = section(sections, id)?.items.find((i) => i.href === href)
      if (!found) throw new Error(`${id} ${href} 없음`)
      return found
    }

    it('카테고리·TOOLBOX: 자신과 하위 경로에서 활성, 비슷한 이름은 비활성', () => {
      const wallpaper = item('WORK', '/wallpaper')
      expect(wallpaper.isActive('/wallpaper')).toBe(true)
      expect(wallpaper.isActive('/wallpaper/123')).toBe(true)
      expect(wallpaper.isActive('/wallpaper-old')).toBe(false)
      expect(wallpaper.isActive('/')).toBe(false)
      expect(item('TOOLBOX', '/toolbox/text-extractor').isActive('/toolbox/text-extractor')).toBe(true)
    })

    it('LABs: eDM은 하위 경로 포함, PDF Extractor·Chart Generator는 정확히 일치, Mind5는 항상 비활성', () => {
      expect(item('ETC', '/edm').isActive('/edm/abc')).toBe(true)
      expect(item('ETC', '/pdf-extractor').isActive('/pdf-extractor')).toBe(true)
      expect(item('ETC', '/pdf-extractor').isActive('/pdf-extractor/x')).toBe(false)
      expect(item('ETC', '/chart-generator').isActive('/chart-generator')).toBe(true)
      expect(item('ETC', 'https://penta-mind5.vercel.app').isActive('/')).toBe(false)
    })

    it('ADMIN: 경로 시작 일치', () => {
      expect(item('ADMIN', '/admin/menus').isActive('/admin/menus/abc')).toBe(true)
      expect(item('ADMIN', '/admin/menus').isActive('/admin/users')).toBe(false)
    })
  })
})
