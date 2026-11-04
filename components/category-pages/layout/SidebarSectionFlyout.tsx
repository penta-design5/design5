'use client'

import type { ReactNode, SyntheticEvent } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
import type { SidebarItem, SidebarSection } from '@/lib/menus/sidebar-sections'
import { SidebarLink, type SidebarNavigation } from './SidebarLink'

/** 사이드바 바깥(p-4) + 간격 4px — 패널이 사이드바와 겹치지 않게 */
const FLYOUT_SIDE_OFFSET = 20

// HoverCard는 포커스·블러에도 열고 닫는다. 키보드 사용자는 제목 Enter로 펼치므로 포커스로는 열지 않고,
// 블러로 닫히면 패널 링크를 누르는 도중(mousedown→click 사이)에 패널이 사라질 수 있어 둘 다 막는다.
const ignoreFocus = (e: SyntheticEvent) => e.preventDefault()

interface SidebarSectionFlyoutProps {
  section: SidebarSection
  open: boolean
  onOpenChange: (open: boolean) => void
  pathname: string
  isLoggedIn: boolean
  onNavigate: (nav: SidebarNavigation) => void
  /** 섹션 제목 줄 (패널 위치 기준·마우스 감지 영역) */
  children: ReactNode
}

/**
 * 접힌 섹션 플라이아웃 — 섹션 제목에 마우스를 올리면 오른쪽에 메뉴 목록을 띄운다.
 * 링크는 사이드바와 같은 SidebarLink를 쓴다(로그인 가드·OCR 새로고침 이동·외부 링크·활성 표시).
 * 열림 여부는 부모가 제어한다(접힌 섹션일 때만 열림).
 */
export function SidebarSectionFlyout({
  section,
  open,
  onOpenChange,
  pathname,
  isLoggedIn,
  onNavigate,
  children,
}: SidebarSectionFlyoutProps) {
  return (
    <HoverCard open={open} onOpenChange={onOpenChange} openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild onFocus={ignoreFocus} onBlur={ignoreFocus}>
        <div>{children}</div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={FLYOUT_SIDE_OFFSET}
        collisionPadding={8}
        className="w-56 space-y-1 overflow-y-auto p-1.5 max-h-[var(--radix-hover-card-content-available-height)]"
      >
        <p className="px-3 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {section.label}
        </p>
        <FlyoutItems
          items={section.items}
          level={0}
          pathname={pathname}
          isLoggedIn={isLoggedIn}
          onNavigate={onNavigate}
        />
      </HoverCardContent>
    </HoverCard>
  )
}

interface FlyoutItemsProps {
  items: SidebarItem[]
  level: number
  pathname: string
  isLoggedIn: boolean
  onNavigate: (nav: SidebarNavigation) => void
}

/** 하위 카테고리는 펼친 채 들여쓰기로 보여준다(상위 항목은 사이드바에서도 링크가 아니라 묶음 제목) */
function FlyoutItems({ items, level, pathname, isLoggedIn, onNavigate }: FlyoutItemsProps) {
  return (
    <>
      {items.map((item) =>
        item.children && item.children.length > 0 ? (
          <div key={item.key} className="space-y-1">
            <p className={cn('px-3 py-1 text-sm text-muted-foreground', level > 0 && 'ml-4')}>{item.label}</p>
            <FlyoutItems
              items={item.children}
              level={level + 1}
              pathname={pathname}
              isLoggedIn={isLoggedIn}
              onNavigate={onNavigate}
            />
          </div>
        ) : (
          <SidebarLink
            key={item.key}
            item={item}
            pathname={pathname}
            isLoggedIn={isLoggedIn}
            onNavigate={onNavigate}
            level={level}
          />
        )
      )}
    </>
  )
}
