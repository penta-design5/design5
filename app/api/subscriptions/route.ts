import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { getMenuSubscriptionEnabled } from '@/lib/app-settings'
import { isSubscribableCategory } from '@/lib/categories'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError, ForbiddenError, NotFoundError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  categoryId: z.string().min(1, '카테고리 ID가 필요합니다.'),
})

/** GET: 현재 사용자가 구독 중인 카테고리 ID 목록 */
export const GET = withRouteHandler(async () => {
  const user = await requireAuth()
  const rows = await prisma.menuSubscription.findMany({
    where: { userId: user.id },
    select: { categoryId: true },
  })
  return NextResponse.json({ categoryIds: rows.map((r) => r.categoryId) })
}, '구독 정보를 불러올 수 없습니다.')

/** POST { categoryId }: 구독 생성 (중복 무시) */
export const POST = withRouteHandler(async (request: Request) => {
  const user = await requireAuth()

  if (!(await getMenuSubscriptionEnabled())) {
    throw new ForbiddenError('메뉴 구독 기능이 비활성화되어 있습니다.')
  }

  const { categoryId } = bodySchema.parse(await request.json())

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { type: true, slug: true },
  })
  if (!category) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.')
  }
  if (!isSubscribableCategory(category)) {
    throw new BadRequestError('구독할 수 없는 메뉴입니다.')
  }

  await prisma.menuSubscription.upsert({
    where: { userId_categoryId: { userId: user.id, categoryId } },
    create: { userId: user.id, categoryId },
    update: {},
  })

  return NextResponse.json({ subscribed: true })
}, '구독 처리 중 오류가 발생했습니다.')

/** DELETE { categoryId }: 구독 취소 */
export const DELETE = withRouteHandler(async (request: Request) => {
  const user = await requireAuth()
  const { categoryId } = bodySchema.parse(await request.json())

  await prisma.menuSubscription.deleteMany({
    where: { userId: user.id, categoryId },
  })

  return NextResponse.json({ subscribed: false })
}, '구독 취소 중 오류가 발생했습니다.')
