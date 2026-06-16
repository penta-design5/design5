import type { SortablePost } from './comparators'

/** 우선순위 기본값(가장 낮음): 필터 순서에 없는 게시물 */
export const DEFAULT_PRIORITY = 999

/**
 * concept 값이 filterOrder에서 차지하는 인덱스를 우선순위로 사용한다.
 * concept가 없거나 목록에 없으면 DEFAULT_PRIORITY.
 * (WAPPLES/D.AMO/iSIGN/Cloudbric/캐릭터 카테고리의 정렬 우선순위 로직)
 */
export function conceptPriority(
  post: SortablePost,
  filterOrder: string[]
): number {
  if (post.concept) {
    const index = filterOrder.indexOf(post.concept)
    if (index !== -1) return index
  }
  return DEFAULT_PRIORITY
}

/**
 * CI/BI 카테고리 전용 우선순위.
 * - concept === 'CI' → 0 (최상위)
 * - 그 외엔 태그가 filterOrder의 항목과 처음 매칭되는 위치 i → i + 1
 * - 매칭 없음 → DEFAULT_PRIORITY
 */
export function ciBiPriority(
  post: SortablePost,
  filterOrder: string[]
): number {
  if (post.concept === 'CI') {
    return 0
  }
  const postTags = post.tags?.map((pt) => pt.tag.name) || []
  for (let i = 0; i < filterOrder.length; i++) {
    if (postTags.includes(filterOrder[i])) {
      return i + 1 // 첫 번째 매칭 태그만 사용
    }
  }
  return DEFAULT_PRIORITY
}
