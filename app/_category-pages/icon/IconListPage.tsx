'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SubscribeButton } from '@/components/category-pages/SubscribeButton'
import { IconTab } from '@/app/_category-pages/icon/IconTab'
import { IconPlusWorkspace } from '@/app/_category-pages/icon/IconPlusWorkspace'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface IconListPageProps {
  category: Category
}

type IconTabKey = 'ICON' | 'ICON+'

const TABS: { key: IconTabKey; label: string }[] = [
  { key: 'ICON', label: 'ICON' },
  { key: 'ICON+', label: 'ICON+' },
]

export function IconListPage({ category }: IconListPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 쿼리(?tab=plus)와 동기화하여 새로고침/공유 시 유지
  const initialTab: IconTabKey = searchParams.get('tab') === 'plus' ? 'ICON+' : 'ICON'
  const [activeTab, setActiveTab] = useState<IconTabKey>(initialTab)

  const handleTabChange = useCallback(
    (tab: IconTabKey) => {
      setActiveTab(tab)
      // URL 쿼리 동기화 (ICON 은 파라미터 제거, ICON+ 는 ?tab=plus)
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'ICON+') {
        params.set('tab', 'plus')
      } else {
        params.delete('tab')
      }
      const query = params.toString()
      router.replace(query ? `/${category.slug}?${query}` : `/${category.slug}`, {
        scroll: false,
      })
    },
    [router, searchParams, category.slug]
  )

  // 공통 헤더: 타이틀 + 구독 버튼 + ICON/ICON+ 탭 (두 탭 공유)
  // - ICON 탭에서는 IconTab 좌측 컬럼(pr-[410px]) 안에 렌더되어 우측 속성 패널과 겹치지 않는다.
  // - ICON+ 탭에서는 전체 폭 상단에 렌더된다.
  const header = (
    <div className="px-8 pt-16">
      <div className="page-header-row !mb-4">
        <h1 className="page-header-title">{category.name}</h1>
        <div className="flex items-center gap-3 shrink-0">
          <SubscribeButton categoryId={category.id} />
        </div>
      </div>

      {/* ICON / ICON+ 탭 */}
      <div
        role="tablist"
        aria-label="ICON 보기 전환"
        className="flex items-center gap-1 border-b border-border"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (activeTab === 'ICON') {
    return <IconTab category={category} header={header} />
  }

  return (
    <div className="w-full h-full flex flex-col absolute inset-0 bg-neutral-50 dark:bg-neutral-900">
      {header}
      <div className="relative flex-1 min-h-0">
        <IconPlusWorkspace category={category} />
      </div>
    </div>
  )
}
