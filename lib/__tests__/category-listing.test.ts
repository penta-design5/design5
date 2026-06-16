import { describe, it, expect } from 'vitest'
import {
  computeColumnCount,
  distributeIntoColumns,
} from '@/lib/category-listing/masonry'
import {
  getPostFileUrl,
  buildPdfDownloadFilename,
} from '@/lib/category-listing/post-file'
import {
  CATEGORY_LISTING_CONFIG,
  getCategoryFilters,
  getCategoryListingConfig,
} from '@/lib/category-listing-config'

describe('category-listing/masonry', () => {
  describe('computeColumnCount', () => {
    it('컨테이너 너비에 맞는 열 개수를 계산한다 (gap 포함)', () => {
      // (1208 + 8) / (320 + 8) = 3.7... → 3
      expect(computeColumnCount(1208, 320, 8)).toBe(3)
      // (1312 + 8) / 328 = 4.02 → 4
      expect(computeColumnCount(1312, 320, 8)).toBe(4)
    })

    it('너비가 카드보다 작아도 최소 1열을 보장한다', () => {
      expect(computeColumnCount(100, 320, 8)).toBe(1)
      expect(computeColumnCount(0, 320, 8)).toBe(1)
    })

    it('gap 기본값은 8이다', () => {
      expect(computeColumnCount(1208, 320)).toBe(computeColumnCount(1208, 320, 8))
    })
  })

  describe('distributeIntoColumns', () => {
    it('항목을 가장 짧은 열에 순서대로 채운다', () => {
      const items = [1, 2, 3, 4, 5]
      const cols = distributeIntoColumns(items, 2)
      expect(cols).toEqual([
        [1, 3, 5],
        [2, 4],
      ])
    })

    it('열 개수가 항목 수보다 많으면 빈 열이 생긴다', () => {
      const cols = distributeIntoColumns([1], 3)
      expect(cols).toEqual([[1], [], []])
    })

    it('항목이 없으면 빈 열들만 반환한다', () => {
      expect(distributeIntoColumns([], 2)).toEqual([[], []])
    })

    it('numColumns가 0 이하면 최소 1열로 보정한다', () => {
      expect(distributeIntoColumns([1, 2], 0)).toEqual([[1, 2]])
    })
  })
})

describe('category-listing/post-file', () => {
  describe('getPostFileUrl', () => {
    it('fileUrl이 있으면 그대로 반환한다', () => {
      expect(getPostFileUrl({ title: 't', fileUrl: 'https://x/a.pdf' })).toBe(
        'https://x/a.pdf'
      )
    })

    it('fileUrl이 없으면 images 배열에서 order가 가장 작은 url을 반환한다', () => {
      expect(
        getPostFileUrl({
          title: 't',
          images: [
            { url: 'b.pdf', name: 'b', order: 2 },
            { url: 'a.pdf', name: 'a', order: 1 },
          ],
        })
      ).toBe('a.pdf')
    })

    it('images가 JSON 문자열이어도 파싱한다', () => {
      expect(
        getPostFileUrl({
          title: 't',
          images: JSON.stringify([{ url: 'a.pdf', name: 'a', order: 0 }]),
        })
      ).toBe('a.pdf')
    })

    it('images가 깨진 문자열이면 null을 반환한다', () => {
      expect(getPostFileUrl({ title: 't', images: '{not json' })).toBeNull()
    })

    it('파일 정보가 전혀 없으면 null을 반환한다', () => {
      expect(getPostFileUrl({ title: 't' })).toBeNull()
    })
  })

  describe('buildPdfDownloadFilename', () => {
    it('제목_언어_제작일.pdf 형태로 만든다', () => {
      expect(
        buildPdfDownloadFilename({
          title: 'D.AMO 소개서',
          tool: 'KR',
          producedAt: '2026-03-09T00:00:00.000Z',
        })
      ).toBe('D.AMO 소개서_KR_20260309.pdf')
    })

    it('언어가 없으면 언어 구간을 생략한다', () => {
      expect(
        buildPdfDownloadFilename({
          title: 'doc',
          producedAt: '2026-01-02T00:00:00.000Z',
        })
      ).toBe('doc_20260102.pdf')
    })

    it('제작일이 없으면 날짜 구간을 생략한다', () => {
      expect(buildPdfDownloadFilename({ title: 'doc', tool: 'EN' })).toBe(
        'doc_EN.pdf'
      )
    })

    it('언어/제작일이 모두 없으면 제목만 사용한다', () => {
      expect(buildPdfDownloadFilename({ title: 'doc' })).toBe('doc.pdf')
    })
  })
})

describe('category-listing-config', () => {
  it('표준 카테고리 4종이 정의되어 있다', () => {
    expect(Object.keys(CATEGORY_LISTING_CONFIG).sort()).toEqual([
      'cloudbric',
      'damo',
      'isign',
      'wapples',
    ])
  })

  it('각 config의 pageType은 해당 키와 일치한다', () => {
    for (const [key, cfg] of Object.entries(CATEGORY_LISTING_CONFIG)) {
      expect(cfg.pageType).toBe(key)
    }
  })

  it('getCategoryFilters는 ALL을 맨 앞에 두고 타입을 잇는다', () => {
    const damo = CATEGORY_LISTING_CONFIG.damo
    expect(getCategoryFilters(damo)).toEqual(['ALL', ...damo.types])
  })

  it('getCategoryListingConfig는 알 수 없는 pageType에 undefined를 반환한다', () => {
    expect(getCategoryListingConfig('damo')).toBe(CATEGORY_LISTING_CONFIG.damo)
    expect(getCategoryListingConfig('nope')).toBeUndefined()
  })
})
