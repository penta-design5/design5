import { S3Client } from '@aws-sdk/client-s3'

let _client: S3Client | null = null

/** MinIO/사내 S3 — env.example.txt 의 S3_* (S3_ENDPOINT, 자격 증명) */
export function isS3StorageConfigured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT?.trim() &&
    process.env.S3_ACCESS_KEY_ID?.trim() &&
    process.env.S3_SECRET_ACCESS_KEY?.trim()
  )
}

export function getS3Client(): S3Client {
  if (!isS3StorageConfigured()) {
    throw new Error('S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY가 설정되지 않았습니다.')
  }
  if (!_client) {
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== 'false'
    _client = new S3Client({
      region: process.env.S3_REGION?.trim() || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT!.trim(),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle,
    })
  }
  return _client
}

export function getS3PublicBaseUrl(): string {
  return process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '') || ''
}

export function getBucketPosts(): string {
  return process.env.S3_BUCKET_POSTS?.trim() || 'posts'
}

export function getBucketEdms(): string {
  return process.env.S3_BUCKET_EDMS?.trim() || 'edms'
}

export function getBucketAvatars(): string {
  return process.env.S3_BUCKET_AVATARS?.trim() || 'avatars'
}

export function getBucketIcons(): string {
  return process.env.S3_BUCKET_ICONS?.trim() || 'icons'
}

export function getBucketPptThumbnails(): string {
  return process.env.S3_BUCKET_PPT_THUMBNAILS?.trim() || 'ppt-thumbnails'
}

/**
 * S3_PUBLIC_BASE_URL 아래: https://public/{key} (key: 버킷 기준 전체, 예: avatars/uid.png)
 * @deprecated MinIO 등 베이스 미설정 시 키만 반환됩니다. 버킷별로 `publicUrlForIconsKey` 등을 쓰세요.
 */
export function publicUrlForS3ObjectKey(key: string): string {
  const k = key.replace(/^\//, '')
  const base = getS3PublicBaseUrl()
  if (base) {
    return `${base}/${k}`
  }
  return k
}

/**
 * 버킷 인식형 공개 URL: `{베이스 또는 엔드포인트}/{버킷}/{키}`.
 * S3_PUBLIC_BASE_URL은 버킷을 포함하지 않는 공개 호스트(예: https://design5.pentasecurity.com)로 두면
 * 모든 버킷(posts/edms/avatars/...)이 path-style로 올바르게 매핑된다.
 */
function publicUrlForBucketKey(bucket: string, key: string): string {
  const k = key.replace(/^\//, '')
  const base = getS3PublicBaseUrl()
  const prefix = base || process.env.S3_ENDPOINT?.replace(/\/$/, '') || ''
  return prefix ? `${prefix}/${bucket}/${k}` : k
}

/** icons 버킷 — 베이스 없으면 path-style `엔드포인트/icons/키` */
export function publicUrlForIconsKey(key: string): string {
  return publicUrlForBucketKey(getBucketIcons(), key)
}

/** avatars 버킷 — 베이스 없으면 `엔드포인트/avatars/키` */
export function publicUrlForAvatarsKey(key: string): string {
  return publicUrlForBucketKey(getBucketAvatars(), key)
}

/** ppt-thumbnails 버킷 */
export function publicUrlForPptThumbnailsKey(key: string): string {
  return publicUrlForBucketKey(getBucketPptThumbnails(), key)
}

/**
 * posts 버킷 객체의 브라우저용 URL — `{베이스/엔드포인트}/posts/{키}`
 */
export function publicUrlForPostsKey(key: string): string {
  return publicUrlForBucketKey(getBucketPosts(), key)
}

/**
 * eDM 객체 공개 URL — `{베이스/엔드포인트}/edms/{키}`
 */
export function publicUrlForEdmsKey(key: string): string {
  return publicUrlForBucketKey(getBucketEdms(), key)
}
