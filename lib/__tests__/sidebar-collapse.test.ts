import { describe, it, expect } from 'vitest'
import {
  INITIAL_COLLAPSE_STATE,
  applyRoute,
  isSectionOpen,
  parseCollapsedSections,
  toggleSection,
  type SidebarCollapseState,
} from '@/lib/menus/sidebar-collapse'
import { buildSidebarSections, findActiveSectionId } from '@/lib/menus/sidebar-sections'

const ALL = ['WORK', 'BROCHURE', 'TOOLBOX', 'ETC']
const st = (collapsed: string[], autoOpen: string | null = null): SidebarCollapseState => ({ collapsed, autoOpen })

describe('toggleSection', () => {
  it('기본은 모두 펼침, 누르면 접고 다시 누르면 펼친다', () => {
    expect(isSectionOpen(INITIAL_COLLAPSE_STATE, 'TOOLBOX')).toBe(true)
    const closed = toggleSection(INITIAL_COLLAPSE_STATE, 'TOOLBOX', ALL)
    expect(closed).toEqual(st(['TOOLBOX']))
    expect(isSectionOpen(closed, 'TOOLBOX')).toBe(false)
    expect(toggleSection(closed, 'TOOLBOX', ALL)).toEqual(st([]))
  })

  it('일시 펼침 중인 섹션을 접으면 일시 펼침만 해제(저장값 유지)', () => {
    const s = st(['TOOLBOX'], 'TOOLBOX')
    expect(isSectionOpen(s, 'TOOLBOX')).toBe(true)
    expect(toggleSection(s, 'TOOLBOX', ALL)).toEqual(st(['TOOLBOX'], null))
  })

  it('일시 펼침 중이어도 다른 섹션 토글은 일시 펼침을 유지', () => {
    expect(toggleSection(st(['TOOLBOX'], 'TOOLBOX'), 'WORK', ALL)).toEqual(st(['TOOLBOX', 'WORK'], 'TOOLBOX'))
  })

  it('Alt + 펼친 섹션 클릭 → 모두 접기 (일시 펼침도 해제)', () => {
    expect(toggleSection(st(['ETC'], 'ETC'), 'WORK', ALL, true)).toEqual(st(['ETC', 'WORK', 'BROCHURE', 'TOOLBOX'], null))
  })

  it('Alt + 접힌 섹션 클릭 → 모두 펼치기, 화면에 없는 섹션(ADMIN)의 저장값은 유지', () => {
    expect(toggleSection(st(['TOOLBOX', 'ADMIN']), 'TOOLBOX', ALL, true)).toEqual(st(['ADMIN']))
  })
})

describe('applyRoute', () => {
  it('현재 메뉴가 든 섹션이 접혀 있으면 일시 펼침', () => {
    expect(applyRoute(st(['TOOLBOX']), 'TOOLBOX')).toEqual(st(['TOOLBOX'], 'TOOLBOX'))
  })

  it('펼쳐진 섹션이면 아무것도 바꾸지 않는다(같은 객체)', () => {
    const s = st(['ETC'])
    expect(applyRoute(s, 'TOOLBOX')).toBe(s)
  })

  it('다른 섹션 페이지로 가면 이전 일시 펼침 해제', () => {
    expect(applyRoute(st(['TOOLBOX', 'ETC'], 'TOOLBOX'), 'WORK')).toEqual(st(['TOOLBOX', 'ETC'], null))
    expect(applyRoute(st(['TOOLBOX'], 'TOOLBOX'), null)).toEqual(st(['TOOLBOX'], null))
  })

  it('플라이아웃에서 이동(skip)하면 펼치지 않는다', () => {
    expect(applyRoute(st(['TOOLBOX']), 'TOOLBOX', true)).toEqual(st(['TOOLBOX'], null))
  })
})

describe('parseCollapsedSections', () => {
  it.each([
    [null, []],
    ['', []],
    ['not json', []],
    ['{"a":1}', []],
    ['["TOOLBOX", 3, "ETC", "TOOLBOX"]', ['TOOLBOX', 'ETC']],
  ])('%s → %j', (raw, expected) => {
    expect(parseCollapsedSections(raw)).toEqual(expected)
  })
})

describe('findActiveSectionId', () => {
  const sections = buildSidebarSections({
    categories: [
      { id: 'w', name: 'w', slug: 'wallpaper', type: 'WORK' },
      { id: 'i', name: 'i', slug: 'icon', type: 'SOURCE', children: [{ id: 'il', name: 'il', slug: 'icon-line', type: 'SOURCE' }] },
    ],
    isAdmin: true,
    showDesignSystem: false,
  })

  it.each([
    ['/wallpaper/1', 'WORK'],
    ['/icon-line', 'SOURCE'],
    ['/toolbox/text-extractor', 'TOOLBOX'],
    ['/edm', 'ETC'],
    ['/admin/menus', 'ADMIN'],
    ['/', null],
    ['/profile', null],
  ])('%s → %s', (pathname, expected) => {
    expect(findActiveSectionId(sections, pathname)).toBe(expected)
  })
})
