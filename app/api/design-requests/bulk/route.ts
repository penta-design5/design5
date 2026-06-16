import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'
import { withRouteHandler } from '@/lib/api/with-route-handler'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, '삭제할 항목을 선택해주세요.'),
})

export const DELETE = withRouteHandler(async (request: Request) => {
  await requireAdmin()
  const json = await request.json()
  const { ids } = bodySchema.parse(json)

  const result = await prisma.designRequest.deleteMany({
    where: { id: { in: ids } },
  })

  return NextResponse.json({ deleted: result.count })
}, '일괄 삭제 중 오류가 발생했습니다.')
