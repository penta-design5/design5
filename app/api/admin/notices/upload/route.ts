import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { uploadFile, generateSafeFileName } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'

export const POST = withRouteHandler(async (request: Request) => {
  await requireAdmin()

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    throw new BadRequestError('파일이 필요합니다.')
  }

  // 파일 크기 검증 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new BadRequestError('파일 크기는 10MB를 초과할 수 없습니다.')
  }

  // 파일을 ArrayBuffer로 변환
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 안전한 파일명 생성
  const safeFileName = generateSafeFileName(file.name)
  const filePath = `notices/${safeFileName}`

  // Backblaze B2에 업로드
  const uploadResult = await uploadFile(
    buffer,
    filePath,
    file.type
  )

  return NextResponse.json({
    success: true,
    fileUrl: uploadResult.fileUrl,
    fileName: file.name,
    filePath: filePath,
  })
}, '파일 업로드 중 오류가 발생했습니다.')
