/**
 * 클라이언트: **구성된 S3( MinIO) 공개 베이스**·선택적 레거시 호스트( env )에 해당하는 URL
 */

import { getLegacyCdnHostnames, urlStartsWithAnyPublicBase } from '@/lib/legacy-asset-bases'

function tryHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function isKnownPublicAssetBaseUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false
  if (urlStartsWithAnyPublicBase(url)) return true
  const h = tryHost(url)
  if (!h) return false
  return getLegacyCdnHostnames().some((d) => h === d)
}
