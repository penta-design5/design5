import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CategoryType } from '@prisma/client'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

// 통합 검색 결과 상한. 50→500으로 상향(사내 도구 규모상 사실상 전부 반환).
// 폭주 방지용 안전장치이며, 각 조회는 select로 필요한 필드만 가져와 페이로드를 가볍게 유지한다.
const MAX_RESULTS = 500

function getDefaultPageType(categoryType: CategoryType): string {
  switch (categoryType) {
    case CategoryType.WORK:
      return 'gallery'
    case CategoryType.TEMPLATE:
      return 'editor'
    default:
      return 'list'
  }
}

export type SearchResult = {
  id: string
  resourceType:
    | 'post'
    | 'diagram'
    | 'desktop'
    | 'card'
    | 'welcomeboard'
    | 'hardware'
    | 'designrequest'
    | 'iconplus'
  categoryName: string
  categorySlug: string
  title: string
  createdAt: string
  slug: string
  pageType?: string | null
}

// 검색 대상에서 제외할 카테고리 (eDM, PDF Extractor, Chart Generator)
const EXCLUDED_SLUGS = ['edm']

export const GET = withRouteHandler(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const categorySlug = searchParams.get('categorySlug') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    const searchQuery = q || ''
    const hasQuery = Boolean(searchQuery)
    const hasFilters = Boolean(categorySlug || dateFrom || dateTo)

    // 최소 1개 조건 필요: 제목 또는 (카테고리/날짜) 필터
    if (!hasQuery && !hasFilters) {
      return NextResponse.json({ results: [] })
    }

    const dateFromDate = dateFrom ? new Date(dateFrom) : null
    const dateToDate = dateTo ? new Date(dateTo) : null
    if (dateToDate) {
      dateToDate.setHours(23, 59, 59, 999)
    }

    const results: SearchResult[] = []

    const shouldSearchPost = () => {
      if (!categorySlug) return true
      const nonPostSlugs = ['diagram', 'wallpaper', 'card', 'welcome-board']
      return !nonPostSlugs.includes(categorySlug)
    }

    const shouldSearchDiagram = () => {
      if (!categorySlug || categorySlug === 'diagram') return true
      return false
    }

    const shouldSearchDesktop = () => {
      if (!categorySlug || categorySlug === 'wallpaper') return true
      return false
    }

    const shouldSearchCard = () => {
      if (!categorySlug || categorySlug === 'card') return true
      return false
    }

    const shouldSearchWelcomeBoard = () => {
      if (!categorySlug || categorySlug === 'welcome-board') return true
      return false
    }

    // HW / 디자인 의뢰 / ICON+ 는 Post와 별개 모델 → 카테고리(pageType→slug/name) 매핑이 필요.
    // 결과의 categoryName/slug(이동 경로)와 카테고리 필터 매칭에 사용한다.
    const auxCategories = await prisma.category.findMany({
      where: { pageType: { in: ['hardware', 'design-request', 'icon'] } },
      select: { slug: true, name: true, pageType: true },
    })
    const auxCategoryByPageType = new Map(
      auxCategories.map((c) => [c.pageType, c] as const)
    )
    const hardwareCategory = auxCategoryByPageType.get('hardware')
    const designRequestCategory = auxCategoryByPageType.get('design-request')
    const iconCategory = auxCategoryByPageType.get('icon')

    // 카테고리 필터가 없으면 검색, 있으면 해당 카테고리 슬러그와 일치할 때만 검색
    const shouldSearchHardware = () =>
      Boolean(hardwareCategory) &&
      (!categorySlug || categorySlug === hardwareCategory!.slug)
    const shouldSearchDesignRequest = () =>
      Boolean(designRequestCategory) &&
      (!categorySlug || categorySlug === designRequestCategory!.slug)
    const shouldSearchIconPlus = () =>
      Boolean(iconCategory) &&
      (!categorySlug || categorySlug === iconCategory!.slug)

    // 1. Post 검색
    if (shouldSearchPost()) {
      const postWhere: Prisma.PostWhereInput = {
        status: 'PUBLISHED',
        category: {
          slug: { notIn: EXCLUDED_SLUGS },
        },
      }

      if (searchQuery) {
        postWhere.title = { contains: searchQuery, mode: 'insensitive' }
      }

      if (categorySlug && !['diagram', 'wallpaper', 'card', 'welcome-board'].includes(categorySlug)) {
        postWhere.category = { slug: categorySlug }
      }

      if (dateFromDate || dateToDate) {
        postWhere.createdAt = {}
        if (dateFromDate) postWhere.createdAt.gte = dateFromDate
        if (dateToDate) postWhere.createdAt.lte = dateToDate
      }

      const posts = await prisma.post.findMany({
        where: postWhere,
        select: {
          id: true,
          title: true,
          createdAt: true,
          category: { select: { name: true, slug: true, pageType: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      })

      for (const post of posts) {
        const effectivePageType =
          post.category.pageType || getDefaultPageType(post.category.type)
        results.push({
          id: post.id,
          resourceType: 'post',
          categoryName: post.category.name,
          categorySlug: post.category.slug,
          title: post.title,
          createdAt: post.createdAt.toISOString(),
          slug: post.category.slug,
          pageType: effectivePageType,
        })
      }
    }

    // 2. Diagram 검색 (본인 생성물만)
    if (shouldSearchDiagram()) {
      const diagramWhere: Prisma.DiagramWhereInput = {
        authorId: session.user.id,
      }
      if (searchQuery) {
        diagramWhere.title = { contains: searchQuery, mode: 'insensitive' }
      }
      if (dateFromDate || dateToDate) {
        diagramWhere.createdAt = {}
        if (dateFromDate) diagramWhere.createdAt.gte = dateFromDate
        if (dateToDate) diagramWhere.createdAt.lte = dateToDate
      }

      const diagrams = await prisma.diagram.findMany({
        where: diagramWhere,
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      })

      for (const d of diagrams) {
        results.push({
          id: d.id,
          resourceType: 'diagram',
          categoryName: '다이어그램',
          categorySlug: 'diagram',
          title: d.title,
          createdAt: d.createdAt.toISOString(),
          slug: 'diagram',
        })
      }
    }

    // 3. Desktop Wallpaper 검색
    if (shouldSearchDesktop()) {
      const desktopWhere: Prisma.DesktopWallpaperWhereInput = {}
      if (searchQuery) {
        desktopWhere.title = { contains: searchQuery, mode: 'insensitive' }
      }
      if (dateFromDate || dateToDate) {
        desktopWhere.createdAt = {}
        if (dateFromDate) desktopWhere.createdAt.gte = dateFromDate
        if (dateToDate) desktopWhere.createdAt.lte = dateToDate
      }

      const wallpapers = await prisma.desktopWallpaper.findMany({
        where: desktopWhere,
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      })

      for (const w of wallpapers) {
        results.push({
          id: w.id,
          resourceType: 'desktop',
          categoryName: '바탕화면',
          categorySlug: 'wallpaper',
          title: w.title,
          createdAt: w.createdAt.toISOString(),
          slug: 'wallpaper',
        })
      }
    }

    // 4. Card Template 검색
    if (shouldSearchCard()) {
      const cardWhere: Prisma.CardTemplateWhereInput = {}
      if (searchQuery) {
        cardWhere.name = { contains: searchQuery, mode: 'insensitive' }
      }
      if (dateFromDate || dateToDate) {
        cardWhere.createdAt = {}
        if (dateFromDate) cardWhere.createdAt.gte = dateFromDate
        if (dateToDate) cardWhere.createdAt.lte = dateToDate
      }

      const cards = await prisma.cardTemplate.findMany({
        where: cardWhere,
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      })

      for (const c of cards) {
        results.push({
          id: c.id,
          resourceType: 'card',
          categoryName: '감사/연말 카드',
          categorySlug: 'card',
          title: c.name,
          createdAt: c.createdAt.toISOString(),
          slug: 'card',
        })
      }
    }

    // 5. Welcome Board Template 검색
    if (shouldSearchWelcomeBoard()) {
      const wbWhere: Prisma.WelcomeBoardTemplateWhereInput = {}
      if (searchQuery) {
        wbWhere.name = { contains: searchQuery, mode: 'insensitive' }
      }
      if (dateFromDate || dateToDate) {
        wbWhere.createdAt = {}
        if (dateFromDate) wbWhere.createdAt.gte = dateFromDate
        if (dateToDate) wbWhere.createdAt.lte = dateToDate
      }

      const wbs = await prisma.welcomeBoardTemplate.findMany({
        where: wbWhere,
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      })

      for (const wb of wbs) {
        results.push({
          id: wb.id,
          resourceType: 'welcomeboard',
          categoryName: '웰컴보드',
          categorySlug: 'welcome-board',
          title: wb.name,
          createdAt: wb.createdAt.toISOString(),
          slug: 'welcome-board',
        })
      }
    }

    // 6. HardwareProduct 검색 (전 사용자 공개, GET 무제한 조회와 동일)
    if (shouldSearchHardware() && hardwareCategory) {
      const hwWhere: Prisma.HardwareProductWhereInput = {}
      if (searchQuery) {
        hwWhere.title = { contains: searchQuery, mode: 'insensitive' }
      }
      if (dateFromDate || dateToDate) {
        hwWhere.createdAt = {}
        if (dateFromDate) hwWhere.createdAt.gte = dateFromDate
        if (dateToDate) hwWhere.createdAt.lte = dateToDate
      }

      const products = await prisma.hardwareProduct.findMany({
        where: hwWhere,
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      })

      for (const p of products) {
        results.push({
          id: p.id,
          resourceType: 'hardware',
          categoryName: hardwareCategory.name,
          categorySlug: hardwareCategory.slug,
          title: p.title,
          createdAt: p.createdAt.toISOString(),
          slug: hardwareCategory.slug,
        })
      }
    }

    // 7. DesignRequest 검색 (목록 API와 동일하게 전 사용자 열람)
    if (shouldSearchDesignRequest() && designRequestCategory) {
      const drWhere: Prisma.DesignRequestWhereInput = {}
      if (searchQuery) {
        drWhere.title = { contains: searchQuery, mode: 'insensitive' }
      }
      if (dateFromDate || dateToDate) {
        drWhere.createdAt = {}
        if (dateFromDate) drWhere.createdAt.gte = dateFromDate
        if (dateToDate) drWhere.createdAt.lte = dateToDate
      }

      const designRequests = await prisma.designRequest.findMany({
        where: drWhere,
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      })

      for (const dr of designRequests) {
        results.push({
          id: dr.id,
          resourceType: 'designrequest',
          categoryName: designRequestCategory.name,
          categorySlug: designRequestCategory.slug,
          title: dr.title,
          createdAt: dr.createdAt.toISOString(),
          slug: designRequestCategory.slug,
        })
      }
    }

    // 8. IconPlusResource 검색 (ICON+ 탭, 로그인 사용자 전체 열람). 제목 필드는 name.
    if (shouldSearchIconPlus() && iconCategory) {
      const ipWhere: Prisma.IconPlusResourceWhereInput = {}
      if (searchQuery) {
        ipWhere.name = { contains: searchQuery, mode: 'insensitive' }
      }
      if (dateFromDate || dateToDate) {
        ipWhere.createdAt = {}
        if (dateFromDate) ipWhere.createdAt.gte = dateFromDate
        if (dateToDate) ipWhere.createdAt.lte = dateToDate
      }

      const iconPlusResources = await prisma.iconPlusResource.findMany({
        where: ipWhere,
        // svgContent 등 큰 필드 제외 — 검색 결과엔 id/name/createdAt만 필요
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      })

      for (const r of iconPlusResources) {
        results.push({
          id: r.id,
          resourceType: 'iconplus',
          // ICON 탭 게시물(Post)과 구분되도록 라벨에 (ICON+) 표기
          categoryName: `${iconCategory.name} (ICON+)`,
          categorySlug: iconCategory.slug,
          title: r.name,
          createdAt: r.createdAt.toISOString(),
          slug: iconCategory.slug,
        })
      }
    }

    // 생성일 내림차순 정렬 (최대 50건 유지)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const limitedResults = results.slice(0, MAX_RESULTS)

    return NextResponse.json({ results: limitedResults })
}, '검색 중 오류가 발생했습니다.')
