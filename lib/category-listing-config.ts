/**
 * 표준 카테고리(목록형 PDF 브로셔) 페이지의 카테고리별 메타데이터 중앙 정의.
 *
 * Damo/Cloudbric/iSIGN/WAPPLES 등은 페이지/카드/속성패널/업로드 다이얼로그가
 * 거의 동일하고 아래 값만 다르다. 제네릭 컴포넌트(`_generic/`)가 이 config를 받아
 * 동작을 재현하고, 각 `*ListPage.tsx`는 config를 넘기는 얇은 래퍼가 된다.
 *
 * 키는 `category.pageType`(라우팅 분기 값)과 동일하다.
 */
export interface CategoryListingConfig {
  /** 라우팅 분기 값(`category.pageType`)이자 이 config의 키 */
  pageType: string
  /** 사용자 표시용 제품 라벨 (업로드 다이얼로그 제목 등에 사용) */
  label: string
  /** 카드/스켈레톤 고정 너비(px) */
  cardWidth: number
  /** 업로드 시 선택 가능한 타입 목록 (Post.concept 필드에 저장) */
  types: string[]
  /** 업로드 시 선택 가능한 언어 목록 (Post.tool 필드에 저장) */
  languages: string[]
}

const LANGUAGES = ['EN', 'KR', 'JP']

export const CATEGORY_LISTING_CONFIG: Record<string, CategoryListingConfig> = {
  damo: {
    pageType: 'damo',
    label: 'D.AMO',
    cardWidth: 320,
    types: [
      'D.AMO',
      'D.AMO Cloud',
      'D.AMO KMS',
      'D.AMO for SAP',
      'D.AMO PACS',
      'D.AMO KE',
    ],
    languages: LANGUAGES,
  },
  cloudbric: {
    pageType: 'cloudbric',
    label: 'Cloudbric',
    cardWidth: 320,
    types: ['Cloudbric', 'WAF+', 'WMS', 'Managed Rules', 'RAS', 'PAS'],
    languages: LANGUAGES,
  },
  isign: {
    pageType: 'isign',
    label: 'iSIGN',
    cardWidth: 320,
    types: ['iSIGN', 'iSIGN PASS', 'iSIGN WA', 'iSIGN EA', 'iSIGN PL'],
    languages: LANGUAGES,
  },
  wapples: {
    pageType: 'wapples',
    label: 'WAPPLES',
    cardWidth: 320,
    types: ['WAPPLES', 'WAPPLES CC', 'WAPPLES SA', 'WAPPLES Cloud'],
    languages: LANGUAGES,
  },
}

/** 필터 메뉴 목록: 'ALL' + 타입 목록 */
export function getCategoryFilters(config: CategoryListingConfig): string[] {
  return ['ALL', ...config.types]
}

/** pageType으로 config 조회 (없으면 undefined) */
export function getCategoryListingConfig(
  pageType: string
): CategoryListingConfig | undefined {
  return CATEGORY_LISTING_CONFIG[pageType]
}
