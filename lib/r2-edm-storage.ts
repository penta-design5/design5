import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  getBucketEdms,
  getS3Client,
  getS3PublicBaseUrl,
  isS3StorageConfigured,
} from '@/lib/s3/config'

if (!isS3StorageConfigured() && process.env.NODE_ENV === 'development') {
  console.warn('eDM 스토리지: S3_* (MinIO)가 설정되지 않았습니다.')
}

function requireClient() {
  if (!isS3StorageConfigured()) {
    throw new Error('eDM 스토리지: S3_* (S3_ENDPOINT, 자격, S3_BUCKET_EDMS=edms 등)을 설정하세요.')
  }
  return getS3Client()
}

function getEdmPublicBase(): string {
  return getS3PublicBaseUrl()
}

/** Presigned URL 기본 만료 시간 (Sig V4 최대 7일) */
export const PRESIGNED_EXPIRES_IN = 604800

export interface UploadResult {
  filePath: string
  fileUrl?: string
}

/**
 * eDM 이미지 업로드 (S3/MinIO edms 버킷)
 */
export async function uploadEdmFile(
  buffer: Buffer,
  filePath: string,
  contentType: string
): Promise<UploadResult> {
  const client = requireClient()
  const b = getBucketEdms()
  await client.send(
    new PutObjectCommand({
      Bucket: b,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    })
  )
  const result: UploadResult = { filePath }
  const pub = getEdmPublicBase()
  if (pub) {
    result.fileUrl = `${pub.replace(/\/$/, '')}/${filePath.replace(/^\//, '')}`
  }
  return result
}

export async function getPresignedUrl(
  objectKey: string,
  expiresInSeconds: number = PRESIGNED_EXPIRES_IN
): Promise<string> {
  const client = requireClient()
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: getBucketEdms(),
      Key: objectKey,
    }),
    { expiresIn: expiresInSeconds }
  )
}

export function isObjectKey(value: string | null): boolean {
  if (!value || typeof value !== 'string') return false
  return !value.startsWith('http://') && !value.startsWith('https://')
}

export async function deleteEdmFileByKey(objectKey: string): Promise<void> {
  if (!objectKey?.trim()) return
  const client = requireClient()
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: getBucketEdms(),
        Key: objectKey,
      })
    )
  } catch (error) {
    console.warn('eDM 스토리지 파일 삭제 실패:', objectKey, error)
  }
}

function extractKeyFromPublicUrl(url: string): string | null {
  const base = getEdmPublicBase()
  if (!base || !url.startsWith(base)) return null
  const key = url.slice(base.length).replace(/^\//, '')
  return key || null
}

export async function deleteEdmFileByUrl(url: string): Promise<void> {
  if (!url?.trim()) return
  if (isObjectKey(url)) {
    await deleteEdmFileByKey(url)
    return
  }
  const key = extractKeyFromPublicUrl(url)
  if (key) await deleteEdmFileByKey(key)
}
