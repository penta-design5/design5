import { NextRequest, NextResponse } from 'next/server'
import { IconPlusType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError, NotFoundError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

function getNumberValue(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

/** PATCH /api/icon-plus/[id] — MAIN 아이콘 anchorX/anchorY 수정. 관리자 전용 */
export const PATCH = withRouteHandler(async (request: NextRequest, { params }: RouteParams) => {
  await requireAdmin()
  const { id } = await params

  const payload = (await request.json().catch(() => ({}))) as {
    anchorX?: unknown
    anchorY?: unknown
  }
  const anchorX = getNumberValue(payload.anchorX)
  const anchorY = getNumberValue(payload.anchorY)

  if (anchorX === null || anchorY === null || anchorX < 0 || anchorY < 0) {
    throw new BadRequestError('anchorX와 anchorY는 0 이상의 숫자여야 합니다.')
  }

  // MAIN 타입만 anchor 수정 대상
  const result = await prisma.iconPlusResource.updateMany({
    where: { id, type: IconPlusType.MAIN },
    data: { anchorX, anchorY },
  })

  if (result.count === 0) {
    throw new NotFoundError('메인 아이콘을 찾을 수 없습니다.')
  }

  return NextResponse.json({ ok: true })
}, 'anchor 좌표를 수정하는 중 오류가 발생했습니다.')
