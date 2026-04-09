import { createServerSupabaseClient } from '@/lib/supabase'

const BUCKET = 'ppt-thumbnails'

/**
 * 공개 URL에서 ppt-thumbnails 버킷 기준 객체 경로를 추출합니다.
 * 예: .../object/public/ppt-thumbnails/ppt-uuid-123.jpg → ppt-uuid-123.jpg
 */
export function getPptThumbnailObjectPathFromPublicUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  try {
    const pathParts = new URL(url).pathname.split('/').filter(Boolean)
    const bucketIndex = pathParts.indexOf(BUCKET)
    if (bucketIndex === -1 || bucketIndex >= pathParts.length - 1) return null
    return pathParts.slice(bucketIndex + 1).join('/')
  } catch {
    return null
  }
}

/** ppt-thumbnails 버킷에 있는 객체면 삭제합니다. 실패 시 로그만 남깁니다. */
export async function deletePptThumbnailByPublicUrl(url: string | null | undefined): Promise<void> {
  const objectPath = url ? getPptThumbnailObjectPathFromPublicUrl(url) : null
  if (!objectPath) return

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.storage.from(BUCKET).remove([objectPath])
    if (error) {
      console.error('Supabase ppt-thumbnails delete error:', error)
    }
  } catch (e) {
    console.error('Supabase ppt-thumbnails delete failed:', e)
  }
}
