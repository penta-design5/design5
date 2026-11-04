'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { CategoryType } from '@prisma/client'
import { HTML_MENU_PAGE_TYPE } from '@/lib/menus/schemas'

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

/**
 * pathname이 base 경로 세그먼트(`/base` 또는 `/base/...`)인지.
 * 접두어 비교(startsWith)를 쓰면 `/cloudbric-waf` 같은 HTML 메뉴 slug가 `/cloudbric` 레이아웃으로 오인된다.
 */
function isUnderPath(pathname: string | null, base: string): boolean {
  return Boolean(pathname && (pathname === base || pathname.startsWith(`${base}/`)))
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
  const isCiBiPage = isUnderPath(pathname, '/ci-bi')

  // 캐릭터 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isCharacterPage = isUnderPath(pathname, '/character')

  // WAPPLES 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isWapplesPage = isUnderPath(pathname, '/wapples')

  // D.AMO 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isDamoPage = isUnderPath(pathname, '/damo')

  // iSIGN 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isIsignPage = isUnderPath(pathname, '/isign')

  // Cloudbric 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isCloudbricPage = isUnderPath(pathname, '/cloudbric')

  // PPT 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isPptPage = isUnderPath(pathname, '/ppt')

  // 웰컴보드 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isWelcomeBoardPage = isUnderPath(pathname, '/welcome-board')

  // 바탕화면 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isDesktopPage = isUnderPath(pathname, '/wallpaper')

  // HW(하드웨어 제품) 페이지인지 확인 (목록·상세 모두 — 바탕화면과 동일 처리)
  const isHwPage = isUnderPath(pathname, '/hw')

  // 감사/연말 카드 페이지인지 확인
  const isCardPage = isUnderPath(pathname, '/card')

  // PDF Extractor 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isPdfExtractorPage = isUnderPath(pathname, '/pdf-extractor')

  // ICON 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isIconPage = isUnderPath(pathname, '/icon')

  // Chart Generator 페이지인지 확인 (pathname 기반으로 우선 감지)
  const isChartGeneratorPage = isUnderPath(pathname, '/chart-generator')

  // TOOLBOX 도구 페이지인지 확인 (Chart Generator와 동일한 좌측 작업 영역 + 우측 패널 레이아웃)
  const isToolboxPage = isUnderPath(pathname, '/toolbox')

  // 관리자 업로드 HTML 메뉴(iframe, Penta Design System 포함) 페이지인지 확인 — 전역 헤더 유지, 본문만 풀-블리드
  const isHtmlMenuPage = Boolean(pathname &&
    categories
      .flatMap((cat) => [cat, ...(cat.children ?? [])])
      .some((cat) => pathname === `/${cat.slug}` && resolveCategoryPageType(cat) === HTML_MENU_PAGE_TYPE))

  // eDM 편집 페이지인지 확인 (전체 화면 에디터, 헤더 숨김)
  const isEdmEditorPage = Boolean(pathname && 
    pathname.startsWith('/edm/') &&
    (pathname === '/edm/editor' || /^\/edm\/[^/]+$/.test(pathname)))

  // CI/BI, 캐릭터, WAPPLES, D.AMO, iSIGN, Cloudbric, PPT, PDF Extractor, ICON, Chart Generator, TOOLBOX, eDM 편집 페이지인지 확인
  // 웰컴보드는 에디터 모드일 때 자체 헤더를 사용하므로 제외
  const isSpecialPage = isCiBiPage || isCharacterPage || isWapplesPage || isDamoPage || isIsignPage || isCloudbricPage || isPptPage || isPdfExtractorPage || isIconPage || isChartGeneratorPage || isToolboxPage || isEdmEditorPage
  const isCardPageOrSimilar = isWelcomeBoardPage || isDesktopPage || isCardPage || isHwPage || isHtmlMenuPage

  // 헤더 너비 제한이 필요한 페이지 (우측 패널이 있는 페이지만)
  const hasRightPanel = isCiBiPage || isCharacterPage || isWapplesPage || isDamoPage || isIsignPage || isCloudbricPage || isPptPage || isPdfExtractorPage || isIconPage || isChartGeneratorPage || isToolboxPage

  return (
    <div className="flex min-h-screen md:h-screen bg-background">
      {/* 데스크톱 Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <Sidebar categories={categories} flyout />
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
            rightPanelFrom={isToolboxPage ? 'xl' : 'md'}
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

