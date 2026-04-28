import { isS3StorageConfigured, getS3PublicBaseUrl } from '@/lib/s3/config'

/**
 * Supabase public URL, S3 public URL, MinIO path-style URL 에서
 * (bucket, key) 쌍으로 객체를 지울 수 있게 키를 복원합니다.
 */
export function s3ObjectKeyFromAnyPublicUrl(
  url: string,
  bucket: string
): string | null {
  if (!url) return null
  const base = getS3PublicBaseUrl()
  if (base && url.startsWith(base)) {
    return url.slice(base.length).replace(/^\//, '')
  }
  try {
    const u = new URL(url)
    // Supabase: .../storage/v1/object/public/{bucket}/...
    const parts = u.pathname.split('/').filter(Boolean)
    const publicIdx = parts.indexOf('public')
    if (publicIdx !== -1 && parts[publicIdx + 1] === bucket) {
      return parts.slice(publicIdx + 2).join('/')
    }
    if (isS3StorageConfigured() && process.env.S3_ENDPOINT) {
      const host = new URL(process.env.S3_ENDPOINT).host
      if (u.host === host) {
        const p = u.pathname.split('/').filter(Boolean)
        if (p[0] === bucket) {
          return p.slice(1).join('/')
        }
      }
    }
  } catch {
    return null
  }
  return null
}
