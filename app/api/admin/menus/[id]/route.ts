import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError, NotFoundError } from '@/lib/api/errors'
import { invalidateCategoriesCache } from '@/lib/categories'
import { isHtmlMenu, isMenuSectionType, parseHtmlMenuConfig, updateMenuSchema } from '@/lib/menus/schemas'
import { deleteMenuHtmlQuietly, toAdminMenu } from '@/lib/menus/server'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

/** 메뉴 관리 대상(다섯 섹션의 최상위 메뉴)만 조회 */
async function findManagedMenu(id: string) {
  const menu = await prisma.category.findUnique({ where: { id } })
  if (!menu || menu.parentId !== null || !isMenuSectionType(menu.type)) {
    throw new NotFoundError('메뉴를 찾을 수 없습니다.')
  }
  return menu
}

/**
 * 메뉴 수정 — 이름·숨김(전체), 섹션 이동(HTML 메뉴만). 계획: docs/MENU_ADMIN_구현계획.md §3.2
 */
export const PATCH = withRouteHandler(async (request: Request, context: Context) => {
  await requireAdmin()
  const { id } = await context.params
  const input = updateMenuSchema.parse(await request.json())
  const menu = await findManagedMenu(id)

  const movesSection = input.type !== undefined && input.type !== menu.type
  if (movesSection && !isHtmlMenu(menu)) {
    throw new BadRequestError('기존 메뉴는 다른 섹션으로 옮길 수 없습니다.')
  }

  let order: number | undefined
  if (movesSection) {
    // 옮긴 섹션의 맨 아래에 붙인다
    const last = await prisma.category.aggregate({
      where: { type: input.type, parentId: null },
      _max: { order: true },
    })
    order = (last._max.order ?? 0) + 1
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.isHidden !== undefined && { isHidden: input.isHidden }),
      ...(movesSection && { type: input.type, order }),
    },
  })
  invalidateCategoriesCache()
  return NextResponse.json({ menu: toAdminMenu(updated) })
}, '메뉴를 수정하는 중 오류가 발생했습니다.')

/** HTML 메뉴 삭제 (DB 행 + Storage 파일). 기존 메뉴는 숨김만 허용 */
export const DELETE = withRouteHandler(async (_request: Request, context: Context) => {
  await requireAdmin()
  const { id } = await context.params
  const menu = await findManagedMenu(id)

  if (!isHtmlMenu(menu)) {
    throw new BadRequestError('기존 메뉴는 삭제할 수 없습니다. 숨김을 사용해주세요.')
  }

  await prisma.category.delete({ where: { id } })
  invalidateCategoriesCache()

  const config = parseHtmlMenuConfig(menu.config)
  if (config) {
    await deleteMenuHtmlQuietly(config.html.url)
  }
  return NextResponse.json({ success: true })
}, '메뉴를 삭제하는 중 오류가 발생했습니다.')
