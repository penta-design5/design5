'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { CategoryType } from '@prisma/client'

interface Category {
  id: string
  name: string
  slug: string
  type: CategoryType
  parentId?: string | null
  children?: Category[]
  pageType?: string | null
}

interface MainLayoutProps {
  children: React.ReactNode
  categories: Category[]
}

/** [slug]/page.tsx getDefaultPageType 과 동일 — 헤더 숨김 여부 판단용 */
function resolveCategoryPageType(category: Category): string {
  if (category.pageType) return category.pageType
  switch (category.type) {
    case CategoryType.WORK:
      return 'gallery'
    case CategoryType.TEMPLATE:
      return 'editor'
    default:
      return 'list'
  }
}

export function MainLayout({ children, categories }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  // 갤러리형(Penta Design 등) 상세만 전역 헤더 숨김 — design-request·desktop 등은 헤더 유지
  const isGalleryDetailPage = Boolean(
    pathname &&
      !pathname.startsWith('/admin') &&
      /^\/[^/]+\/[^/]+$/.test(pathname) &&
      categories.some((cat) => {
        const match = pathname.match(/^\/([^/]+)\//)
        return (
          Boolean(match && match[1] === cat.slug) &&
          resolveCategoryPageType(cat) === 'gallery'
        )
      })
  )

  // CI/BI 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isCiBiPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/ci-bi'))

  // 캐릭터 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isCharacterPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/character'))

  // WAPPLES 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isWapplesPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/wapples'))

  // D.AMO 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isDamoPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/damo'))

  // iSIGN 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isIsignPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/isign'))

  // Cloudbric 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isCloudbricPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/cloudbric'))

  // PPT 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isPptPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/ppt'))

  // 웰컴보드 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isWelcomeBoardPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/welcome-board'))

  // 바탕화면 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isDesktopPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/wallpaper'))

  // 감사/연말 카드 페이지인지 확인
  const isCardPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/card'))

  // PDF Extractor 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isPdfExtractorPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/pdf-extractor'))

  // ICON 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isIconPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/icon'))

  // Chart Generator 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isChartGeneratorPage = Boolean(pathname && 
    !pathname.startsWith('/admin') &&
    pathname.startsWith('/chart-generator'))

  // eDM 편집 페이지인지 확인 (전체 화면 에디터, 헤더 숨김)
  const isEdmEditorPage = Boolean(pathname && 
    pathname.startsWith('/edm/') &&
    (pathname === '/edm/editor' || /^\/edm\/[^/]+$/.test(pathname)))

  // CI/BI, 캐릭터, WAPPLES, D.AMO, iSIGN, Cloudbric, PPT, PDF Extractor, ICON, Chart Generator, eDM 편집 페이지인지 확인
  // 웰컴보드는 에디터 모드일 때 자체 헤더를 사용하므로 제외
  const isSpecialPage = isCiBiPage || isCharacterPage || isWapplesPage || isDamoPage || isIsignPage || isCloudbricPage || isPptPage || isPdfExtractorPage || isIconPage || isChartGeneratorPage || isEdmEditorPage
  const isCardPageOrSimilar = isWelcomeBoardPage || isDesktopPage || isCardPage

  // 헤더 너비 제한이 필요한 페이지 (우측 패널이 있는 페이지만)
  const hasRightPanel = isCiBiPage || isCharacterPage || isWapplesPage || isDamoPage || isIsignPage || isCloudbricPage || isPptPage || isPdfExtractorPage || isIconPage || isChartGeneratorPage

  return (
    <div className="flex min-h-screen md:h-screen bg-background">
      {/* 데스크톱 Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <Sidebar categories={categories} />
      </aside>

      {/* 모바일 Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 overflow-hidden flex flex-col">
          <Sidebar 
            categories={categories} 
            className="border-0 h-full" 
            onLinkClick={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-col flex-1 min-w-0 md:overflow-hidden">
        {!isGalleryDetailPage && !isEdmEditorPage && (
          <Header 
            onMenuClick={() => setMobileMenuOpen(true)} 
            isCiBiPage={hasRightPanel}
            categories={categories}
          />
        )}
        <main className={`flex-1 bg-background ${isEdmEditorPage ? 'p-0 overflow-hidden relative' : 'pt-16 md:pt-16'} ${isSpecialPage || isCardPageOrSimilar ? 'p-0 overflow-hidden relative' : 'overflow-y-auto'}`}>
          {isSpecialPage || isCardPageOrSimilar ? (
            children
          ) : (
            <div className="w-full px-8 pt-0 pb-10">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

