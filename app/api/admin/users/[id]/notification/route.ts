import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError, NotFoundError } from '@/lib/api/errors'

// 디자인 의뢰 등록 알림 메일 수신 여부 토글(관리자 대상) — 회원 관리 화면에서 호출
export const PATCH = withRouteHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  // 관리자 권한 확인
  await requireAdmin()

  const { id } = params
  const body = await request.json()
  const { receiveDesignRequestMail } = body

  // 값 유효성 검사
  if (typeof receiveDesignRequestMail !== 'boolean') {
    throw new BadRequestError('유효하지 않은 값입니다.')
  }

  // 사용자 존재 확인
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.')
  }

  // 수신 여부 업데이트
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { receiveDesignRequestMail },
    select: {
      id: true,
      email: true,
      name: true,
      receiveDesignRequestMail: true,
    },
  })

  return NextResponse.json({ user: updatedUser })
}, '알림 수신 설정을 업데이트하는 중 오류가 발생했습니다.')
