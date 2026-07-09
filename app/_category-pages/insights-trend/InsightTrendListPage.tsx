interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface InsightTrendListPageProps {
  category: Category
}

/**
 * 「최신 동향」 게시판 페이지.
 * P1: 라우팅 골격(플레이스홀더). 테이블·구독·글쓰기는 P5에서 구현.
 * 계획: docs/INSIGHTS_구현계획.md §8-2 · Handoff: docs/INSIGHTS_handoff.md
 */
export function InsightTrendListPage({ category }: InsightTrendListPageProps) {
  return (
    <div className="container mx-auto px-8 py-6">
      <h1 className="page-header-title">{category.name}</h1>
      <p className="text-muted-foreground mt-4">
        게시판은 준비 중입니다. (P5에서 구현 예정)
      </p>
    </div>
  )
}
