import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError, NotFoundError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export const GET = withRouteHandler(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.')
  }

  return NextResponse.json({
    hasPassword: !!user.password,
  })
}, '비밀번호 확인 중 오류가 발생했습니다.')
