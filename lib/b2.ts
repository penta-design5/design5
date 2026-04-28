import sharp from 'sharp'
import { urlLooksLikeBackblazeB2S3Url } from '@/lib/legacy-asset-bases'
import { isS3StorageConfigured } from '@/lib/s3/config'
import * as s3post from '@/lib/s3/post-storage'

export interface UploadResult {
  fileId: string
  fileName: string
  fileUrl: string
}

/**
 * 파일을 Backblaze B2에 업로드
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  if (isS3StorageConfigured()) {
    return s3post.s3UploadPostFile(file, fileName, contentType)
  }
  throw new Error(
    'S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY(및 posts 버킷)를 설정하세요. Backblaze B2 SDK 지원은 제거되었습니다.'
  )
}

/**
 * 갤러리 썸네일 JPEG 버퍼: 세로형(세로 > 가로)은 가로를 thumbnailSize로 맞추고 세로는 정비율,
 * 그 외(가로형·정사각)는 thumbnailSize × thumbnailSize 박스 안에 맞춤 (fit: inside).
 */
export async function buildGalleryThumbnailBuffer(
  file: Buffer,
  thumbnailSize: number = 400
): Promise<Buffer> {
  const meta = await sharp(file).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  const isPortrait = h > w && w > 0 && h > 0

  if (isPortrait) {
    return sharp(file)
      .resize({ width: thumbnailSize, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
  }

  return sharp(file)
    .resize(thumbnailSize, thumbnailSize, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer()
}

/**
 * 이미지 파일을 업로드하고 썸네일 생성
 */
export async function uploadImageWithThumbnail(
  file: Buffer,
  fileName: string,
  contentType: string,
  thumbnailSize: number = 400
): Promise<{ fileUrl: string; thumbnailUrl: string; blurDataURL?: string }> {
  // 원본 이미지 업로드
  const originalResult = await uploadFile(file, fileName, contentType)

  // 썸네일 생성 (JPEG로 변환하여 용량 최적화)
  const thumbnail = await buildGalleryThumbnailBuffer(file, thumbnailSize)

  const thumbnailFileName = `thumbnails/${fileName.replace(/\.[^/.]+$/, '.jpg')}`
  const thumbnailResult = await uploadFile(
    thumbnail,
    thumbnailFileName,
    'image/jpeg'
  )

  // Blur 데이터 URL 생성 (20px 크기)
  const blurImage = await sharp(file)
    .resize(20, 20, { fit: 'inside' })
    .blur(10)
    .jpeg({ quality: 50 })
    .toBuffer()
  
  const blurDataURL = `data:image/jpeg;base64,${blurImage.toString('base64')}`

  return {
    fileUrl: originalResult.fileUrl,
    thumbnailUrl: thumbnailResult.fileUrl,
    blurDataURL,
  }
}

/**
 * Blur 데이터 URL 생성 (기존 이미지용)
 */
export async function generateBlurDataURL(
  file: Buffer,
  size: number = 20
): Promise<string> {
  try {
    const blurImage = await sharp(file)
      .resize(size, size, { fit: 'inside' })
      .blur(10)
      .jpeg({ quality: 50 })
      .toBuffer()
    
    return `data:image/jpeg;base64,${blurImage.toString('base64')}`
  } catch (error) {
    console.error('Error generating blur data URL:', error)
    // 실패 시 투명한 1x1 픽셀 반환
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  }
}

/**
 * 파일 삭제 (fileId 사용) — B2 API 제거로 미지원. deleteFileByUrl(키/URL) 사용.
 */
export async function deleteFile(_fileId: string): Promise<void> {
  throw new Error('deleteFile(fileId)는 Backblaze B2 제거로 지원되지 않습니다. deleteFileByUrl을 사용하세요.')
}

/**
 * 파일 URL로 파일 삭제 (S3·posts 버킷). 레거시 B2 URL은 B2 API 제거로 자동 삭제 불가(경고만).
 */
export async function deleteFileByUrl(fileUrl: string): Promise<void> {
  if (isS3StorageConfigured() && s3post.shouldHandlePostsUrlWithS3(fileUrl)) {
    await s3post.s3DeletePostByUrl(fileUrl)
    return
  }
  if (urlLooksLikeBackblazeB2S3Url(fileUrl)) {
    console.warn(
      '[storage] 구 B2 S3 API URL — 객체는 자동 삭제할 수 없습니다. S3( MinIO)로 마이그레이션하세요.',
      fileUrl
    )
    return
  }
  if (isS3StorageConfigured()) {
    await s3post.s3DeletePostByUrl(fileUrl)
    return
  }
  throw new Error(
    'S3가 설정되지 않았습니다. S3_* 환경 변수를 넣은 뒤 deleteFileByUrl을 사용하세요.'
  )
}

/**
 * B2 스토리지 URL 여부 (직접 B2 URL 또는 Worker 공개 URL)
 * API 라우트에서 B2 다운로드/썸네일 생성 여부 판별 시 사용
 */
export function isB2StorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  if (isS3StorageConfigured() && s3post.shouldHandlePostsUrlWithS3(url)) return true
  if (urlLooksLikeBackblazeB2S3Url(url)) return true
  return false
}

/**
 * 파일 다운로드 (S3 posts 또는 공개 http(s) URL fetch)
 */
export async function downloadFile(fileUrl: string): Promise<{ fileBuffer: Buffer; contentType: string }> {
  if (isS3StorageConfigured() && s3post.shouldHandlePostsUrlWithS3(fileUrl)) {
    return s3post.s3DownloadPost(fileUrl)
  }
  const res = await fetch(fileUrl, { redirect: 'follow' })
  if (!res.ok) {
    if (res.status === 404) throw new Error('파일을 찾을 수 없습니다.')
    throw new Error(`다운로드 실패: HTTP ${res.status}`)
  }
  const ab = await res.arrayBuffer()
  return {
    fileBuffer: Buffer.from(ab),
    contentType: res.headers.get('content-type') || 'application/octet-stream',
  }
}

/**
 * Range 헤더로 파일 일부 다운로드 (비디오 스트리밍 등)
 */
export async function downloadFileWithRange(
  fileUrl: string,
  start: number,
  end: number
): Promise<{ fileBuffer: Buffer; contentType: string; contentRange: string; totalLength: number }> {
  if (isS3StorageConfigured() && s3post.shouldHandlePostsUrlWithS3(fileUrl)) {
    return s3post.s3DownloadPostRange(fileUrl, start, end)
  }
  const rangeHeader = `bytes=${start}-${end}`
  const res = await fetch(fileUrl, { headers: { Range: rangeHeader }, redirect: 'follow' })
  if (res.status !== 206 && res.status !== 200) {
    if (res.status === 404) throw new Error('파일을 찾을 수 없습니다.')
    throw new Error(`Range 다운로드 실패: HTTP ${res.status}`)
  }
  const ab = await res.arrayBuffer()
  const fileBuffer = Buffer.from(ab)
  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const contentRange = res.headers.get('content-range') || ''
  const totalLength = contentRange
    ? parseInt(contentRange.split('/')[1] || '', 10) || fileBuffer.length
    : fileBuffer.length
  return { fileBuffer, contentType, contentRange, totalLength }
}

/**
 * 파일 이름에서 안전한 파일명 생성
 */
export function generateSafeFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9가-힣]/g, '_')
    .substring(0, 50)

  return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`
}

/**
 * 클라이언트에서 직접 업로드할 수 있는 Presigned URL 생성
 * 파일 URL도 함께 생성하여 반환
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string
): Promise<{
  uploadUrl: string
  authorizationToken: string
  fileName: string
  fileUrl: string
  uploadMode?: 'b2' | 's3'
}> {
  if (isS3StorageConfigured()) {
    return s3post.s3GetPresignedPostUpload(fileName, contentType)
  }
  throw new Error('Presigned 업로드는 S3(S3_*)가 설정된 경우에만 사용할 수 있습니다. Backblaze B2 SDK는 제거되었습니다.')
}

