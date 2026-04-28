import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getBucketPptThumbnails, getS3Client, isS3StorageConfigured } from '@/lib/s3/config'
import { s3ObjectKeyFromAnyPublicUrl } from '@/lib/s3/url-helpers'

const BUCKET = 'ppt-thumbnails'

/**
 * public URL·스토리지 경로에서 ppt-thumbnails 기준 파일명(키) 추출
 */
export function getPptThumbnailObjectPathFromPublicUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const fromS3 = s3ObjectKeyFromAnyPublicUrl(url, getBucketPptThumbnails())
  if (fromS3) return fromS3
  try {
    const pathParts = new URL(url).pathname.split('/').filter(Boolean)
    const bucketIndex = pathParts.indexOf(BUCKET)
    if (bucketIndex === -1 || bucketIndex >= pathParts.length - 1) return null
    return pathParts.slice(bucketIndex + 1).join('/')
  } catch {
    return null
  }
}

export async function deletePptThumbnailByPublicUrl(
  url: string | null | undefined
): Promise<void> {
  const objectPath = url ? getPptThumbnailObjectPathFromPublicUrl(url) : null
  if (!objectPath) return

  if (!isS3StorageConfigured()) {
    console.warn('S3 미설정: ppt-thumbnails 삭제 생략')
    return
  }
  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getBucketPptThumbnails(),
        Key: objectPath,
      })
    )
  } catch (e) {
    console.error('S3 ppt-thumbnails delete error:', e)
  }
}
