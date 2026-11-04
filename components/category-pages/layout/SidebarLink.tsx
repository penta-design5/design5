'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, SquareArrowOutUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SidebarItem } from '@/lib/menus/sidebar-sections'

/**
 * 사이드바 메뉴 링크 공용 렌더러 — 사이드바와 접힌 섹션 플라이아웃이 반드시 같이 쓴다.
 * 로그인 가드·fullReload(OCR 교차 출처 격리)·외부 링크·aria-current(자동 스크롤 기준)를 한 곳에서 처리한다.
 */

const rowClass = (active: boolean, level: number) =>
  cn(
    'flex items-center gap-2 px-3 py-1 transition-colors rounded-md',
    active
      ? 'text-[var(--penta-indigo)] dark:text-penta-sky'
      : 'hover:text-[var(--penta-indigo)] dark:hover:text-penta-sky',
    level > 0 && 'ml-4'
  )

const isPlainLeftClick = (e: React.MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

/**
 * 링크를 누른 결과
 * - spa: 이 탭에서 화면만 바뀜 · reload: 이 탭에서 문서를 새로 불러옴(OCR)
 * - other: 이 탭은 그대로(외부 링크·Cmd/Ctrl/Shift+클릭으로 새 탭·새 창)
 */
export interface SidebarNavigation {
  href: string
  mode: 'spa' | 'reload' | 'other'
}

interface SidebarLinkProps {
  item: SidebarItem
  pathname: string
  isLoggedIn: boolean
  /** 링크를 누른 뒤 호출 (모바일 시트 닫기, 플라이아웃 닫기 등) */
  onNavigate?: (nav: SidebarNavigation) => void
  level?: number
}

/** 하위 항목이 없는 메뉴 링크 한 줄 */
export function SidebarLink({ item, pathname, isLoggedIn, onNavigate, level = 0 }: SidebarLinkProps) {
  const router = useRouter()
  const Icon = item.icon

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('group', rowClass(false, level))}
        onClick={() => onNavigate?.({ href: item.href, mode: 'other' })}
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span className="flex-1 text-sm">{item.label}</span>
        <SquareArrowOutUpRight className="h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    )
  }

  const active = item.isActive(pathname)

  const handleClick = (e: React.MouseEvent) => {
    let nav: SidebarNavigation
    if (item.requiresAuth && !isLoggedIn) {
      e.preventDefault()
      router.push('/login')
      nav = { href: '/login', mode: 'spa' }
    } else if (!isPlainLeftClick(e)) {
      nav = { href: item.href, mode: 'other' }
    } else if (item.fullReload) {
      e.preventDefault()
      window.location.assign(item.href)
      nav = { href: item.href, mode: 'reload' }
    } else {
      nav = { href: item.href, mode: 'spa' }
    }
    onNavigate?.(nav)
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={rowClass(active, level)}
      onClick={handleClick}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <span className="flex-1 text-sm">{item.label}</span>
    </Link>
  )
}

interface SidebarItemNodeProps extends SidebarLinkProps {
  /** 펼쳐진 하위 카테고리 키 */
  expandedKeys: ReadonlySet<string>
  onToggle: (key: string) => void
}

/** 메뉴 항목 + (있으면) 왼쪽 화살표로 펼치는 하위 카테고리 */
export function SidebarItemNode({
  item,
  pathname,
  isLoggedIn,
  onNavigate,
  level = 0,
  expandedKeys,
  onToggle,
}: SidebarItemNodeProps) {
  const router = useRouter()
  const children = item.children

  if (!children || children.length === 0) {
    return (
      <div className="pr-4">
        <SidebarLink item={item} pathname={pathname} isLoggedIn={isLoggedIn} onNavigate={onNavigate} level={level} />
      </div>
    )
  }

  const expanded = expandedKeys.has(item.key)

  const handleToggle = () => {
    if (item.requiresAuth && !isLoggedIn) {
      router.push('/login')
      onNavigate?.({ href: '/login', mode: 'spa' })
      return
    }
    onToggle(item.key)
  }

  return (
    <div className="pr-4">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={handleToggle}
        className={cn('w-full text-left', rowClass(item.isActive(pathname), level))}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="flex-1 text-sm">{item.label}</span>
      </button>
      {expanded && (
        <div className="mt-1">
          {children.map((child) => (
            <SidebarItemNode
              key={child.key}
              item={child}
              pathname={pathname}
              isLoggedIn={isLoggedIn}
              onNavigate={onNavigate}
              level={level + 1}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
