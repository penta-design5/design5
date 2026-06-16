import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError } from '@/lib/api/errors'

const updateProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
})

export const PATCH = withRouteHandler(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const body = await request.json()
  const validatedData = updateProfileSchema.parse(body)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: validatedData.name,
    },
  })

  return NextResponse.json({
    success: true,
    message: '프로필이 업데이트되었습니다.',
  })
}, '프로필 업데이트 중 오류가 발생했습니다.')
