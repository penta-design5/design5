interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface InsightGuideListPageProps {
  category: Category
}

/**
 * 「AI 사용가이드」 카드 갤러리 페이지.
 * P1: 라우팅 골격(플레이스홀더). 카드 그리드·구독·업로드는 P4에서 구현.
 * 계획: docs/INSIGHTS_구현계획.md §8-1 · Handoff: docs/INSIGHTS_handoff.md
 */
export function InsightGuideListPage({ category }: InsightGuideListPageProps) {
  return (
    <div className="container mx-auto px-8 py-6">
      <h1 className="page-header-title">{category.name}</h1>
      <p className="text-muted-foreground mt-4">
        카드 갤러리는 준비 중입니다. (P4에서 구현 예정)
      </p>
    </div>
  )
}
