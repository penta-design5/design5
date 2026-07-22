import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getPresignedUploadUrl, generateSafeFileName } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'
import {
  DESIGN_REQUEST_ATTACHMENT_MAX_COUNT,
  isAllowedAttachmentExtension,
  isAllowedAttachmentSize,
  DESIGN_REQUEST_ALLOWED_EXTENSIONS_LABEL,
} from '@/lib/design-request-attachments'

export const dynamic = 'force-dynamic'

interface RequestedFile {
  name: string
  type: string
  size: number
}

/**
 * 디자인 의뢰 첨부용 presigned 업로드 URL 발급.
 * - 로그인 사용자면 누구나(작성 권한) — 관리자 전용 posts 엔드포인트와 별개.
 * - 확장자/용량/개수 규칙을 서버에서 재검증한 뒤 posts 버킷 design-requests/ prefix로 서명.
 */
export const POST = withRouteHandler(async (request: Request) => {
  await requireAuth()

  const body = await request.json()
  const files = body?.files as RequestedFile[] | undefined

  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestError('파일 정보가 필요합니다.')
  }

  if (files.length > DESIGN_REQUEST_ATTACHMENT_MAX_COUNT) {
    throw new BadRequestError(
      `첨부는 최대 ${DESIGN_REQUEST_ATTACHMENT_MAX_COUNT}개까지 가능합니다.`
    )
  }

  for (const file of files) {
    if (!file?.name) {
      throw new BadRequestError('파일 이름이 필요합니다.')
    }
    if (!isAllowedAttachmentExtension(file.name)) {
      throw new BadRequestError(
        `허용되지 않는 형식입니다: ${file.name} (허용: ${DESIGN_REQUEST_ALLOWED_EXTENSIONS_LABEL})`
      )
    }
    if (!isAllowedAttachmentSize(file.size)) {
      throw new BadRequestError(`파일이 25MB를 초과합니다: ${file.name}`)
    }
  }

  const presignedUrls = await Promise.all(
    files.map(async (file) => {
      const safeFileName = generateSafeFileName(file.name)
      const key = `design-requests/${safeFileName}`
      const { uploadUrl, authorizationToken, fileName, fileUrl, uploadMode } =
        await getPresignedUploadUrl(key, file.type || 'application/octet-stream')

      return {
        originalName: file.name,
        fileName,
        uploadUrl,
        authorizationToken,
        fileUrl,
        uploadMode,
      }
    })
  )

  return NextResponse.json({ success: true, presignedUrls })
}, 'Presigned URL 생성 중 오류가 발생했습니다.')
