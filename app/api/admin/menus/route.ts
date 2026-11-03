import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'
import { invalidateCategoriesCache } from '@/lib/categories'
import { HTML_MENU_PAGE_TYPE, MENU_SECTION_TYPES, createHtmlMenuSchema } from '@/lib/menus/schemas'
import { deleteMenuHtmlQuietly, formText, toAdminMenu, uploadMenuHtml } from '@/lib/menus/server'

export const dynamic = 'force-dynamic'

/**
 * 메뉴 관리 — 목록 조회 / HTML 메뉴 생성 (관리자 전용).
 * 계획: docs/MENU_ADMIN_구현계획.md §3.7
 */
export const GET = withRouteHandler(async () => {
  await requireAdmin()

  const categories = await prisma.category.findMany({
    where: { parentId: null, type: { in: [...MENU_SECTION_TYPES] } },
    orderBy: [{ type: 'asc' }, { order: 'asc' }],
  })

  return NextResponse.json({ menus: categories.map(toAdminMenu) })
}, '메뉴 목록을 가져오는 중 오류가 발생했습니다.')

export const POST = withRouteHandler(async (request: Request) => {
  await requireAdmin()

  const form = await request.formData()
  const input = createHtmlMenuSchema.parse({
    name: formText(form, 'name'),
    slug: formText(form, 'slug'),
    type: formText(form, 'type'),
  })
  const file = form.get('file')
  if (!(file instanceof File)) {
    throw new BadRequestError('HTML 파일을 첨부해주세요.')
  }

  const existing = await prisma.category.findUnique({ where: { slug: input.slug }, select: { id: true } })
  if (existing) {
    throw new BadRequestError('이미 사용 중인 주소(slug)입니다.')
  }

  const config = await uploadMenuHtml(file, input.slug)
  try {
    const last = await prisma.category.aggregate({
      where: { type: input.type, parentId: null },
      _max: { order: true },
    })
    const menu = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        type: input.type,
        pageType: HTML_MENU_PAGE_TYPE,
        order: (last._max.order ?? 0) + 1,
        config,
      },
    })
    invalidateCategoriesCache()
    return NextResponse.json({ menu: toAdminMenu(menu) }, { status: 201 })
  } catch (error) {
    await deleteMenuHtmlQuietly(config.html.url)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestError('이미 사용 중인 주소(slug)입니다.')
    }
    throw error
  }
}, '메뉴를 추가하는 중 오류가 발생했습니다.')
