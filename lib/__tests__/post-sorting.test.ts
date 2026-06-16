import { describe, it, expect } from 'vitest'
import {
  conceptPriority,
  ciBiPriority,
  DEFAULT_PRIORITY,
  sortByPriority,
  sortByComparator,
  compareByCreatedAtDesc,
  compareByProducedThenCreatedDesc,
  getInMemoryPostSorter,
  POST_SORT_FILTER_ORDERS,
  type SortablePost,
} from '@/lib/post-sorting'

// 테스트용 게시물 빌더
function post(p: Partial<SortablePost> & { id?: string }): SortablePost & { id: string } {
  return {
    id: p.id ?? 'x',
    concept: p.concept ?? null,
    createdAt: p.createdAt ?? '2026-01-01T00:00:00.000Z',
    producedAt: p.producedAt ?? null,
    tags: p.tags ?? null,
  }
}

describe('post-sorting/comparators', () => {
  it('compareByCreatedAtDesc: 최신 생성일이 먼저', () => {
    const a = post({ createdAt: '2026-01-01' })
    const b = post({ createdAt: '2026-06-01' })
    expect(compareByCreatedAtDesc(a, b)).toBeGreaterThan(0) // b가 앞
  })

  it('compareByProducedThenCreatedDesc: 제작일 우선, 없으면 생성일', () => {
    const a = post({ producedAt: '2026-03-01', createdAt: '2020-01-01' })
    const b = post({ producedAt: null, createdAt: '2026-05-01' })
    // a 제작일(3월) vs b 생성일(5월) → b가 앞
    expect(compareByProducedThenCreatedDesc(a, b)).toBeGreaterThan(0)
  })
})

describe('post-sorting/priority', () => {
  describe('conceptPriority', () => {
    const order = ['D.AMO', 'D.AMO Cloud', 'D.AMO KMS']
    it('concept의 인덱스를 우선순위로 반환', () => {
      expect(conceptPriority(post({ concept: 'D.AMO' }), order)).toBe(0)
      expect(conceptPriority(post({ concept: 'D.AMO KMS' }), order)).toBe(2)
    })
    it('concept 없음/목록에 없음 → DEFAULT_PRIORITY', () => {
      expect(conceptPriority(post({ concept: null }), order)).toBe(DEFAULT_PRIORITY)
      expect(conceptPriority(post({ concept: '없는타입' }), order)).toBe(
        DEFAULT_PRIORITY
      )
    })
  })

  describe('ciBiPriority', () => {
    const order = ['CI', 'D.AMO', 'WAPPLES', 'iSIGN', 'Cloudbric', 'etc']
    it('concept가 CI면 최상위 0', () => {
      expect(ciBiPriority(post({ concept: 'CI' }), order)).toBe(0)
    })
    it('CI가 아니면 첫 매칭 태그 인덱스 + 1', () => {
      const p = post({ concept: 'BI', tags: [{ tag: { name: 'WAPPLES' } }] })
      expect(ciBiPriority(p, order)).toBe(3) // WAPPLES 인덱스 2 + 1
    })
    it('여러 태그 중 filterOrder 기준 첫 매칭만 사용', () => {
      const p = post({
        concept: 'BI',
        tags: [{ tag: { name: 'Cloudbric' } }, { tag: { name: 'D.AMO' } }],
      })
      // filterOrder 순서대로 D.AMO(idx1)가 Cloudbric(idx4)보다 먼저 매칭 → 1 + 1 = 2
      expect(ciBiPriority(p, order)).toBe(2)
    })
    it('매칭 태그 없음 → DEFAULT_PRIORITY', () => {
      expect(ciBiPriority(post({ concept: 'BI', tags: [] }), order)).toBe(
        DEFAULT_PRIORITY
      )
    })
  })
})

describe('post-sorting/sortByPriority', () => {
  it('우선순위 오름차순, 동순위는 타이브레이커', () => {
    const order = ['A', 'B']
    const posts = [
      post({ id: 'b1', concept: 'B', createdAt: '2026-01-01' }),
      post({ id: 'a1', concept: 'A', createdAt: '2026-01-01' }),
      post({ id: 'a2', concept: 'A', createdAt: '2026-06-01' }),
    ]
    const sorted = sortByPriority(
      posts,
      (p) => conceptPriority(p, order),
      compareByCreatedAtDesc
    )
    // A(우선)들 중 최신(a2) 먼저, 그다음 a1, 마지막 B
    expect(sorted.map((p: any) => p.id)).toEqual(['a2', 'a1', 'b1'])
  })

  it('원본 배열을 변형하지 않는다 (비파괴)', () => {
    const posts = [post({ id: '1' }), post({ id: '2' })]
    const copy = [...posts]
    sortByPriority(posts, () => 0, compareByCreatedAtDesc)
    expect(posts).toEqual(copy)
  })
})

describe('post-sorting/getInMemoryPostSorter', () => {
  it('표준 제품 카테고리는 ALL 필터에서 우선순위+제작일 정렬', () => {
    const sorter = getInMemoryPostSorter('damo', true)!
    expect(sorter).toBeTypeOf('function')
    const posts = [
      post({ id: 'kms', concept: 'D.AMO KMS', producedAt: '2026-05-01' }),
      post({ id: 'amo-old', concept: 'D.AMO', producedAt: '2020-01-01' }),
      post({ id: 'amo-new', concept: 'D.AMO', producedAt: '2026-01-01' }),
    ]
    // D.AMO(idx0) 먼저, 그 안에서 제작일 내림차순 → amo-new, amo-old, 그다음 KMS
    expect(sorter(posts).map((p: any) => p.id)).toEqual([
      'amo-new',
      'amo-old',
      'kms',
    ])
  })

  it('표준 제품 카테고리는 특정 필터에서 제작일 내림차순만', () => {
    const sorter = getInMemoryPostSorter('cloudbric', false)!
    const posts = [
      post({ id: 'old', concept: 'WAF+', producedAt: '2020-01-01' }),
      post({ id: 'new', concept: 'WAF+', producedAt: '2026-01-01' }),
    ]
    expect(sorter(posts).map((p: any) => p.id)).toEqual(['new', 'old'])
  })

  it('character는 ALL일 때만 정렬, 특정 필터는 null', () => {
    expect(getInMemoryPostSorter('character', true)).toBeTypeOf('function')
    expect(getInMemoryPostSorter('character', false)).toBeNull()
  })

  it('ci-bi는 ALL일 때만 정렬, 특정 필터는 null', () => {
    expect(getInMemoryPostSorter('ci-bi', true)).toBeTypeOf('function')
    expect(getInMemoryPostSorter('ci-bi', false)).toBeNull()
  })

  it('gallery/일반/미지정 카테고리는 null (DB 정렬 경로)', () => {
    expect(getInMemoryPostSorter('gallery', true)).toBeNull()
    expect(getInMemoryPostSorter(null, true)).toBeNull()
    expect(getInMemoryPostSorter('hardware', true)).toBeNull()
  })

  it('ci-bi 정렬: CI 최상위 → 태그 우선순위 → 생성일', () => {
    const sorter = getInMemoryPostSorter('ci-bi', true)!
    const posts = [
      post({ id: 'tagged', concept: 'BI', tags: [{ tag: { name: 'D.AMO' } }] }),
      post({ id: 'ci', concept: 'CI' }),
      post({ id: 'none', concept: 'BI', tags: [] }),
    ]
    expect(sorter(posts).map((p: any) => p.id)).toEqual(['ci', 'tagged', 'none'])
  })

  it('표준 4종 filterOrder가 정의되어 있다', () => {
    for (const pt of ['wapples', 'damo', 'isign', 'cloudbric']) {
      expect(POST_SORT_FILTER_ORDERS[pt].length).toBeGreaterThan(0)
    }
  })
})

describe('post-sorting/sortByComparator', () => {
  it('비파괴 정렬', () => {
    const posts = [
      post({ id: 'a', createdAt: '2020-01-01' }),
      post({ id: 'b', createdAt: '2026-01-01' }),
    ]
    const copy = [...posts]
    const sorted = sortByComparator(posts, compareByCreatedAtDesc)
    expect(sorted.map((p: any) => p.id)).toEqual(['b', 'a'])
    expect(posts).toEqual(copy)
  })
})
