import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { uploadFile, generateSafeFileName, deleteFileByUrl } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError, BadRequestError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

// ZIP 파일 정보 조회
export const GET = withRouteHandler(
  async (_request: Request, { params }: { params: { slug: string } }) => {
    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
      select: { config: true },
    })

    if (!category) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.')
    }

    const config = category.config as any
    const zipInfo = config?.zipFileUrl
      ? {
          url: config.zipFileUrl,
          fileName: config.zipFileName || 'download.zip',
          fileSize: config.zipFileSize || 0,
        }
      : null

    return NextResponse.json({ zipInfo })
  },
  'ZIP 파일 정보를 가져오는 중 오류가 발생했습니다.'
)

// ZIP 파일 업로드 (관리자만)
export const POST = withRouteHandler(
  async (request: Request, { params }: { params: { slug: string } }) => {
    await requireAdmin()

    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
    })

    if (!category) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.')
    }

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

    // 기존 ZIP 파일이 있으면 삭제 (선택사항)
    const currentConfig = category.config as any
    if (currentConfig?.zipFileUrl) {
      // 기존 파일 삭제는 나중에 구현 가능
    }

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 안전한 파일명 생성
    const safeFileName = generateSafeFileName(file.name)
    const filePath = `categories/${params.slug}/zip/${Date.now()}-${safeFileName}`

    // Backblaze B2에 업로드
    const uploadResult = await uploadFile(buffer, filePath, file.type)

    // 카테고리 config 업데이트
    const updatedConfig = {
      ...(currentConfig || {}),
      zipFileUrl: uploadResult.fileUrl,
      zipFileName: file.name,
      zipFileSize: file.size,
    }

    await prisma.category.update({
      where: { id: category.id },
      data: { config: updatedConfig },
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
  },
  'ZIP 파일 업로드 중 오류가 발생했습니다.'
)

// ZIP 파일 삭제 (관리자만)
export const DELETE = withRouteHandler(
  async (_request: Request, { params }: { params: { slug: string } }) => {
    await requireAdmin()

    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
    })

    if (!category) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.')
    }

    const config = category.config as any
    if (!config?.zipFileUrl) {
      throw new BadRequestError('삭제할 ZIP 파일이 없습니다.')
    }

    // Backblaze B2에서 파일 삭제
    try {
      await deleteFileByUrl(config.zipFileUrl)
    } catch (error: any) {
      // B2 삭제 실패해도 데이터베이스는 업데이트 (파일이 이미 없을 수 있음)
      console.warn('B2 파일 삭제 실패 (무시됨):', error.message)
    }

    // config에서 ZIP 정보 제거
    const updatedConfig = { ...config }
    delete updatedConfig.zipFileUrl
    delete updatedConfig.zipFileName
    delete updatedConfig.zipFileSize

    await prisma.category.update({
      where: { id: category.id },
      data: { config: updatedConfig },
    })

    return NextResponse.json({
      success: true,
      message: 'ZIP 파일이 삭제되었습니다.',
    })
  },
  'ZIP 파일 삭제 중 오류가 발생했습니다.'
)
