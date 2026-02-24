/**
 * B2 이미지 URL을 img src에 쓸 URL로 변환 (클라이언트용).
 * Worker URL은 그대로, B2 직접 URL은 프록시 경로로 변환.
 */

/** B2 스토리지 URL인지 여부 (Worker 또는 B2 직접). 클라이언트에서 B2 이미지 판별용 */
export function isB2StorageUrlForClient(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const publicUrl = process.env.NEXT_PUBLIC_B2_PUBLIC_URL?.replace(/\/$/, '')
  if (publicUrl && url.startsWith(publicUrl)) return true
  if (url.includes('assets.layerary.com')) return true
  if (url.includes('backblazeb2.com')) return true
  return false
}

/**
 * 반환된 src가 Worker(CDN) URL인지 여부.
 * Next.js Image에서 unoptimized 사용 여부 판별용 (Worker URL은 직접 로드해야 404 방지).
 */
export function isB2WorkerUrl(src: string): boolean {
  if (!src || !src.startsWith('http')) return false
  const publicUrl = process.env.NEXT_PUBLIC_B2_PUBLIC_URL?.replace(/\/$/, '')
  if (publicUrl && src.startsWith(publicUrl)) return true
  if (src.includes('assets.layerary.com')) return true
  return false
}

/**
 * Worker URL에서 버킷 이름 세그먼트 제거. (Worker가 경로만 받는 경우, DB에 예전 형식으로 저장된 URL 호환)
 * 예: https://assets.layerary.com/layerary/thumbnails/... → https://assets.layerary.com/thumbnails/...
 */
function normalizeWorkerUrl(url: string): string {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('assets.layerary.com')) return url
    const parts = u.pathname.split('/').filter(Boolean)
    // /layerary/thumbnails/... → /thumbnails/...
    if (parts.length > 1 && parts[0] === 'layerary') {
      u.pathname = '/' + parts.slice(1).join('/')
      return u.toString()
    }
    return url
  } catch {
    return url
  }
}

/**
 * B2 이미지 URL을 img src에 사용할 URL로 변환.
 * - Worker URL → 버킷 세그먼트 정규화 후 반환 (프록시 불필요)
 * - B2 직접 URL → /api/posts/images 프록시로 변환 (private 버킷 대응)
 */
export function getB2ImageSrc(url: string): string {
  if (!url || url === '/placeholder.png') return '/placeholder.png'
  const publicUrl = process.env.NEXT_PUBLIC_B2_PUBLIC_URL?.replace(/\/$/, '')
  if (publicUrl && url.startsWith(publicUrl)) return normalizeWorkerUrl(url)
  if (url.includes('assets.layerary.com')) return normalizeWorkerUrl(url)
  if (url.startsWith('http') && url.includes('backblazeb2.com')) {
    return `/api/posts/images?url=${encodeURIComponent(url)}`
  }
  return url
}
