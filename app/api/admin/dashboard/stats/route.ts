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

  // 전체 게시물 수 = Post + HardwareProduct (SOURCE 버킷에도 동일하게 합산되어 총계 = 4개 버킷 합과 일치)
  const totalPosts = postCount + hardwareCount

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

  // HW 제품 이미지(제품당 imageUrl 1개)도 전체 이미지에 합산
  totalImages += hardwareCount

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

  // HW(HardwareProduct)는 SOURCE 타입 카테고리이므로 SOURCE 버킷에 합산
  // → 4개 버킷 합 == totalPosts (총계와 카테고리별 합계 일치)
  categoryTypeCounts.SOURCE += hardwareCount

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
