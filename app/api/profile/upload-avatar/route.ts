import { NextResponse } from 'next/server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBucketAvatars, getS3Client, publicUrlForS3ObjectKey } from '@/lib/s3/config'
import { s3ObjectKeyFromAnyPublicUrl } from '@/lib/s3/url-helpers'
import { requireS3Json } from '@/lib/s3/require-storage'

export async function POST(request: Request) {
  const bad = requireS3Json()
  if (bad) return bad

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG, PNG 또는 GIF 형식만 지원됩니다.' },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
    const storagePath = `avatars/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const bucket = getBucketAvatars()
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storagePath,
        Body: buffer,
        ContentType: file.type,
      })
    )
    const avatarUrl = publicUrlForS3ObjectKey(storagePath)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    })

    if (user?.avatar) {
      try {
        const key =
          s3ObjectKeyFromAnyPublicUrl(user.avatar, getBucketAvatars()) ||
          (() => {
            const name = user.avatar?.split('/').pop()
            return name ? `avatars/${name}` : null
          })()
        if (key) {
          await getS3Client().send(
            new DeleteObjectCommand({
              Bucket: getBucketAvatars(),
              Key: key,
            })
          )
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error)
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    })

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: '프로필 사진이 업로드되었습니다. 다음 로그인 시 반영됩니다.',
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: '프로필 사진 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
