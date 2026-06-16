import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { uploadFile, generateSafeFileName, deleteFileByUrl } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

// ZIP 파일 정보 조회
export const GET = withRouteHandler(async () => {
  const config = await prisma.diagramZipConfig.findUnique({
    where: { key: 'default' },
  })

  const zipInfo =
    config?.zipFileUrl && config.zipFileName
      ? {
          url: config.zipFileUrl,
          fileName: config.zipFileName,
          fileSize: config.zipFileSize || 0,
        }
      : null

  return NextResponse.json({ zipInfo })
}, 'ZIP 파일 정보를 가져오는 중 오류가 발생했습니다.')

// ZIP 파일 업로드 (관리자만)
export const POST = withRouteHandler(async (request: Request) => {
  await requireAdmin()

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    throw new BadRequestError('파일이 필요합니다.')
  }

  // ZIP 파일만 허용
  const isZipFile =
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    file.name.toLowerCase().endsWith('.zip')

  if (!isZipFile) {
    throw new BadRequestError('ZIP 파일만 업로드할 수 있습니다.')
  }

  // 파일 크기 검증 (100MB)
  if (file.size > 100 * 1024 * 1024) {
    throw new BadRequestError('파일 크기는 100MB를 초과할 수 없습니다.')
  }

  // 파일을 ArrayBuffer로 변환
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 안전한 파일명 생성
  const safeFileName = generateSafeFileName(file.name)
  const filePath = `diagrams/zip/${Date.now()}-${safeFileName}`

  // Backblaze B2에 업로드
  const uploadResult = await uploadFile(buffer, filePath, file.type)

  // 기존 ZIP 파일이 있으면 B2에서 삭제
  const existingConfig = await prisma.diagramZipConfig.findUnique({
    where: { key: 'default' },
  })
  if (existingConfig?.zipFileUrl) {
    try {
      await deleteFileByUrl(existingConfig.zipFileUrl)
    } catch (error: any) {
      console.warn('B2 기존 파일 삭제 실패 (무시됨):', error.message)
    }
  }

  // DB 업데이트 (upsert)
  await prisma.diagramZipConfig.upsert({
    where: { key: 'default' },
    create: {
      key: 'default',
      zipFileUrl: uploadResult.fileUrl,
      zipFileName: file.name,
      zipFileSize: file.size,
    },
    update: {
      zipFileUrl: uploadResult.fileUrl,
      zipFileName: file.name,
      zipFileSize: file.size,
    },
  })

  return NextResponse.json({
    success: true,
    zipInfo: {
      url: uploadResult.fileUrl,
      fileName: file.name,
      fileSize: file.size,
    },
    message: 'ZIP 파일이 업로드되었습니다.',
  })
}, 'ZIP 파일 업로드 중 오류가 발생했습니다.')

// ZIP 파일 삭제 (관리자만)
export const DELETE = withRouteHandler(async () => {
  await requireAdmin()

  const config = await prisma.diagramZipConfig.findUnique({
    where: { key: 'default' },
  })

  if (!config?.zipFileUrl) {
    throw new BadRequestError('삭제할 ZIP 파일이 없습니다.')
  }

  // Backblaze B2에서 파일 삭제
  try {
    await deleteFileByUrl(config.zipFileUrl)
  } catch (error: any) {
    console.warn('B2 파일 삭제 실패 (무시됨):', error.message)
  }

  // DB에서 ZIP 정보 제거
  await prisma.diagramZipConfig.update({
    where: { key: 'default' },
    data: {
      zipFileUrl: null,
      zipFileName: null,
      zipFileSize: null,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'ZIP 파일이 삭제되었습니다.',
  })
}, 'ZIP 파일 삭제 중 오류가 발생했습니다.')
