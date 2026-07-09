import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { deleteFileByUrl } from '@/lib/b2'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, '삭제할 항목을 선택해주세요.'),
})

// DELETE: 일괄 삭제 (관리자 전용) — 「최신 동향」 게시판용. DB 삭제 후 S3 객체 정리(best-effort)
export const DELETE = withRouteHandler(async (request: Request) => {
  await requireAdmin()
  const json = await request.json()
  const { ids } = bodySchema.parse(json)

  const targets = await prisma.insightPost.findMany({
    where: { id: { in: ids } },
    select: { htmlUrl: true, thumbnailUrl: true },
  })

  const result = await prisma.insightPost.deleteMany({
    where: { id: { in: ids } },
  })

  for (const t of targets) {
    for (const url of [t.htmlUrl, t.thumbnailUrl]) {
      if (url) {
        try {
          await deleteFileByUrl(url)
        } catch (err) {
          console.error('[insights] 일괄 삭제 객체 정리 실패:', url, err)
        }
      }
    }
  }

  return NextResponse.json({ deleted: result.count })
}, '일괄 삭제 중 오류가 발생했습니다.')
