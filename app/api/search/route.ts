import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CategoryType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const MAX_RESULTS = 50

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
  resourceType: 'post' | 'diagram' | 'desktop' | 'card' | 'welcomeboard'
  categoryName: string
  categorySlug: string
  title: string
  createdAt: string
  slug: string
  pageType?: string | null
}

// 검색 대상에서 제외할 카테고리 (eDM, PDF Extractor, Chart Generator)
const EXCLUDED_SLUGS = ['edm']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
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
        include: {
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

    // 생성일 내림차순 정렬 (최대 50건 유지)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const limitedResults = results.slice(0, MAX_RESULTS)

    return NextResponse.json({ results: limitedResults })
  } catch (error) {
    console.error('[GET /api/search] Error:', error)
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
