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

    // 파일 크기 검증 (각 파일 10MB)
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestError(`파일 크기는 10MB를 초과할 수 없습니다: ${file.name}`)
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

