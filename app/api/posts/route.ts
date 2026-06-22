import { NextResponse } from 'next/server'
import { CategoryType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'
import { getCategoryBySlug, isSubscribableCategory } from '@/lib/categories'
import { getInMemoryPostSorter } from '@/lib/post-sorting'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError } from '@/lib/api/errors'
import { notifyMenuUpdate } from '@/lib/mail/menu-subscription-notification'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  categorySlug: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  concept: z.string().optional(), // CI/BI 타입 필터
  tag: z.string().optional(), // 태그 필터
  year: z.string().optional(), // 연도 필터 (예: "2026", "~2022")
})

const imageSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  blurDataURL: z.string().optional(),
  name: z.string(),
  order: z.number().int().nonnegative(),
})

const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, '카테고리를 선택해주세요.'),
  images: z.array(imageSchema).min(1, '최소 1개의 이미지가 필요합니다.'),
  thumbnailUrl: z.string().url().optional().nullable(), // 썸네일로 사용할 이미지 URL (미지정 시 첫 번째 이미지)
  concept: z.string().optional().nullable(),
  tool: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  config: z.record(z.any()).optional().nullable(), // CI/BI 타입 등 추가 설정
  producedAt: z.string().datetime().optional().nullable(), // ISO 8601 형식의 날짜 문자열
})

// 게시물 목록/생성 응답에 공통으로 포함하는 관계 데이터
// (기존 각 분기의 include를 통합. category.pageType는 정렬 분기에 사용)
const POST_LIST_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      pageType: true,
    },
  },
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const

export const GET = withRouteHandler(async (request: Request) => {
    const { searchParams } = new URL(request.url)

    // null 값을 undefined로 변환
    const categorySlug = searchParams.get('categorySlug')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const concept = searchParams.get('concept')
    const tag = searchParams.get('tag')
    const year = searchParams.get('year')

    const validatedQuery = querySchema.parse({
      categorySlug: categorySlug || undefined,
      page: page || undefined,
      limit: limit || undefined,
      concept: concept || undefined,
      tag: tag || undefined,
      year: year || undefined,
    })

    const skip = (validatedQuery.page - 1) * validatedQuery.limit

    // 카테고리 필터
    const where: any = {
      status: 'PUBLISHED',
    }

    // 카테고리 정보 가져오기 (커스텀 정렬을 위해)
    let category: any = null
    if (validatedQuery.categorySlug) {
      // 캐싱된 카테고리 조회 함수 사용
      category = await getCategoryBySlug(validatedQuery.categorySlug)

      if (!category) {
        throw new NotFoundError('카테고리를 찾을 수 없습니다.')
      }

      where.categoryId = category.id
    }

    // concept 필터 (CI/BI 타입)
    if (validatedQuery.concept) {
      where.concept = validatedQuery.concept
    }

    // tag 필터
    if (validatedQuery.tag) {
      where.tags = {
        some: {
          tag: {
            name: validatedQuery.tag,
          },
        },
      }
    }

    // year 필터 (제작일 기준)
    if (validatedQuery.year) {
      if (validatedQuery.year.startsWith('~')) {
        // ~2022 형식: 2022년 이전 (2023-01-01 미만)
        const year = parseInt(validatedQuery.year.substring(1))
        if (!isNaN(year)) {
          where.producedAt = {
            lt: new Date(`${year + 1}-01-01`),
          }
        }
      } else {
        // 특정 연도: 해당 연도 범위
        const year = parseInt(validatedQuery.year)
        if (!isNaN(year)) {
          where.producedAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          }
        }
      }
    }

    // Penta Design 등: WORK 타입이고 pageType 미지정 시 UI 기본값이 gallery ([slug]/page.tsx)
    const isGalleryCategory =
      category?.pageType === 'gallery' ||
      (category?.pageType == null && category?.type === CategoryType.WORK)
    const isAllFilter = !validatedQuery.concept && !validatedQuery.tag

    // 카테고리별 in-memory 커스텀 정렬 함수 (해당 없으면 null → DB 정렬 경로)
    const sorter = getInMemoryPostSorter(category?.pageType, isAllFilter)

    let posts: any[]
    let total: number

    if (sorter) {
      // 커스텀 정렬: 전체 게시물을 가져와 메모리에서 정렬 후 페이지네이션
      const [allPosts, totalCount] = await Promise.all([
        prisma.post.findMany({ where, include: POST_LIST_INCLUDE }),
        prisma.post.count({ where }),
      ])

      total = totalCount
      posts = sorter(allPosts).slice(skip, skip + validatedQuery.limit)
    } else if (isGalleryCategory) {
      // Penta Design(갤러리): 제작일 최신순, 제작일 없음 → 생성일로 보조 정렬
      const [fetchedPosts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: validatedQuery.limit,
          orderBy: [
            { producedAt: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
          ],
          include: POST_LIST_INCLUDE,
        }),
        prisma.post.count({ where }),
      ])

      total = totalCount
      posts = fetchedPosts
    } else {
      // 일반 정렬 (최신순)
      const [fetchedPosts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: validatedQuery.limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: POST_LIST_INCLUDE,
        }),
        prisma.post.count({ where }),
      ])

      total = totalCount
      posts = fetchedPosts
    }

    const hasMore = skip + posts.length < total

    return NextResponse.json(
      {
        posts,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          hasMore,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'CDN-Cache-Control': 'public, s-maxage=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
        },
      }
    )
}, '게시물 목록을 가져오는 중 오류가 발생했습니다.')

export const POST = withRouteHandler(async (request: Request) => {
    const admin = await requireAdmin()
    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    // 썸네일: 요청에 지정된 URL 우선, 없으면 첫 번째 이미지
    const firstImage = validatedData.images[0]
    const thumbnailUrl =
      validatedData.thumbnailUrl != null
        ? validatedData.thumbnailUrl
        : firstImage.thumbnailUrl || firstImage.url

    // 태그 처리
    const tagConnections = []
    if (validatedData.tags && validatedData.tags.length > 0) {
      for (const tagName of validatedData.tags) {
        // 태그가 존재하는지 확인하고, 없으면 생성
        let tag = await prisma.tag.findUnique({
          where: { name: tagName },
        })

        if (!tag) {
          // slug 생성 (한글 지원)
          const slug = tagName
            .toLowerCase()
            .replace(/[^a-z0-9가-힣]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: `${slug}-${Date.now()}`,
            },
          })
        }

        tagConnections.push({
          tagId: tag.id,
        })
      }
    }

    // 게시물 생성
    // CI/BI 타입 정보는 concept 필드에 저장 (config 필드가 없으므로)
    // config가 있으면 ciBiType을 concept에 저장
    const conceptValue = validatedData.config?.ciBiType
      ? validatedData.config.ciBiType
      : validatedData.concept

    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        images: validatedData.images,
        thumbnailUrl: thumbnailUrl, // 썸네일 우선, 없으면 원본
        fileUrl: firstImage.url, // 하위 호환성 (원본 URL)
        fileSize: 0, // 이미지 크기는 나중에 계산 가능
        fileType: 'image',
        mimeType: 'image/*',
        concept: conceptValue,
        tool: validatedData.tool,
        producedAt: validatedData.producedAt ? new Date(validatedData.producedAt) : null,
        authorId: admin.id,
        tags: {
          create: tagConnections,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    // 구독 알림 (구독 대상 메뉴만; diagram·gallery 등 비대상은 스킵)
    if (isSubscribableCategory(post.category)) {
      await notifyMenuUpdate({
        categoryId: post.categoryId,
        action: 'created',
        title: post.title,
        slug: post.category.slug,
        postId: post.id,
      })
    }

    return NextResponse.json({ post }, { status: 201 })
}, '게시물을 생성하는 중 오류가 발생했습니다.')
