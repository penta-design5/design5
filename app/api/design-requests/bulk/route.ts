import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, '삭제할 항목을 선택해주세요.'),
})

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    const json = await request.json()
    const { ids } = bodySchema.parse(json)

    const result = await prisma.designRequest.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Unauthorized' || msg === 'Forbidden') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
        { status: 400 }
      )
    }
    console.error('DELETE /api/design-requests/bulk', error)
    return NextResponse.json(
      { error: '일괄 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
