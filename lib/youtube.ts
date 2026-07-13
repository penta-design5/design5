/**
 * 유튜브 URL 파싱 유틸.
 * watch·youtu.be·shorts·embed 형식에서 videoId를 추출하고
 * 재생 임베드 URL·썸네일 URL을 구성한다. (서버·클라이언트 공용)
 */

export interface ParsedYouTube {
  videoId: string
  watchUrl: string
  embedUrl: string
  /** 기본 고해상도 썸네일. 로드 실패 시 클라이언트에서 hqdefault로 폴백 */
  thumbnailUrl: string
}

export type YouTubeThumbnailQuality = 'maxresdefault' | 'hqdefault'

/** 유튜브 videoId 형식(11자) */
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

/** videoId로 썸네일 URL 구성 (Open Graph 이미지) */
export function youTubeThumbnailUrl(
  videoId: string,
  quality: YouTubeThumbnailQuality = 'maxresdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/** videoId로 재생 임베드 URL 구성 */
export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * 유튜브 URL에서 videoId 추출. 유효하지 않으면 null.
 * 지원: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID,
 *       youtube.com/embed/ID, youtube.com/v/ID (www.·m.·youtube-nocookie 포함).
 * videoId 문자열만 넘어온 경우도 그대로 인정.
 */
export function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null
  const raw = input.trim()

  // 이미 videoId만 넘어온 경우
  if (VIDEO_ID_RE.test(raw)) return raw

  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }

  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '')

  // youtu.be/ID
  if (host === 'youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0]
    return id && VIDEO_ID_RE.test(id) ? id : null
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    // watch?v=ID
    const v = u.searchParams.get('v')
    if (v && VIDEO_ID_RE.test(v)) return v

    // /shorts/ID, /embed/ID, /v/ID
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && ['shorts', 'embed', 'v'].includes(parts[0])) {
      const id = parts[1]
      return id && VIDEO_ID_RE.test(id) ? id : null
    }
  }

  return null
}

/** 유튜브 URL을 파싱해 재생/썸네일 정보를 구성. 무효 시 null. */
export function parseYouTubeUrl(input: string): ParsedYouTube | null {
  const videoId = extractYouTubeId(input)
  if (!videoId) return null
  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: youTubeEmbedUrl(videoId),
    thumbnailUrl: youTubeThumbnailUrl(videoId, 'maxresdefault'),
  }
}
