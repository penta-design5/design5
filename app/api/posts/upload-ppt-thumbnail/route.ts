import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requireAdmin } from '@/lib/auth-helpers'
import {
  getBucketPptThumbnails,
  getS3Client,
  publicUrlForS3ObjectKey,
} from '@/lib/s3/config'
import { requireS3Json } from '@/lib/s3/require-storage'

export async function POST(request: Request) {
  const bad = requireS3Json()
  if (bad) return bad

  try {
    await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const postId = formData.get('postId') as string

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    if (!postId) {
      return NextResponse.json(
        { error: '게시물 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'PNG 또는 JPG 형식만 지원됩니다.' },
        { status: 400 }
      )
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
    const thumbnailUrl = publicUrlForS3ObjectKey(filePath)

    return NextResponse.json({
      success: true,
      thumbnailUrl,
      message: '썸네일 이미지가 업로드되었습니다.',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }
    console.error('PPT thumbnail upload error:', error)
    return NextResponse.json(
      { error: '썸네일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
