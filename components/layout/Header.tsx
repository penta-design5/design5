'use client'

import { useState, useEffect } from 'react'
import { Search, Menu, SlidersHorizontal } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchResultsDialog } from '@/components/search/SearchResultsDialog'
import { SearchFilterDropdown, type SearchCategoryOption } from '@/components/search/SearchFilterDropdown'
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
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

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
      className={`fixed md:absolute top-0 left-0 md:left-56 z-50 ${
        isCiBiPage ? 'md:right-[410px]' : 'right-0'
      } ${
        isCiBiPage
          ? 'bg-neutral-50 dark:bg-neutral-900'
          : ''
      }`}
      style={
        isCiBiPage
          ? undefined
          : {
              backgroundColor:
                currentTheme === 'dark'
                  ? 'rgba(13, 13, 13, 0.6)'
                  : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }
      }
    >
      <div className="flex h-16 items-center justify-between px-8 w-full">
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
            className="md:hidden"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="검색"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 모바일 검색 시트 */}
      <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <SheetContent side="top" className="h-auto">
          <SheetHeader>
            <SheetTitle>통합 검색</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="전체 리소스 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <SearchFilterDropdown
                open={filterDropdownOpen}
                onOpenChange={setFilterDropdownOpen}
                searchQuery={searchQuery}
                onSearch={handleFilterSearch}
                categoryOptions={categoryOptions}
                trigger={
                  <Button type="button" variant="outline" size="icon" aria-label="상세 검색 조건">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <Button type="submit" disabled={!searchQuery.trim()}>
                검색
              </Button>
            </form>
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
