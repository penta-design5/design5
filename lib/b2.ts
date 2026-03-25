import B2 from 'backblaze-b2'
import sharp from 'sharp'

// 환경 변수 확인
const applicationKeyId = process.env.B2_APPLICATION_KEY_ID
const applicationKey = process.env.B2_APPLICATION_KEY

if ((!applicationKeyId || !applicationKey) && process.env.NODE_ENV === 'development') {
  console.error('B2 인증 정보가 설정되지 않았습니다. B2_APPLICATION_KEY_ID와 B2_APPLICATION_KEY를 확인해주세요.')
}

const b2 = new B2({
  applicationKeyId: applicationKeyId || '',
  applicationKey: applicationKey || '',
})

let authData: any = null

async function authorize() {
  if (!applicationKeyId || !applicationKey) {
    throw new Error('B2 인증 정보가 설정되지 않았습니다. B2_APPLICATION_KEY_ID와 B2_APPLICATION_KEY를 확인해주세요.')
  }

  try {
    if (!authData) {
      authData = await b2.authorize()
    }
    return authData
  } catch (error: any) {
    console.error('B2 인증 실패:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw new Error(`B2 인증 실패: ${error.response?.data?.message || error.message || '알 수 없는 오류'}. B2 인증 정보를 확인해주세요.`)
  }
}

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
  try {
    await authorize()

    const bucketId = process.env.B2_BUCKET_ID!
    const bucketName = process.env.B2_BUCKET_NAME!

    if (!bucketId || !bucketName) {
      throw new Error('B2_BUCKET_ID 또는 B2_BUCKET_NAME이 설정되지 않았습니다.')
    }

    // 파일 업로드 URL 가져오기
    const uploadUrl = await b2.getUploadUrl({
      bucketId,
    })

    if (!uploadUrl.data.uploadUrl || !uploadUrl.data.authorizationToken) {
      throw new Error('B2 업로드 URL을 가져오는데 실패했습니다.')
    }

    // 파일 업로드
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName: fileName,
      data: file,
      mime: contentType,
    })

    if (!uploadResponse.data.fileId) {
      throw new Error('파일 업로드에 실패했습니다.')
    }

    // 공개 URL 생성: B2_PUBLIC_URL(Worker 등)이 있으면 경로만 사용(버킷 이름 제외). Worker가 단일 버킷으로 경로만 받는 경우 대응.
    const publicBase = process.env.B2_PUBLIC_URL?.replace(/\/$/, '')
    let fileUrl: string
    if (publicBase) {
      fileUrl = `${publicBase}/${fileName}`
    } else {
      let endpoint = process.env.B2_ENDPOINT
      if (!endpoint) {
        const uploadUrlStr = uploadUrl.data.uploadUrl
        const match = uploadUrlStr.match(/https:\/\/([^\/]+)/)
        if (match) {
          endpoint = `https://${match[1]}`
        } else {
          const fileIdMatch = uploadUrlStr.match(/f(\d+)/)
          if (fileIdMatch) {
            endpoint = `https://f${fileIdMatch[1]}.backblazeb2.com`
          } else {
            throw new Error('B2 엔드포인트를 결정할 수 없습니다. B2_ENDPOINT를 설정해주세요.')
          }
        }
      }
      endpoint = endpoint.replace(/\/$/, '')
      if (endpoint.includes('s3.') || endpoint.includes('s3-')) {
        fileUrl = `${endpoint}/${bucketName}/${fileName}`
      } else {
        fileUrl = `${endpoint}/file/${bucketName}/${fileName}`
      }
    }

    return {
      fileId: uploadResponse.data.fileId,
      fileName: uploadResponse.data.fileName,
      fileUrl,
    }
  } catch (error: any) {
    console.error('B2 upload error:', error)
    throw new Error(`B2 파일 업로드 실패: ${error.message || '알 수 없는 오류'}`)
  }
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
 * 파일 삭제 (fileId 사용)
 */
export async function deleteFile(fileId: string): Promise<void> {
  await authorize()

  await b2.deleteFileVersion({
    fileId,
    fileName: '', // B2 API 요구사항
  })
}

/**
 * 파일 URL로 파일 삭제
 */
export async function deleteFileByUrl(fileUrl: string): Promise<void> {
  await authorize()

  const bucketName = process.env.B2_BUCKET_NAME!
  if (!bucketName) {
    throw new Error('B2_BUCKET_NAME이 설정되지 않았습니다.')
  }

  // B2 파일 URL에서 파일 경로 추출 (B2 네이티브, S3 호환, Worker URL 형식 지원)
  let filePath = ''
  if (fileUrl.includes('/file/')) {
    // B2 네이티브 URL 형식
    const match = fileUrl.match(/\/file\/[^\/]+\/(.+)$/)
    if (match) {
      filePath = match[1]
    }
  } else {
    const urlObj = new URL(fileUrl)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    if (pathParts.length >= 1 && pathParts[0] === bucketName) {
      filePath = pathParts.slice(1).join('/')
    } else if (pathParts.length >= 1) {
      filePath = pathParts.join('/')
    }
  }

  if (!filePath) {
    throw new Error('파일 경로를 추출할 수 없습니다.')
  }

  // 파일명으로 파일 버전 목록 조회하여 fileId 찾기
  const fileVersions = await b2.listFileVersions({
    bucketId: process.env.B2_BUCKET_ID!,
    startFileName: filePath,
    maxFileCount: 100, // 충분한 수의 파일 버전 조회
  })

  // 정확히 일치하는 파일 찾기 (가장 최신 버전)
  const file = fileVersions.data.files?.find((f: any) => f.fileName === filePath)
  
  if (!file) {
    console.warn(`File not found in B2: ${filePath}`)
    return // 파일이 없으면 무시하고 계속 진행
  }

  // fileId로 파일 삭제
  await b2.deleteFileVersion({
    fileId: file.fileId,
    fileName: file.fileName,
  })
}

/** B2 네이티브, S3 호환, Worker URL 형식에서 B2 객체 키(파일 경로) 추출 */
function getFilePathFromB2Url(fileUrl: string): string {
  let filePath = ''
  if (fileUrl.includes('/file/')) {
    const match = fileUrl.match(/\/file\/[^\/]+\/(.+)$/)
    if (match) filePath = match[1]
  } else {
    const urlObj = new URL(fileUrl)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    const bucketName = process.env.B2_BUCKET_NAME
    // URL에 버킷 이름이 첫 세그먼트로 있으면 제외하고 나머지가 키. 없으면 전체 경로가 키(Worker 단일 버킷 형식).
    if (pathParts.length >= 1 && bucketName && pathParts[0] === bucketName) {
      filePath = pathParts.slice(1).join('/')
    } else if (pathParts.length >= 1) {
      filePath = pathParts.join('/')
    }
  }
  return filePath
}

/**
 * B2 스토리지 URL 여부 (직접 B2 URL 또는 Worker 공개 URL)
 * API 라우트에서 B2 다운로드/썸네일 생성 여부 판별 시 사용
 */
export function isB2StorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  if (url.includes('backblazeb2.com')) return true
  const publicUrl = process.env.B2_PUBLIC_URL?.replace(/\/$/, '')
  if (publicUrl && url.startsWith(publicUrl)) return true
  return false
}

/**
 * 파일 다운로드
 */
export async function downloadFile(fileUrl: string): Promise<{ fileBuffer: Buffer; contentType: string }> {
  await authorize()
  const bucketName = process.env.B2_BUCKET_NAME!
  if (!bucketName) throw new Error('B2_BUCKET_NAME이 설정되지 않았습니다.')

  const filePath = getFilePathFromB2Url(fileUrl)
  if (!filePath) throw new Error('파일 경로를 추출할 수 없습니다.')

  try {
    const response = await b2.downloadFileByName({
      bucketName,
      fileName: filePath,
      responseType: 'arraybuffer',
    })
    const fileBuffer = Buffer.from(response.data)
    const contentType = response.headers['content-type'] || 'application/octet-stream'
    return { fileBuffer, contentType }
  } catch (error: any) {
    console.error('B2 download error:', error)
    if (error.response?.status === 404) throw new Error('파일을 찾을 수 없습니다.')
    throw new Error(`B2 파일 다운로드 실패: ${error.message || '알 수 없는 오류'}`)
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
  await authorize()
  const bucketName = process.env.B2_BUCKET_NAME!
  if (!bucketName) throw new Error('B2_BUCKET_NAME이 설정되지 않았습니다.')

  const filePath = getFilePathFromB2Url(fileUrl)
  if (!filePath) throw new Error('파일 경로를 추출할 수 없습니다.')

  try {
    const rangeHeader = `bytes=${start}-${end}`
    const response = await b2.downloadFileByName({
      bucketName,
      fileName: filePath,
      responseType: 'arraybuffer',
      axiosOverride: { headers: { Range: rangeHeader } },
    })
    const fileBuffer = Buffer.from(response.data)
    const headers = response.headers || {}
    const contentType = headers['content-type'] || headers['Content-Type'] || 'application/octet-stream'
    const contentRange = headers['content-range'] || headers['Content-Range'] || ''
    const totalLength = contentRange ? parseInt(contentRange.split('/')[1], 10) || fileBuffer.length : fileBuffer.length
    return { fileBuffer, contentType, contentRange, totalLength }
  } catch (error: any) {
    console.error('B2 download range error:', error)
    if (error.response?.status === 404) throw new Error('파일을 찾을 수 없습니다.')
    throw new Error(`B2 파일 다운로드 실패: ${error.message || '알 수 없는 오류'}`)
  }
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
}> {
  await authorize()

  const bucketId = process.env.B2_BUCKET_ID!
  const bucketName = process.env.B2_BUCKET_NAME!
  
  if (!bucketId || !bucketName) {
    throw new Error('B2_BUCKET_ID 또는 B2_BUCKET_NAME이 설정되지 않았습니다.')
  }

  // 업로드 URL 가져오기
  const uploadUrl = await b2.getUploadUrl({
    bucketId,
  })

  if (!uploadUrl.data.uploadUrl || !uploadUrl.data.authorizationToken) {
    throw new Error('B2 업로드 URL을 가져오는데 실패했습니다.')
  }

  // 파일 URL 생성: B2_PUBLIC_URL이 있으면 경로만(버킷 이름 제외)
  const publicBase = process.env.B2_PUBLIC_URL?.replace(/\/$/, '')
  let fileUrl: string
  if (publicBase) {
    fileUrl = `${publicBase}/${fileName}`
  } else {
    let endpoint = process.env.B2_ENDPOINT
    if (!endpoint) {
      const uploadUrlStr = uploadUrl.data.uploadUrl
      const match = uploadUrlStr.match(/https:\/\/([^\/]+)/)
      if (match) endpoint = `https://${match[1]}`
      else throw new Error('B2 엔드포인트를 결정할 수 없습니다. B2_ENDPOINT를 설정해주세요.')
    }
    endpoint = endpoint.replace(/\/$/, '')
    if (endpoint.includes('s3.') || endpoint.includes('s3-')) {
      fileUrl = `${endpoint}/${bucketName}/${fileName}`
    } else {
      fileUrl = `${endpoint}/file/${bucketName}/${fileName}`
    }
  }

  return {
    uploadUrl: uploadUrl.data.uploadUrl,
    authorizationToken: uploadUrl.data.authorizationToken,
    fileName: fileName,
    fileUrl: fileUrl,
  }
}

