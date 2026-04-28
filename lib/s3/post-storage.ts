import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { streamToBuffer } from '@/lib/s3/stream-utils'
import {
  getBucketPosts,
  getS3Client,
  getS3PublicBaseUrl,
  isS3StorageConfigured,
  publicUrlForPostsKey,
} from '@/lib/s3/config'

const PRESIGNED_UPLOAD_EXPIRES = 3600

export function isPostsS3Url(url: string): boolean {
  if (!isS3StorageConfigured() || !url) return false
  const base = getS3PublicBaseUrl()
  if (base && url.startsWith(base)) return true
  try {
    const u = new URL(url)
    const ep = process.env.S3_ENDPOINT
    if (ep) {
      const h = new URL(ep).host
      if (u.host === h) return true
    }
  } catch {
    return false
  }
  return false
}

/** 삭제/다운로드 시 S3 어댑터 사용 여부 (공개 URL 또는 MinIO 엔드포인트 호스트) */
export function shouldHandlePostsUrlWithS3(fileUrl: string): boolean {
  if (!isS3StorageConfigured() || !fileUrl) return false
  if (isPostsS3Url(fileUrl)) return true
  try {
    const ep = process.env.S3_ENDPOINT
    if (!ep) return false
    return new URL(fileUrl).host === new URL(ep).host
  } catch {
    return false
  }
}

/** posts 버킷 객체 키 (path-style: /{bucket}/... 또는 public 베이스+경로) */
export function getPostObjectKeyFromUrl(fileUrl: string): string {
  const bucket = getBucketPosts()
  const base = getS3PublicBaseUrl()
  if (base && fileUrl.startsWith(base)) {
    return fileUrl.slice(base.length).replace(/^\//, '')
  }
  try {
    const u = new URL(fileUrl)
    const pathParts = u.pathname.split('/').filter(Boolean)
    if (pathParts[0] === bucket) {
      return pathParts.slice(1).join('/')
    }
    return pathParts.join('/')
  } catch {
    return ''
  }
}

export async function s3UploadPostFile(
  file: Buffer,
  key: string,
  contentType: string
): Promise<{ fileId: string; fileName: string; fileUrl: string }> {
  const client = getS3Client()
  const bucket = getBucketPosts()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  )
  return {
    fileId: key,
    fileName: key,
    fileUrl: publicUrlForPostsKey(key),
  }
}

export async function s3DeletePostByKey(key: string): Promise<void> {
  if (!key?.trim()) return
  const client = getS3Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucketPosts(),
      Key: key,
    })
  )
}

export async function s3DeletePostByUrl(fileUrl: string): Promise<void> {
  const key = getPostObjectKeyFromUrl(fileUrl)
  if (key) await s3DeletePostByKey(key)
}

export async function s3DownloadPost(keyOrUrl: string): Promise<{
  fileBuffer: Buffer
  contentType: string
}> {
  const key = keyOrUrl.startsWith('http') ? getPostObjectKeyFromUrl(keyOrUrl) : keyOrUrl
  if (!key) throw new Error('S3: 객체 키를 찾을 수 없습니다.')
  const client = getS3Client()
  const res = await client.send(
    new GetObjectCommand({
      Bucket: getBucketPosts(),
      Key: key,
    })
  )
  const body = res.Body
  if (!body) throw new Error('S3: 빈 응답')
  const fileBuffer = await streamToBuffer(body)
  const contentType = res.ContentType || 'application/octet-stream'
  return { fileBuffer, contentType }
}

export async function s3DownloadPostRange(
  fileUrl: string,
  start: number,
  end: number
): Promise<{
  fileBuffer: Buffer
  contentType: string
  contentRange: string
  totalLength: number
}> {
  const key = getPostObjectKeyFromUrl(fileUrl)
  if (!key) throw new Error('S3: 객체 키를 찾을 수 없습니다.')
  const client = getS3Client()
  const head = await client.send(
    new HeadObjectCommand({ Bucket: getBucketPosts(), Key: key })
  )
  const totalLength = head.ContentLength ?? 0
  const res = await client.send(
    new GetObjectCommand({
      Bucket: getBucketPosts(),
      Key: key,
      Range: `bytes=${start}-${end}`,
    })
  )
  const body = res.Body
  if (!body) throw new Error('S3: 빈 응답')
  const fileBuffer = await streamToBuffer(body)
  const contentType = res.ContentType || 'application/octet-stream'
  const cr = res.ContentRange || ''
  return { fileBuffer, contentType, contentRange: cr, totalLength: totalLength as number }
}

export type PresignedPostUploadS3 = {
  uploadUrl: string
  authorizationToken: ''
  fileName: string
  fileUrl: string
  uploadMode: 's3'
}

export async function s3GetPresignedPostUpload(
  fileName: string,
  contentType: string
): Promise<PresignedPostUploadS3> {
  const client = getS3Client()
  const bucket = getBucketPosts()
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGNED_UPLOAD_EXPIRES })
  return {
    uploadUrl,
    authorizationToken: '',
    fileName,
    fileUrl: publicUrlForPostsKey(fileName),
    uploadMode: 's3',
  }
}
