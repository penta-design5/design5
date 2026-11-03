import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'
import { invalidateCategoriesCache } from '@/lib/categories'
import { reorderMenusSchema } from '@/lib/menus/schemas'

export const dynamic = 'force-dynamic'

/**
 * 섹션 안 메뉴 순서 변경 — `ids`(섹션의 메뉴 전체, 새 순서) 순으로 order 1..n 재부여.
 * 계획: docs/MENU_ADMIN_구현계획.md §3.7
 */
export const PUT = withRouteHandler(async (request: Request) => {
  await requireAdmin()
  const { type, ids } = reorderMenusSchema.parse(await request.json())

  const current = await prisma.category.findMany({
    where: { type, parentId: null },
    select: { id: true },
  })
  const currentIds = new Set(current.map((c) => c.id))
  if (ids.length !== currentIds.size || new Set(ids).size !== ids.length || !ids.every((id) => currentIds.has(id))) {
    throw new BadRequestError('메뉴 목록이 변경되었습니다. 새로고침 후 다시 시도해주세요.')
  }

  await prisma.$transaction(
    ids.map((id, index) => prisma.category.update({ where: { id }, data: { order: index + 1 } }))
  )
  invalidateCategoriesCache()
  return NextResponse.json({ success: true })
}, '메뉴 순서를 변경하는 중 오류가 발생했습니다.')
