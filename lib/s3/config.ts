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
 * posts 버킷 객체의 브라우저용 URL (S3_PUBLIC_BASE_URL/엔드포인트+버킷)
 */
export function publicUrlForPostsKey(key: string): string {
  const base = getS3PublicBaseUrl()
  if (base) {
    return `${base}/${key.replace(/^\//, '')}`
  }
  const ep = process.env.S3_ENDPOINT?.replace(/\/$/, '') || ''
  const b = getBucketPosts()
  return ep ? `${ep}/${b}/${key.replace(/^\//, '')}` : key
}

/**
 * eDM 객체 공개 URL — S3_PUBLIC_BASE_URL(게이트웨이) + 키 (버킷 prefix는 public 베이스 정책에 따름)
 */
export function publicUrlForEdmsKey(key: string): string {
  const k = key.replace(/^\//, '')
  const base = getS3PublicBaseUrl()
  if (base) {
    return `${base}/${k}`
  }
  const ep = process.env.S3_ENDPOINT?.replace(/\/$/, '') || ''
  const b = getBucketEdms()
  return ep ? `${ep}/${b}/${k}` : k
}
