/**
 * posts/route.ts GET의 카테고리별 in-memory 정렬 로직을 통합한 모듈.
 *
 * 기존에는 Character/CiBi/WAPPLES/D.AMO/iSIGN/Cloudbric 6개 블록이 거의 동일하게
 * 복붙되어 있었다(차이는 filterOrder, 우선순위 산출 방식, 타이브레이커뿐).
 * 여기서 그 차이만 config로 두고 단일 경로로 통합한다.
 *
 * ⚠️ 동작 보존: 원본과 동일하게 "전체 페치 → 메모리 정렬 → slice" 방식을 유지한다.
 * (in-memory → DB 정렬 전환은 별도 검증이 필요한 위험 작업이라 Phase 2 범위에서 제외)
 */
import {
  compareByCreatedAtDesc,
  compareByProducedThenCreatedDesc,
  type SortablePost,
} from './comparators'
import { conceptPriority, ciBiPriority } from './priority'

export {
  compareByCreatedAtDesc,
  compareByProducedThenCreatedDesc,
  type SortablePost,
} from './comparators'
export { conceptPriority, ciBiPriority, DEFAULT_PRIORITY } from './priority'

/**
 * 우선순위 → 타이브레이커 순으로 정렬한다 (비파괴: 새 배열 반환).
 * 원본의 `map({post,priority}) → sort → map(post)` 패턴과 동일. JS sort는 안정 정렬.
 */
export function sortByPriority<T extends SortablePost>(
  posts: T[],
  getPriority: (post: T) => number,
  tieComparator: (a: T, b: T) => number
): T[] {
  return posts
    .map((post) => ({ post, priority: getPriority(post) }))
    .sort((a, b) =>
      a.priority !== b.priority
        ? a.priority - b.priority
        : tieComparator(a.post, b.post)
    )
    .map((item) => item.post)
}

/** 비교 함수로 정렬 (비파괴: 새 배열 반환) */
export function sortByComparator<T extends SortablePost>(
  posts: T[],
  comparator: (a: T, b: T) => number
): T[] {
  return [...posts].sort(comparator)
}

/**
 * pageType별 정렬 우선순위 목록(필터 메뉴 순서).
 * 4개 표준 카테고리(wapples/damo/isign/cloudbric)는 UI 필터/타입 목록과 동일하지만,
 * 정렬은 라우트 고유 관심사이므로 여기서 단일 출처로 관리한다.
 */
export const POST_SORT_FILTER_ORDERS: Record<string, string[]> = {
  character: [
    '대표이사',
    '보안사업본부',
    '인증보안사업본부',
    '미래보안사업본부',
    '기획실',
    '품질관리실',
    '보안기술연구소',
    '인사부',
    '재경부',
  ],
  'ci-bi': ['CI', 'D.AMO', 'WAPPLES', 'iSIGN', 'Cloudbric', 'etc'],
  wapples: ['WAPPLES', 'WAPPLES CC', 'WAPPLES SA', 'WAPPLES Cloud'],
  damo: [
    'D.AMO',
    'D.AMO Cloud',
    'D.AMO KMS',
    'D.AMO for SAP',
    'D.AMO PACS',
    'D.AMO KE',
  ],
  isign: ['iSIGN', 'iSIGN PASS', 'iSIGN WA', 'iSIGN EA', 'iSIGN PL'],
  cloudbric: ['Cloudbric', 'WAF+', 'WMS', 'Managed Rules', 'RAS', 'PAS'],
}

/** "제품 브로셔" 표준 카테고리: 항상 in-memory 정렬, ALL/특정필터 분기 */
const STANDARD_PRODUCT_PAGE_TYPES = new Set([
  'wapples',
  'damo',
  'isign',
  'cloudbric',
])

/**
 * 해당 (pageType, isAllFilter) 조합이 in-memory 정렬을 필요로 하면 정렬 함수를 반환한다.
 * 필요 없으면 null → 호출자는 DB 레벨 정렬(orderBy + skip/take) 경로를 사용한다.
 *
 * - 표준 제품(wapples/damo/isign/cloudbric): 항상 정렬
 *     · ALL 필터: concept 우선순위 → 제작일(없으면 생성일) 내림차순
 *     · 특정 필터: 제작일(없으면 생성일) 내림차순
 * - character: ALL 필터일 때만 concept 우선순위 → 생성일 내림차순
 * - ci-bi:     ALL 필터일 때만 CI/태그 우선순위 → 생성일 내림차순
 * - 그 외(gallery/일반): null
 */
export function getInMemoryPostSorter(
  pageType: string | null | undefined,
  isAllFilter: boolean
): (<T extends SortablePost>(posts: T[]) => T[]) | null {
  if (pageType && STANDARD_PRODUCT_PAGE_TYPES.has(pageType)) {
    const filterOrder = POST_SORT_FILTER_ORDERS[pageType]
    if (isAllFilter) {
      return (posts) =>
        sortByPriority(
          posts,
          (post) => conceptPriority(post, filterOrder),
          compareByProducedThenCreatedDesc
        )
    }
    return (posts) => sortByComparator(posts, compareByProducedThenCreatedDesc)
  }

  if (pageType === 'character' && isAllFilter) {
    const filterOrder = POST_SORT_FILTER_ORDERS.character
    return (posts) =>
      sortByPriority(
        posts,
        (post) => conceptPriority(post, filterOrder),
        compareByCreatedAtDesc
      )
  }

  if (pageType === 'ci-bi' && isAllFilter) {
    const filterOrder = POST_SORT_FILTER_ORDERS['ci-bi']
    return (posts) =>
      sortByPriority(
        posts,
        (post) => ciBiPriority(post, filterOrder),
        compareByCreatedAtDesc
      )
  }

  return null
}
