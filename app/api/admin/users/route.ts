import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { withRouteHandler } from '@/lib/api/with-route-handler'

export const dynamic = 'force-dynamic'
export const revalidate = 30 // 30초 캐시 (실시간 반영 중요)

export const GET = withRouteHandler(async () => {
  // 관리자 권한 확인
  await requireAdmin()

  // 모든 사용자 조회
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          posts: true,
          notices: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json({ users }, {
    headers: {
      'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
    },
  })
}, '사용자 목록을 가져오는 중 오류가 발생했습니다.')
