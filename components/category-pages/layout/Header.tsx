'use client'

import { useState, useEffect } from 'react'
import { Search, Menu, SlidersHorizontal } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchResultsDialog } from '@/components/search/SearchResultsDialog'
import {
  SearchFilterDropdown,
  SearchFilterPanel,
  type SearchCategoryOption,
} from '@/components/search/SearchFilterDropdown'
import type { SearchResult } from '@/app/api/search/route'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  parentId?: string | null
  children?: Category[]
  pageType?: string | null
}

interface HeaderProps {
  onMenuClick?: () => void
  isCiBiPage?: boolean
  categories?: Category[]
}

const EXCLUDED_CATEGORY_SLUGS = ['edm']

/** Sheet(Dialog) 안의 Popover/Select 등 포털 레이어는 '바깥'으로 간주되어 시트가 닫히거나 포커스가 막힘 → 방지 */
function isInsideRadixFloatingLayer(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false
  return Boolean(
    target.closest('[data-radix-popper-content-wrapper]') ||
      target.closest('[data-radix-select-viewport]') ||
      target.closest('[data-radix-dropdown-menu-content]')
  )
}

function buildSearchCategoryOptions(categories: Category[] = []): SearchCategoryOption[] {
  const flattened: Category[] = []
  const visit = (cats: Category[]) => {
    for (const c of cats) {
      if (!EXCLUDED_CATEGORY_SLUGS.includes(c.slug)) {
        flattened.push(c)
      }
      if (c.children?.length) {
        visit(c.children)
      }
    }
  }
  visit(categories)
  return flattened.map((c) => ({ slug: c.slug, name: c.name }))
}

export function Header({ onMenuClick, isCiBiPage = false, categories = [] }: HeaderProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? (resolvedTheme || theme) : 'light'
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileDetailSearchOpen, setMobileDetailSearchOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!mobileSearchOpen) setMobileDetailSearchOpen(false)
  }, [mobileSearchOpen])

  const categoryOptions = buildSearchCategoryOptions(categories)

  const runSearch = async (params: {
    q: string
    categorySlug?: string
    dateFrom?: string
    dateTo?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.set('q', params.q)
    if (params.categorySlug) searchParams.set('categorySlug', params.categorySlug)
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)

    const queryString = searchParams.toString()
    if (!queryString) return

    setLoading(true)
    try {
      const res = await fetch(`/api/search?${queryString}`)
      if (!res.ok) throw new Error('검색 실패')
      const data = await res.json()
      setResults(data.results || [])
      setResultsDialogOpen(true)
      setMobileSearchOpen(false)
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
      setResultsDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    runSearch({ q })
  }

  const handleFilterSearch = (params: {
    q: string
    categorySlug?: string
    dateFrom?: string
    dateTo?: string
  }) => {
    if (!params.q && !params.categorySlug && !params.dateFrom && !params.dateTo) return
    runSearch(params)
  }

  return (
    <header
      className={`fixed md:absolute top-0 left-0 md:left-56 z-50 right-0 ${
        isCiBiPage ? 'md:right-[410px]' : ''
      }`}
      style={{
        backgroundColor: isCiBiPage
          ? currentTheme === 'dark'
            ? 'rgba(23, 23, 23, 0.6)' /* neutral-900 계열, 컨텐츠 배경과 조화 */
            : 'rgba(250, 250, 250, 0.6)' /* neutral-50 계열, CI/BI·ICON·캐릭터·PPT·PDF·Chart 등과 조화 */
          : currentTheme === 'dark'
            ? 'rgba(13, 13, 13, 0.6)'
            : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="relative z-[60] flex h-16 w-full items-center justify-between px-8">
        <div className="flex items-center gap-4 -ml-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1 justify-end">
          {/* 데스크톱 검색 바 */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:flex items-center gap-1 max-w-md w-1/4 min-w-[260px]"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="전체 리소스 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
            <SearchFilterDropdown
              open={filterDropdownOpen}
              onOpenChange={setFilterDropdownOpen}
              searchQuery={searchQuery}
              onSearch={handleFilterSearch}
              categoryOptions={categoryOptions}
            />
          </form>

          {/* 모바일 검색 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex justify-end"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="검색"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 모바일 검색 시트 — modal=false: 모달 Dialog의 hideOthers/포커스 락이 포털 Popover(상세검색)를 막지 않도록 함. 딤은 별도 레이어. */}
      <Sheet modal={false} open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        {mobileSearchOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-[45] bg-black/80 md:hidden"
            aria-label="검색 닫기"
            onClick={() => setMobileSearchOpen(false)}
          />
        ) : null}
        <SheetContent
          side="top"
          className="z-[50] h-auto"
          onPointerDownOutside={(e) => {
            if (isInsideRadixFloatingLayer(e.detail.originalEvent.target)) {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            const orig = (e as CustomEvent<{ originalEvent: FocusEvent | PointerEvent }>).detail
              ?.originalEvent
            if (!orig) return
            if (orig instanceof FocusEvent) {
              if (isInsideRadixFloatingLayer(orig.relatedTarget)) e.preventDefault()
            } else if (isInsideRadixFloatingLayer(orig.target)) {
              e.preventDefault()
            }
          }}
          onFocusOutside={(e) => {
            const orig = (e as CustomEvent<{ originalEvent: FocusEvent }>).detail
              ?.originalEvent
            if (isInsideRadixFloatingLayer(orig?.relatedTarget ?? null)) {
              e.preventDefault()
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>통합 검색</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <form
                onSubmit={handleSubmit}
                className="flex min-w-0 flex-1 gap-2"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="전체 리소스 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={!searchQuery.trim()}>
                  검색
                </Button>
              </form>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="상세 검색 조건"
                aria-expanded={mobileDetailSearchOpen}
                onClick={() => setMobileDetailSearchOpen((v) => !v)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
            {mobileDetailSearchOpen ? (
              <SearchFilterPanel
                searchQuery={searchQuery}
                categoryOptions={categoryOptions}
                onSearch={handleFilterSearch}
                onApplied={() => setMobileDetailSearchOpen(false)}
                className="rounded-md border bg-muted/30 p-4"
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <SearchResultsDialog
        open={resultsDialogOpen}
        onOpenChange={setResultsDialogOpen}
        results={results}
        loading={loading}
      />
    </header>
  )
}
