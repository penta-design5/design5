import type { SearchResult } from '@/app/api/search/route'

/**
 * 검색 결과의 "보기" 버튼 클릭 시 이동할 URL 반환
 * - gallery/desktop: 상세/편집 페이지로 직접 이동
 * - 그 외 post: 목록 페이지에서 postId로 선택 상태
 * - diagram: /diagram/[id] 편집 페이지
 * - desktop/card/welcomeboard: 각각 해당 slug + id 또는 templateId
 */
export function getViewUrl(result: SearchResult): string {
  const { resourceType, slug, id } = result

  switch (resourceType) {
    case 'post': {
      const pageType = result.pageType
      // gallery: 상세 페이지
      if (pageType === 'gallery') {
        return `/${slug}/${id}`
      }
      // desktop: 편집 페이지
      if (pageType === 'desktop') {
        return `/${slug}/${id}`
      }
      // ci-bi, character, ppt, icon, wapples, damo, isign, cloudbric, welcomeboard: 목록에서 선택
      return `/${slug}?postId=${id}`
    }

    case 'diagram':
      return `/diagram/${id}`

    case 'desktop':
      return `/wallpaper/${id}`

    case 'card':
      return `/card?templateId=${id}`

    case 'welcomeboard':
      return `/welcome-board?templateId=${id}`

    default:
      return '/'
  }
}
