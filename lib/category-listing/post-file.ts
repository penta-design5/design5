/**
 * 카테고리 게시물(Post)의 PDF 파일 URL/다운로드 파일명 계산용 순수 함수.
 * 표준 카테고리(Damo/Cloudbric/iSIGN/WAPPLES) ListPage·Card에서 중복되던 로직을 통합.
 */

export interface PostImage {
  url: string
  name: string
  order: number
}

export interface PostFileSource {
  title: string
  tool?: string | null // 언어 (EN/KR/JP)
  producedAt?: Date | string | null
  fileUrl?: string | null
  images?: PostImage[] | string | null | unknown
}

/**
 * 게시물에서 대표 PDF 파일 URL을 추출한다.
 * fileUrl이 있으면 그대로, 없으면 images 배열에서 order가 가장 작은 항목의 url.
 */
export function getPostFileUrl(post: PostFileSource): string | null {
  if (post.fileUrl) return post.fileUrl

  if (post.images) {
    let images: PostImage[] = []
    if (Array.isArray(post.images)) {
      images = post.images as PostImage[]
    } else if (typeof post.images === 'string') {
      try {
        images = JSON.parse(post.images)
      } catch {
        images = []
      }
    }

    if (images.length > 0) {
      const sortedImages = [...images].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      )
      return sortedImages[0].url
    }
  }

  return null
}

/**
 * 다운로드 파일명 생성: `제목_언어_YYYYMMDD.pdf`
 * (언어/제작일이 없으면 해당 구간 생략)
 */
export function buildPdfDownloadFilename(post: PostFileSource): string {
  let fileName = post.title
  if (post.tool) {
    fileName += `_${post.tool}`
  }
  if (post.producedAt) {
    const date = new Date(post.producedAt)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    fileName += `_${year}${month}${day}`
  }
  return `${fileName}.pdf`
}
