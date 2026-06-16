import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError, NotFoundError } from '@/lib/api/errors'

export const PATCH = withRouteHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  // 관리자 권한 확인
  await requireAdmin()

  const { id } = params
  const body = await request.json()
  const { role } = body

  // 역할 유효성 검사
  if (!role || !Object.values(UserRole).includes(role)) {
    throw new BadRequestError('유효하지 않은 역할입니다.')
  }

  // 사용자 존재 확인
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.')
  }

  // 역할 업데이트
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  return NextResponse.json({ user: updatedUser })
}, '사용자 역할을 업데이트하는 중 오류가 발생했습니다.')
