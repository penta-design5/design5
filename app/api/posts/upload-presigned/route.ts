import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { getPresignedUploadUrl, generateSafeFileName } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export const POST = withRouteHandler(async (request: Request) => {
  await requireAdmin()

  const body = await request.json()
  const { files, categorySlug } = body // [{ name: string, type: string, size: number }]

  if (!files || files.length === 0) {
    throw new BadRequestError('파일 정보가 필요합니다.')
  }

  if (!categorySlug) {
    throw new BadRequestError('카테고리 정보가 필요합니다.')
  }

  const presignedUrls = await Promise.all(
    files.map(async (file: { name: string; type: string }) => {
      const safeFileName = generateSafeFileName(file.name)
      const filePath = `posts/${categorySlug}/${safeFileName}`
      const {
        uploadUrl,
        authorizationToken,
        fileName,
        fileUrl,
        uploadMode,
      } = await getPresignedUploadUrl(filePath, file.type)

      return {
        originalName: file.name,
        fileName: fileName,
        uploadUrl: uploadUrl,
        authorizationToken: authorizationToken,
        fileUrl: fileUrl,
        uploadMode,
      }
    })
  )

  return NextResponse.json({
    success: true,
    presignedUrls,
  })
}, 'Presigned URL 생성 중 오류가 발생했습니다.')
