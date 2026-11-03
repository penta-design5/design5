import { cache } from 'react'
import { revalidateTag, unstable_cache } from 'next/cache'
import { prisma } from './prisma'
import { CategoryType } from '@prisma/client'
import { isHtmlMenu } from './menus/schemas'

// 카테고리는 자주 변경되지 않으므로 긴 캐시 시간 사용
const CACHE_REVALIDATE_TIME = 300 // 5분

/** 메뉴 관리 변경 후 카테고리 캐시(사이드바·[slug] 조회)를 즉시 만료 */
export function invalidateCategoriesCache() {
  revalidateTag('categories', { expire: 0 })
}

/**
 * 클라이언트 컴포넌트로 넘기기 전 HTML 메뉴의 config(Storage 주소 포함)를 제거한다.
 * 버킷이 익명 읽기라 주소가 노출되면 로그인 없이 HTML을 받을 수 있다.
 */
export function stripHtmlMenuConfig<
  T extends CategoryWithConfig & { children?: CategoryWithConfig[] },
>(categories: T[]): T[] {
  return categories.map((c) => ({
    ...stripOne(c),
    ...(c.children ? { children: c.children.map(stripOne) } : {}),
  }))
}

type CategoryWithConfig = { pageType: string | null; config: unknown }

function stripOne<C extends CategoryWithConfig>(category: C): C {
  return isHtmlMenu(category) ? { ...category, config: null } : category
}

export const getCategories = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // 최상위 카테고리만
      },
      include: {
        children: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { order: 'asc' },
      ],
    })

    return categories
  },
  ['categories'],
  {
    revalidate: CACHE_REVALIDATE_TIME,
    tags: ['categories'],
  }
)

// getCategoryBySlug는 slug 파라미터가 있으므로 cache와 unstable_cache를 조합
export const getCategoryBySlug = cache(async (slug: string) => {
  // unstable_cache를 내부에서 사용하여 slug별 캐싱
  const getCachedCategory = unstable_cache(
    async (categorySlug: string) => {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: {
          children: {
            orderBy: {
              order: 'asc',
            },
          },
          parent: true,
        },
      })

      return category
    },
    ['category-by-slug'],
    {
      revalidate: CACHE_REVALIDATE_TIME,
      tags: ['categories'],
    }
  )

  return getCachedCategory(slug)
})

/** 구독 대상이 될 수 있는 카테고리 타입 */
const SUBSCRIBABLE_TYPES: CategoryType[] = [
  CategoryType.SOURCE,
  CategoryType.TEMPLATE,
  CategoryType.BROCHURE,
  CategoryType.INSIGHTS,
]

/** 구독에서 제외되는 메뉴 slug (사이드바에 숨겨진 메뉴) */
const SUBSCRIPTION_EXCLUDED_SLUGS = new Set(['diagram', 'edm'])

/**
 * 카테고리가 메뉴 구독 대상인지 판별한다.
 * 대상 = SOURCE/TEMPLATE/BROCHURE/INSIGHTS 타입이면서 slug ∉ {diagram, edm}, HTML 메뉴(게시물 없음) 제외.
 */
export function isSubscribableCategory(category: {
  type: CategoryType
  slug: string
  pageType?: string | null
}): boolean {
  return (
    SUBSCRIBABLE_TYPES.includes(category.type) &&
    !SUBSCRIPTION_EXCLUDED_SLUGS.has(category.slug) &&
    !isHtmlMenu(category)
  )
}

/**
 * pageType로 카테고리를 역매핑한다 (독립 모델 메뉴의 구독 알림용).
 * 예: 'hardware' | 'desktop' | 'welcomeboard' | 'card'.
 */
export async function resolveCategoryByPageType(pageType: string) {
  return prisma.category.findFirst({
    where: { pageType },
    select: { id: true, slug: true, type: true },
  })
}

export const getCategoriesByType = unstable_cache(
  async (type: CategoryType) => {
    const categories = await prisma.category.findMany({
      where: {
        type,
        parentId: null,
      },
      include: {
        children: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return categories
  },
  ['categories-by-type'],
  {
    revalidate: CACHE_REVALIDATE_TIME,
    tags: ['categories'],
  }
)

