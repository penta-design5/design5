import type { CategoryType } from '@prisma/client'
import { Gauge, ListTree, Megaphone, Palette, Users, type LucideIcon } from 'lucide-react'
import { TOOLBOX_MENU, toolboxFullReload, toolboxPath } from '@/lib/toolbox/menu'

/**
 * 사이드바 메뉴 데이터 모델.
 * 사이드바(섹션 접기/펴기)와 접힌 섹션 플라이아웃이 같은 메뉴를 같은 규칙으로 그리도록 한 곳에서 만든다.
 * 계획·진행 상태: docs/SIDEBAR_collapse_handoff.md
 */

/** DB 카테고리(사이드바에 전달되는 최상위 카테고리 + children) */
export interface SidebarCategory {
  id: string
  name: string
  slug: string
  type: CategoryType
  parentId?: string | null
  isHidden?: boolean
  children?: SidebarCategory[]
}

export interface SidebarItem {
  /** 고유 키 (카테고리 id 또는 경로) */
  key: string
  label: string
  /** '/wallpaper', '/toolbox/text-extractor', 'https://…' */
  href: string
  /** ADMIN 항목 아이콘 */
  icon?: LucideIcon
  /** 새 탭 + ↗ 아이콘 (Mind5) */
  external?: boolean
  /** SPA 이동 대신 문서를 새로 불러온다 (TOOLBOX OCR — 교차 출처 격리 응답 헤더) */
  fullReload?: boolean
  /** 로그아웃 상태에서 누르면 /login으로 보낸다 */
  requiresAuth?: boolean
  isActive: (pathname: string) => boolean
  /** 하위 카테고리 — 있으면 이 항목은 링크가 아니라 펼침 토글이다 */
  children?: SidebarItem[]
}

/** CategoryType 값 + 하드코딩 섹션 id. 섹션 접기 상태 저장 키로도 쓴다(메뉴 이름이 바뀌어도 유지). */
export type SidebarSectionId = CategoryType | 'TOOLBOX'

export interface SidebarSection {
  id: SidebarSectionId
  /** null이면 제목 없는 그룹 → 접기 대상 아님 */
  label: string | null
  items: SidebarItem[]
}

export const SIDEBAR_SECTION_ORDER = [
  'WORK',
  'SOURCE',
  'TEMPLATE',
  'BROCHURE',
  'TOOLBOX',
  'ETC',
  'INSIGHTS',
  'ADMIN',
] as const satisfies readonly SidebarSectionId[]

const SECTION_LABELS: Record<SidebarSectionId, string> = {
  WORK: 'WORK',
  SOURCE: 'SOURCE',
  TEMPLATE: 'TEMPLATE',
  BROCHURE: 'BROCHURE',
  TOOLBOX: 'TOOLBOX',
  ETC: 'LABs',
  INSIGHTS: 'INSIGHTS',
  ADMIN: 'ADMIN',
}

/** `/` 에서는 비활성, 경로 자신과 하위 경로에서 활성 */
const matchPrefix = (href: string) => (pathname: string) =>
  pathname !== '/' && (pathname === href || pathname.startsWith(`${href}/`))

const matchExact = (href: string) => (pathname: string) => pathname === href

/** 기존 ADMIN 메뉴 판정을 그대로 유지 (`startsWith`) */
const matchStartsWith = (href: string) => (pathname: string) => pathname.startsWith(href)

const never = () => false

function categoryToItem(category: SidebarCategory): SidebarItem {
  const href = `/${category.slug}`
  const children = category.children?.filter((ch) => !ch.isHidden).map(categoryToItem)
  return {
    key: category.id,
    label: category.name,
    href,
    requiresAuth: true,
    isActive: matchPrefix(href),
    ...(children && children.length > 0 ? { children } : {}),
  }
}

function toolboxItems(): SidebarItem[] {
  return TOOLBOX_MENU.map((menu) => {
    const href = `/${toolboxPath(menu.slug)}`
    return {
      key: href,
      label: menu.label,
      href,
      requiresAuth: true,
      isActive: matchPrefix(href),
      ...(toolboxFullReload(menu) ? { fullReload: true } : {}),
    }
  })
}

/** LABs — 로그인 가드 없음(기존 동작 유지) */
function labsItems(): SidebarItem[] {
  return [
    { key: '/edm', label: 'eDM', href: '/edm', isActive: matchPrefix('/edm') },
    { key: '/pdf-extractor', label: 'PDF Extractor', href: '/pdf-extractor', isActive: matchExact('/pdf-extractor') },
    { key: '/chart-generator', label: 'Chart Generator', href: '/chart-generator', isActive: matchExact('/chart-generator') },
    { key: 'mind5', label: 'Mind5', href: 'https://penta-mind5.vercel.app', external: true, isActive: never },
  ]
}

function adminItems(showDesignSystem: boolean): SidebarItem[] {
  const items: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/admin/dashboard', label: '대시보드', icon: Gauge },
    { href: '/admin/users', label: '회원 관리', icon: Users },
    { href: '/admin/notices', label: '공지사항 관리', icon: Megaphone },
    { href: '/admin/menus', label: '메뉴 관리', icon: ListTree },
  ]
  if (showDesignSystem) items.push({ href: '/admin/design-system', label: '디자인 시스템', icon: Palette })
  return items.map(({ href, label, icon }) => ({
    key: href,
    label,
    href,
    icon,
    requiresAuth: true,
    isActive: matchStartsWith(href),
  }))
}

export interface BuildSidebarSectionsInput {
  categories: SidebarCategory[]
  /** session.user.role === 'ADMIN' */
  isAdmin: boolean
  /** canAccessDesignSystem(session.user.email) */
  showDesignSystem: boolean
}

/**
 * 사이드바 섹션 목록.
 * - 일반 카테고리(WORK·SOURCE·TEMPLATE·BROCHURE·INSIGHTS): DB 순서 그대로, isHidden 제외, 빈 섹션 제외
 * - TOOLBOX·LABs: 하드코딩, 항상 표시 (LABs의 DB ETC 카테고리는 사용하지 않음)
 * - ADMIN: 관리자만
 */
export function buildSidebarSections({
  categories,
  isAdmin,
  showDesignSystem,
}: BuildSidebarSectionsInput): SidebarSection[] {
  const visible = categories.filter((c) => !c.isHidden)
  const sections: SidebarSection[] = []

  for (const id of SIDEBAR_SECTION_ORDER) {
    let items: SidebarItem[]
    if (id === 'TOOLBOX') items = toolboxItems()
    else if (id === 'ETC') items = labsItems()
    else if (id === 'ADMIN') {
      if (!isAdmin) continue
      items = adminItems(showDesignSystem)
    } else {
      items = visible.filter((c) => c.type === id).map(categoryToItem)
      if (items.length === 0) continue
    }
    sections.push({ id, label: SECTION_LABELS[id], items })
  }

  return sections
}
