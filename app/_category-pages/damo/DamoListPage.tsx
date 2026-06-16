'use client'

import { GenericListPage } from '@/components/category-pages/_generic/GenericListPage'
import { CATEGORY_LISTING_CONFIG } from '@/lib/category-listing-config'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface DamoListPageProps {
  category: Category
}

/**
 * D.AMO 카테고리 목록 페이지.
 * 동작은 GenericListPage가 담당하고, 여기서는 D.AMO config만 주입한다.
 * (필터/타입/언어/카드 너비는 lib/category-listing-config.ts 참조)
 */
export function DamoListPage({ category }: DamoListPageProps) {
  return (
    <GenericListPage category={category} config={CATEGORY_LISTING_CONFIG.damo} />
  )
}
