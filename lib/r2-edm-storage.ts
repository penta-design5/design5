import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME
/** 공개 액세스용 기준 URL (예: https://cdn.layerary.com). 설정 시 업로드 결과에 fileUrl 포함, DB에 공개 URL 저장 */
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || ''

if (
  (!accountId || !accessKeyId || !secretAccessKey || !bucketName) &&
  process.env.NODE_ENV === 'development'
) {
  console.warn(
    'R2 eDM 스토리지: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME를 확인해주세요.'
  )
}

function getClient(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      'R2 eDM 스토리지 설정이 없습니다. R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME를 설정해주세요.'
    )
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  })
}

/** Presigned URL 기본 만료 시간 (레거리 키 조회용, Sig V4 최대 7일) */
export const PRESIGNED_EXPIRES_IN = 604800

export interface UploadResult {
  filePath: string
  /** R2_PUBLIC_URL 설정 시 공개 URL (만료 없음). 미설정 시 undefined */
  fileUrl?: string
}

/**
 * eDM 이미지를 R2에 업로드
 * R2_PUBLIC_URL 설정 시 fileUrl(공개 URL) 반환 → DB에 저장 시 7일 제한 없음
 */
export async function uploadEdmFile(
  buffer: Buffer,
  filePath: string,
  contentType: string
): Promise<UploadResult> {
  const client = getClient()
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    })
  )
  const result: UploadResult = { filePath }
  if (publicUrl) {
    result.fileUrl = `${publicUrl}/${filePath}`
  }
  return result
}

/**
 * 객체 키를 Presigned URL로 변환 (레거리 DB 키용, 최대 7일)
 */
export async function getPresignedUrl(
  objectKey: string,
  expiresInSeconds: number = PRESIGNED_EXPIRES_IN
): Promise<string> {
  const client = getClient()
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

/**
 * DB에 저장된 값이 객체 키인지 여부 (http(s)로 시작하면 레거리 URL)
 */
export function isObjectKey(value: string | null): boolean {
  if (!value || typeof value !== 'string') return false
  return !value.startsWith('http://') && !value.startsWith('https://')
}

/**
 * R2에서 객체 키로 파일 삭제
 */
export async function deleteEdmFileByKey(objectKey: string): Promise<void> {
  if (!objectKey?.trim()) return
  const client = getClient()
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    )
  } catch (error) {
    console.warn('R2 eDM 파일 삭제 실패:', objectKey, error)
  }
}

/**
 * 공개 URL에서 객체 키 추출 (R2_PUBLIC_URL 기준)
 */
function extractKeyFromPublicUrl(url: string): string | null {
  if (!publicUrl || !url.startsWith(publicUrl)) return null
  const key = url.slice(publicUrl.length).replace(/^\//, '')
  return key || null
}

/**
 * 공개 URL 또는 레거리 객체 키로 R2 파일 삭제
 */
export async function deleteEdmFileByUrl(url: string): Promise<void> {
  if (!url?.trim()) return
  if (isObjectKey(url)) {
    await deleteEdmFileByKey(url)
    return
  }
  const key = extractKeyFromPublicUrl(url)
  if (key) await deleteEdmFileByKey(key)
}
