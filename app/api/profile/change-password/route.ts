import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError, NotFoundError, BadRequestError } from '@/lib/api/errors'

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(5, '비밀번호는 최소 5자 이상이어야 합니다')
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[.!@#])/, '영문, 숫자, 특수문자(.!@#)를 포함해야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
})

export const PATCH = withRouteHandler(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const body = await request.json()
  const validatedData = changePasswordSchema.parse(body)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.')
  }

  // 기존 비밀번호가 있는 경우 (이메일/비밀번호로 가입한 사용자)
  if (user.password) {
    if (!validatedData.currentPassword) {
      throw new BadRequestError('현재 비밀번호를 입력해주세요.')
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    )

    if (!isPasswordValid) {
      throw new BadRequestError('현재 비밀번호가 올바르지 않습니다.')
    }
  }
  // Google 계정 사용자는 currentPassword 없이 비밀번호 설정 가능

  const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      password: hashedPassword,
    },
  })

  return NextResponse.json({
    success: true,
    message: '비밀번호가 변경되었습니다.',
  })
}, '비밀번호 변경 중 오류가 발생했습니다.')
