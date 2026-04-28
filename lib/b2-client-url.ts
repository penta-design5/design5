/**
 * 게시물 이미지 URL → img src (클라이언트).
 * 사내망: S3 퍼블릭 URL은 그대로. 구 B2 S3 API URL(…backblazeb2…)은 /api/posts/images 프록시.
 */

import {
  getPublicStorageBasePrefixes,
  normalizeLayeraryStyleWorkerPath,
  urlHostIsLegacyCdn,
  urlHostNeedsUnoptimizedImage,
  urlLooksLikeBackblazeB2S3Url,
  urlStartsWithAnyPublicBase,
} from '@/lib/legacy-asset-bases'

/** S3/Worker/B2/레거시 CDN — 클라이언트에서 스토리지 URL 판별 */
export function isB2StorageUrlForClient(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  if (urlStartsWithAnyPublicBase(url)) return true
  if (urlHostIsLegacyCdn(url)) return true
  if (urlLooksLikeBackblazeB2S3Url(url)) return true
  return false
}

/**
 * unoptimized(Next Image) — Worker/공개 베이스·구 Worker 호스트(기본 assets.…)
 */
export function isB2WorkerUrl(src: string): boolean {
  if (!src || !src.startsWith('http')) return false
  if (urlStartsWithAnyPublicBase(src)) return true
  if (urlHostNeedsUnoptimizedImage(src)) return true
  return false
}

/**
 * 이미지 URL을 img src에 사용.
 * - 공개 베이스 URL → (구 Worker면 경로 정규화)
 * - B2 직접 URL → /api/posts/images 프록시
 */
export function getB2ImageSrc(url: string): string {
  if (!url || url === '/placeholder.png') return '/placeholder.png'
  const bases = getPublicStorageBasePrefixes()
  for (const b of bases) {
    if (b && url.startsWith(b)) {
      return urlHostIsLegacyCdn(url) ? normalizeLayeraryStyleWorkerPath(url) : url
    }
  }
  if (urlHostIsLegacyCdn(url)) return normalizeLayeraryStyleWorkerPath(url)
  if (url.startsWith('http') && urlLooksLikeBackblazeB2S3Url(url)) {
    return `/api/posts/images?url=${encodeURIComponent(url)}`
  }
  return url
}
