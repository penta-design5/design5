import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/b2'
import { HTML_DOCUMENT_CONTENT_TYPE } from '@/lib/html-document'
import { isHtmlMenu, parseHtmlMenuConfig } from '@/lib/menus/schemas'

export const dynamic = 'force-dynamic'

/** iframe sandbox와 같은 권한 — 주소로 직접 열어도 사이트 출처(쿠키·API)와 격리된다 */
const SANDBOX_POLICY = 'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads'

/**
 * HTML 메뉴의 iframe 소스 (로그인 사용자 전용, 숨김 메뉴는 관리자만).
 * Storage의 자기완결형 HTML을 그대로 반환한다. 계획: docs/MENU_ADMIN_구현계획.md §3.4
 */
export const GET = withRouteHandler(
  async (_request: Request, context: { params: Promise<{ slug: string }> }) => {
    const user = await requireAuth()
    const { slug } = await context.params

    const menu = await prisma.category.findUnique({
      where: { slug },
      select: { pageType: true, isHidden: true, config: true },
    })
    const config = menu && isHtmlMenu(menu) ? parseHtmlMenuConfig(menu.config) : null
    if (!menu || !config || (menu.isHidden && user.role !== UserRole.ADMIN)) {
      throw new NotFoundError('페이지를 찾을 수 없습니다.')
    }

    const { fileBuffer } = await downloadFile(config.html.url)

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': HTML_DOCUMENT_CONTENT_TYPE,
        // iframe 주소에 ?v=<updatedAt>가 붙어 HTML 교체 시 새 주소가 된다. 공유 캐시 금지
        'Cache-Control': 'private, max-age=300',
        'Content-Security-Policy': SANDBOX_POLICY,
        'X-Content-Type-Options': 'nosniff',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  },
  '페이지를 불러오는 중 오류가 발생했습니다.'
)
