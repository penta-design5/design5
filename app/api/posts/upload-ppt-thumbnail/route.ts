import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requireAdmin } from '@/lib/auth-helpers'
import {
  getBucketPptThumbnails,
  getS3Client,
  publicUrlForPptThumbnailsKey,
} from '@/lib/s3/config'
import { requireS3Json } from '@/lib/s3/require-storage'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'

export const POST = withRouteHandler(async (request: Request) => {
  const bad = requireS3Json()
  if (bad) return bad

  await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const postId = formData.get('postId') as string

    if (!file) {
      throw new BadRequestError('파일이 필요합니다.')
    }

    if (!postId) {
      throw new BadRequestError('게시물 ID가 필요합니다.')
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestError('파일 크기는 5MB를 초과할 수 없습니다.')
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      throw new BadRequestError('PNG 또는 JPG 형식만 지원됩니다.')
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `ppt-${postId}-${Date.now()}.${fileExt}`
    const filePath = fileName

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await getS3Client().send(
      new PutObjectCommand({
        Bucket: getBucketPptThumbnails(),
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
      })
    )
    const thumbnailUrl = publicUrlForPptThumbnailsKey(filePath)

    return NextResponse.json({
      success: true,
      thumbnailUrl,
      message: '썸네일 이미지가 업로드되었습니다.',
    })
}, '썸네일 업로드 중 오류가 발생했습니다.')
