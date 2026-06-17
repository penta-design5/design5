import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { CategoryType, Prisma } from '@prisma/client'
import { withRouteHandler } from '@/lib/api/with-route-handler'

export const dynamic = 'force-dynamic'
export const revalidate = 30 // 30초 캐시 (실시간 반영 중요)

export const GET = withRouteHandler(async () => {
  await requireAdmin()

  // ADMIN과 ETC 타입 카테고리 제외
  const excludedTypes = [CategoryType.ADMIN, CategoryType.ETC]

  // Post 기반 게시물 수 (ADMIN, ETC 제외)
  // ※ 공지사항(Notice)·디자인 의뢰(DesignRequest)는 별도 모델이라 Post 통계에 포함되지 않음(자동 제외)
  const postCount = await prisma.post.count({
    where: {
      category: {
        type: {
          notIn: excludedTypes,
        },
      },
    },
  })

  // HW는 Post가 아니라 HardwareProduct 모델(HW 카테고리 = SOURCE 타입)이므로 별도로 합산
  const hardwareCount = await prisma.hardwareProduct.count()

  // TEMPLATE 타입 카테고리(카드/웰컴보드/다이어그램/eDM/바탕화면)도 Post가 아니라 각각 별도 모델.
  // 게시물 수와 이미지 수를 함께 집계한다.
  const [cardTemplates, edms, desktops, welcomeCount, diagramCount] =
    await Promise.all([
      prisma.cardTemplate.findMany({ select: { backgroundImages: true } }),
      prisma.edm.findMany({ select: { cellImages: true } }),
      prisma.desktopWallpaper.findMany({
        select: { backgroundUrlWindows: true, backgroundUrlMac: true },
      }),
      prisma.welcomeBoardTemplate.count(),
      prisma.diagram.count(),
    ])

  const templateCount =
    cardTemplates.length +
    edms.length +
    desktops.length +
    welcomeCount +
    diagramCount

  // TEMPLATE 이미지 수: 카드(backgroundImages 배열) + eDM(cellImages 맵) +
  // 바탕화면(windows/mac) + 웰컴보드(backgroundUrl 1개). 다이어그램은 업로드 이미지 없음.
  let templateImages = 0
  cardTemplates.forEach((c) => {
    if (Array.isArray(c.backgroundImages)) templateImages += c.backgroundImages.length
  })
  edms.forEach((e) => {
    const cells = e.cellImages
    if (cells && typeof cells === 'object' && !Array.isArray(cells)) {
      templateImages += Object.keys(cells).length
    }
  })
  desktops.forEach((d) => {
    if (d.backgroundUrlWindows) templateImages += 1
    if (d.backgroundUrlMac) templateImages += 1
  })
  templateImages += welcomeCount // 웰컴보드는 backgroundUrl(필수) 1개

  // 전체 게시물 수 = Post + HardwareProduct + TEMPLATE 모델들
  // (각 버킷에도 동일하게 합산되어 총계 = 4개 버킷 합과 일치)
  const totalPosts = postCount + hardwareCount + templateCount

  // 전체 게시물의 이미지 총 개수 계산
  const postsWithImages = await prisma.post.findMany({
    where: {
      category: {
        type: {
          notIn: excludedTypes,
        },
      },
      images: {
        not: Prisma.JsonNull,
      },
    },
    select: {
      images: true,
    },
  })

  let totalImages = 0
  postsWithImages.forEach((post) => {
    if (post.images) {
      let images: Array<{ url: string; name: string; order: number }> = []

      if (Array.isArray(post.images)) {
        images = post.images as Array<{ url: string; name: string; order: number }>
      } else if (typeof post.images === 'string') {
        try {
          images = JSON.parse(post.images)
        } catch {
          images = []
        }
      } else if (typeof post.images === 'object' && post.images !== null) {
        const parsed = post.images as any
        if (Array.isArray(parsed)) {
          images = parsed
        }
      }

      totalImages += images.length
    }
  })

  // HW 제품 이미지(제품당 imageUrl 1개) + TEMPLATE 모델 이미지도 전체 이미지에 합산
  totalImages += hardwareCount + templateImages

  // 카테고리 타입별 게시물 수 (더 효율적인 방법)
  const postsWithCategory = await prisma.post.findMany({
    where: {
      category: {
        type: {
          notIn: excludedTypes,
        },
      },
    },
    include: {
      category: {
        select: {
          type: true,
        },
      },
    },
  })

  const categoryTypeCounts: Record<string, number> = {
    WORK: 0,
    SOURCE: 0,
    TEMPLATE: 0,
    BROCHURE: 0,
  }

  postsWithCategory.forEach((post) => {
    const type = post.category.type
    if (type in categoryTypeCounts) {
      categoryTypeCounts[type]++
    }
  })

  // 별도 모델로 저장되는 카테고리를 해당 타입 버킷에 합산 → 4개 버킷 합 == totalPosts
  categoryTypeCounts.SOURCE += hardwareCount // HW
  categoryTypeCounts.TEMPLATE += templateCount // 카드/웰컴보드/다이어그램/eDM/바탕화면

  return NextResponse.json({
    totalPosts,
    totalImages,
    postsByCategoryType: categoryTypeCounts,
  }, {
    headers: {
      'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
    },
  })
}, '통계를 가져오는 중 오류가 발생했습니다.')
