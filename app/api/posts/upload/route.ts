import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { uploadImageWithThumbnail, uploadFile, generateSafeFileName } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'

export const POST = withRouteHandler(async (request: Request) => {
  await requireAdmin()

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const categorySlug = formData.get('categorySlug') as string

    if (!files || files.length === 0) {
      throw new BadRequestError('파일이 필요합니다.')
    }

    if (!categorySlug) {
      throw new BadRequestError('카테고리 정보가 필요합니다.')
    }

    // 파일 형식·크기 검증: 이미지(10MB) 또는 mp4 동영상(100MB)만 허용
    const IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10MB
    const VIDEO_MAX_BYTES = 100 * 1024 * 1024 // 100MB (사내망: 동영상 크기 완화)
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isMp4 = file.type === 'video/mp4'
      if (!isImage && !isMp4) {
        throw new BadRequestError(
          `지원하지 않는 파일 형식입니다: ${file.name} (이미지 또는 mp4 동영상만 업로드할 수 있습니다.)`
        )
      }
      const maxBytes = isMp4 ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES
      if (file.size > maxBytes) {
        const limitMb = isMp4 ? 100 : 10
        throw new BadRequestError(`파일 크기는 ${limitMb}MB를 초과할 수 없습니다: ${file.name}`)
      }
    }

    const uploadedImages = []

    // 모든 파일 업로드
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // 파일을 ArrayBuffer로 변환
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // 안전한 파일명 생성
      const safeFileName = generateSafeFileName(file.name)
      const filePath = `posts/${categorySlug}/${safeFileName}`

      // 이미지 파일인 경우 썸네일 생성, 아닌 경우 원본만 업로드
      const isImage = file.type.startsWith('image/')
      
      if (isImage) {
        // 이미지 파일: 썸네일과 Blur 데이터 URL 생성
        const { fileUrl, thumbnailUrl, blurDataURL } = await uploadImageWithThumbnail(
          buffer,
          filePath,
          file.type,
          400 // 썸네일 크기
        )

        uploadedImages.push({
          url: fileUrl,
          thumbnailUrl: thumbnailUrl,
          blurDataURL: blurDataURL,
          name: file.name,
          order: i,
        })
      } else {
        // 이미지가 아닌 파일: 원본만 업로드
        const uploadResult = await uploadFile(buffer, filePath, file.type)

        uploadedImages.push({
          url: uploadResult.fileUrl,
          name: file.name,
          order: i,
        })
      }
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    })
}, '파일 업로드 중 오류가 발생했습니다.')

