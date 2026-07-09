import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/b2'
import { INSIGHT_HTML_CONTENT_TYPE } from '@/lib/insights-schemas'

export const dynamic = 'force-dynamic'

/**
 * iframe 소스용 HTML 스트리밍 (로그인 사용자 전용).
 * S3에 저장된 자기완결형 HTML을 text/html로 그대로 반환한다.
 * 상세 페이지 iframe은 sandbox 속성으로 격리한다. 계획: docs/INSIGHTS_구현계획.md §5
 */
export const GET = withRouteHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    await requireAuth()

    const post = await prisma.insightPost.findUnique({
      where: { id: params.id },
      select: { htmlUrl: true },
    })
    if (!post) {
      throw new NotFoundError('문서를 찾을 수 없습니다.')
    }

    const { fileBuffer } = await downloadFile(post.htmlUrl)

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': INSIGHT_HTML_CONTENT_TYPE,
        // 로그인 사용자 전용 문서 — 브라우저 캐시만 짧게 허용, 공유 캐시 금지
        'Cache-Control': 'private, max-age=300',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  },
  '문서를 불러오는 중 오류가 발생했습니다.'
)
