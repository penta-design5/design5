import { NextResponse } from 'next/server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBucketAvatars, getS3Client, publicUrlForAvatarsKey } from '@/lib/s3/config'
import { s3ObjectKeyFromAnyPublicUrl } from '@/lib/s3/url-helpers'
import { requireS3Json } from '@/lib/s3/require-storage'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError, BadRequestError } from '@/lib/api/errors'

export const POST = withRouteHandler(async (request: Request) => {
  const bad = requireS3Json()
  if (bad) return bad

  const session = await auth()

  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    throw new BadRequestError('파일이 필요합니다.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new BadRequestError('파일 크기는 5MB를 초과할 수 없습니다.')
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new BadRequestError('JPG, PNG 또는 GIF 형식만 지원됩니다.')
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
  const avatarUrl = publicUrlForAvatarsKey(storagePath)

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
}, '프로필 사진 업로드 중 오류가 발생했습니다.')
