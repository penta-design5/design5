import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { uploadFile, downloadFile, buildGalleryThumbnailBuffer } from '@/lib/b2'
import sharp from 'sharp'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export const POST = withRouteHandler(async (request: Request) => {
  await requireAdmin()

    const body = await request.json()
    const { fileUrl, fileName } = body

    if (!fileUrl || !fileName) {
      throw new BadRequestError('파일 URL과 파일명이 필요합니다.')
    }

    // 원본 이미지 다운로드
    const { fileBuffer, contentType } = await downloadFile(fileUrl)

    const thumbnail = await buildGalleryThumbnailBuffer(fileBuffer, 400)

    const thumbnailFileName = `thumbnails/${fileName.replace(/\.[^/.]+$/, '.jpg')}`
    
    // 썸네일 업로드
    const thumbnailResult = await uploadFile(
      thumbnail,
      thumbnailFileName,
      'image/jpeg'
    )

    // Blur 데이터 URL 생성 (20px 크기)
    const blurImage = await sharp(fileBuffer)
      .resize(20, 20, { fit: 'inside' })
      .blur(10)
      .jpeg({ quality: 50 })
      .toBuffer()
    
    const blurDataURL = `data:image/jpeg;base64,${blurImage.toString('base64')}`

    return NextResponse.json({
      success: true,
      thumbnailUrl: thumbnailResult.fileUrl,
      blurDataURL,
    })
}, '썸네일 생성 중 오류가 발생했습니다.')

