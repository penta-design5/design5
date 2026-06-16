import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getBucketAvatars, getS3Client } from '@/lib/s3/config'
import { s3ObjectKeyFromAnyPublicUrl } from '@/lib/s3/url-helpers'
import { requireS3Json } from '@/lib/s3/require-storage'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError, NotFoundError, BadRequestError } from '@/lib/api/errors'

const deleteAccountSchema = z.object({
  password: z.string().optional(),
})

export const DELETE = withRouteHandler(async (request: Request) => {
  const bad = requireS3Json()
  if (bad) return bad

  const session = await auth()

  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const body = await request.json()
  const validatedData = deleteAccountSchema.parse(body)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, avatar: true },
  })

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.')
  }

  if (user.password) {
    if (!validatedData.password) {
      throw new BadRequestError('비밀번호를 입력해주세요.')
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    )

    if (!isPasswordValid) {
      throw new BadRequestError('비밀번호가 올바르지 않습니다.')
    }
  }

  if (user.avatar) {
    try {
      const key =
        s3ObjectKeyFromAnyPublicUrl(user.avatar, getBucketAvatars()) ||
        (() => {
          const name = user.avatar.split('/').pop()
          return name ? `avatars/${name}` : null
        })()
      if (key) {
        await getS3Client().send(
          new DeleteObjectCommand({ Bucket: getBucketAvatars(), Key: key })
        )
      }
    } catch (error) {
      console.error('Error deleting avatar:', error)
    }
  }

  await prisma.user.delete({
    where: { id: session.user.id },
  })

  return NextResponse.json({
    success: true,
    message: '계정이 삭제되었습니다.',
  })
}, '계정 삭제 중 오류가 발생했습니다.')
