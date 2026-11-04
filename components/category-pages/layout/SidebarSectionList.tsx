'use client'

import { useRef } from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SidebarSection } from '@/lib/menus/sidebar-sections'
import { SidebarItemNode } from './SidebarLink'
import type { useSidebarCollapse } from './useSidebarCollapse'

interface SidebarSectionListProps {
  sections: SidebarSection[]
  collapse: ReturnType<typeof useSidebarCollapse>
  pathname: string
  isLoggedIn: boolean
  onNavigate?: () => void
  /** 하위 카테고리 펼침 (카테고리 단위, 섹션 접기와 별개) */
  expandedKeys: ReadonlySet<string>
  onToggleItem: (key: string) => void
}

/**
 * 사이드바 섹션 목록 — 섹션 제목을 눌러 접고 펼친다 (Alt/Option + 클릭: 전체).
 * 제목 없는 섹션(label null)은 접기 대상이 아니며 항상 펼친다.
 */
export function SidebarSectionList({
  sections,
  collapse,
  pathname,
  isLoggedIn,
  onNavigate,
  expandedKeys,
  onToggleItem,
}: SidebarSectionListProps) {
  // Radix onValueChange에는 마우스 이벤트가 없어, 직전 클릭의 Alt 여부를 기억해 둔다
  const altClickRef = useRef(false)
  const openIds: string[] = sections.filter((s) => s.label === null || collapse.isOpen(s.id)).map((s) => s.id)

  const handleValueChange = (next: string[]) => {
    const changed =
      openIds.find((id) => !next.includes(id)) ?? next.find((id) => !openIds.includes(id))
    if (changed) collapse.toggle(changed, altClickRef.current)
    altClickRef.current = false
  }

  const renderItems = (section: SidebarSection) =>
    section.items.map((item) => (
      <SidebarItemNode
        key={item.key}
        item={item}
        pathname={pathname}
        isLoggedIn={isLoggedIn}
        onNavigate={onNavigate}
        expandedKeys={expandedKeys}
        onToggle={onToggleItem}
      />
    ))

  return (
    <AccordionPrimitive.Root type="multiple" value={openIds} onValueChange={handleValueChange} asChild>
      <nav className="space-y-6">
        {sections.map((section) => {
          if (section.label === null) {
            return (
              <div key={section.id} className="space-y-1">
                {renderItems(section)}
              </div>
            )
          }

          const open = collapse.isOpen(section.id)
          // 접힌 섹션에 현재 메뉴가 있으면 제목을 활성 색으로
          const holdsActive = !open && collapse.activeSectionId === section.id

          return (
            <AccordionPrimitive.Item key={section.id} value={section.id} className="space-y-1">
              <AccordionPrimitive.Header className="pr-4">
                <AccordionPrimitive.Trigger
                  onClick={(e) => {
                    altClickRef.current = e.altKey
                  }}
                  className={cn(
                    'group flex w-full items-center gap-1.5 rounded-sm px-3 text-left text-[10px] font-semibold uppercase tracking-wider transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    holdsActive
                      ? 'text-[var(--penta-indigo)] dark:text-penta-sky'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{section.label}</span>
                  {!open && (
                    <span className="font-normal tabular-nums text-muted-foreground/60">
                      {section.items.length}
                    </span>
                  )}
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      'ml-auto h-3 w-3 shrink-0 transition-[transform,opacity] duration-150 motion-reduce:transition-none',
                      open
                        ? // 펼침: 마우스를 올리거나 키보드 포커스일 때만 (터치 기기는 항상)
                          'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
                        : '-rotate-90'
                    )}
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content
                className={cn(
                  'space-y-1 overflow-hidden',
                  // 모션 줄이기 설정이면 애니메이션 없음 (motion-reduce:animate-none은 data-[state] 선택자보다 약해 motion-safe로 건다)
                  !collapse.instant &&
                    'motion-safe:data-[state=closed]:animate-accordion-up motion-safe:data-[state=open]:animate-accordion-down'
                )}
              >
                {renderItems(section)}
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          )
        })}
      </nav>
    </AccordionPrimitive.Root>
  )
}
