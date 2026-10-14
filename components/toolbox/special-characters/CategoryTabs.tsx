'use client'

import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { HorizontalScrollEdgeFades } from '@/components/ui/horizontal-scroll-edge-fades'

interface CategoryTabsProps {
  tabs: { id: string; label: string }[]
  activeId: string
  /** 탭 줄의 접근성 이름(예: 종류·카테고리) */
  label: string
  /** 탭 버튼 id와 패널의 aria-labelledby 연결용 접두사 */
  idPrefix: string
  /** 탭이 제어하는 패널 id */
  panelId: string
  onChange: (id: string) => void
}

/**
 * 카테고리 탭(가로 스크롤 — 가려진 쪽 끝에 그라디언트 페이드, 갤러리·하드웨어 목록과 같은 공용 컴포넌트).
 * ←/→/Home/End로 이동하고 선택은 즉시 반영한다.
 */
export function CategoryTabs({ tabs, activeId, label, idPrefix, panelId, onChange }: CategoryTabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.id === activeId)
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[tabs[next].id]?.focus()
  }

  return (
    <HorizontalScrollEdgeFades>
      <div role="tablist" aria-label={label} className="flex w-max min-w-full gap-1.5 pb-1" onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.id === activeId
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors [@media(pointer:coarse)]:min-h-10',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-accent'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </HorizontalScrollEdgeFades>
  )
}
