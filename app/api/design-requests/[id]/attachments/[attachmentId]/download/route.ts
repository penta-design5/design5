import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { downloadFile } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

/**
 * 디자인 의뢰 첨부 다운로드 (서버 프록시).
 * - requireAuth: 로그인 사용자만. (미들웨어가 /api/* 를 자동 보호하지 않으므로 필수)
 * - Content-Disposition: attachment → html 등도 브라우저에서 실행되지 않고 저장됨.
 */
export const GET = withRouteHandler(
  async (
    _request: Request,
    { params }: { params: { id: string; attachmentId: string } }
  ) => {
    await requireAuth()

    const attachment = await prisma.designRequestAttachment.findUnique({
      where: { id: params.attachmentId },
    })

    if (!attachment || attachment.requestId !== params.id) {
      throw new NotFoundError('첨부파일을 찾을 수 없습니다.')
    }

    const { fileBuffer, contentType } = await downloadFile(attachment.fileUrl)

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType || contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
          attachment.fileName
        )}`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  },
  '첨부파일 다운로드 중 오류가 발생했습니다.'
)
