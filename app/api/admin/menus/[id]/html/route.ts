import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError, NotFoundError } from '@/lib/api/errors'
import { invalidateCategoriesCache } from '@/lib/categories'
import { isHtmlMenu, parseHtmlMenuConfig } from '@/lib/menus/schemas'
import { deleteMenuHtmlQuietly, toAdminMenu, uploadMenuHtml } from '@/lib/menus/server'

export const dynamic = 'force-dynamic'

/**
 * HTML 메뉴의 HTML 교체 (multipart `file`). 새 파일 업로드 → DB 갱신 → 기존 파일 삭제.
 * 계획: docs/MENU_ADMIN_구현계획.md §3.4
 */
export const PUT = withRouteHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    await requireAdmin()
    const { id } = await context.params

    const menu = await prisma.category.findUnique({ where: { id } })
    if (!menu || !isHtmlMenu(menu)) {
      throw new NotFoundError('HTML 메뉴를 찾을 수 없습니다.')
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      throw new BadRequestError('HTML 파일을 첨부해주세요.')
    }

    const previous = parseHtmlMenuConfig(menu.config)
    const config = await uploadMenuHtml(file, menu.slug)
    let updated
    try {
      updated = await prisma.category.update({ where: { id }, data: { config } })
    } catch (error) {
      await deleteMenuHtmlQuietly(config.html.url)
      throw error
    }
    invalidateCategoriesCache()

    if (previous) {
      await deleteMenuHtmlQuietly(previous.html.url)
    }
    return NextResponse.json({ menu: toAdminMenu(updated) })
  },
  'HTML 파일을 교체하는 중 오류가 발생했습니다.'
)
