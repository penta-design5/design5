/**
 * 게시물 정렬용 비교 함수(순수). DB/Prisma 비의존 → 단위 테스트 가능.
 * 원본 posts/route.ts의 in-memory 정렬 비교 로직을 그대로 옮긴 것.
 */

export interface SortablePost {
  concept?: string | null
  createdAt: Date | string
  producedAt?: Date | string | null
  tags?: Array<{ tag: { name: string } }> | null
}

/** 생성일 내림차순 (최신순) */
export function compareByCreatedAtDesc(a: SortablePost, b: SortablePost): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

/**
 * 제작일 내림차순, 제작일이 없으면 생성일로 보조.
 * (가장 마지막 제작일 순)
 */
export function compareByProducedThenCreatedDesc(
  a: SortablePost,
  b: SortablePost
): number {
  const aDate = a.producedAt || a.createdAt
  const bDate = b.producedAt || b.createdAt
  return new Date(bDate).getTime() - new Date(aDate).getTime()
}
