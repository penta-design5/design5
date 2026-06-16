import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { uploadFile, generateSafeFileName, deleteFileByUrl } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError, BadRequestError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const MAX_VIDEO_SIZE = 150 * 1024 * 1024 // 150MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']

// 가이드 영상 정보 조회
export const GET = withRouteHandler(
  async (_request: Request, { params }: { params: { slug: string } }) => {
    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
      select: { config: true },
    })

    if (!category) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.')
    }

    const config = category.config as Record<string, unknown> | null
    const guideVideo =
      config?.guideVideoUrl &&
      typeof config.guideVideoUrl === 'string'
        ? {
            url: config.guideVideoUrl,
            fileName: (config.guideVideoFileName as string) || 'guide.mp4',
            fileSize: (config.guideVideoFileSize as number) || 0,
          }
        : null

    return NextResponse.json({ guideVideo })
  },
  '가이드 영상 정보를 가져오는 중 오류가 발생했습니다.'
)

// 가이드 영상 업로드 (관리자만)
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

    if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.mp4')) {
      throw new BadRequestError('MP4 또는 WebM 형식만 업로드할 수 있습니다.')
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new BadRequestError(`파일 크기는 ${MAX_VIDEO_SIZE / 1024 / 1024}MB를 초과할 수 없습니다.`)
    }

    const currentConfig = (category.config as Record<string, unknown>) || {}

    // 기존 영상이 있으면 B2에서 삭제
    if (currentConfig.guideVideoUrl && typeof currentConfig.guideVideoUrl === 'string') {
      try {
        await deleteFileByUrl(currentConfig.guideVideoUrl as string)
      } catch (e) {
        console.warn('B2 기존 가이드 영상 삭제 실패:', e)
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const safeFileName = generateSafeFileName(file.name)
    const filePath = `categories/${params.slug}/guide-video/${Date.now()}-${safeFileName}`

    const uploadResult = await uploadFile(buffer, filePath, file.type || 'video/mp4')

    const updatedConfig = {
      ...currentConfig,
      guideVideoUrl: uploadResult.fileUrl,
      guideVideoFileName: file.name,
      guideVideoFileSize: file.size,
    }

    await prisma.category.update({
      where: { id: category.id },
      data: { config: updatedConfig as Prisma.InputJsonValue },
    })

    return NextResponse.json({
      success: true,
      guideVideo: {
        url: uploadResult.fileUrl,
        fileName: file.name,
        fileSize: file.size,
      },
      message: '가이드 영상이 업로드되었습니다.',
    })
  },
  '가이드 영상 업로드 중 오류가 발생했습니다.'
)

// 가이드 영상 삭제 (관리자만)
export const DELETE = withRouteHandler(
  async (_request: Request, { params }: { params: { slug: string } }) => {
    await requireAdmin()

    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
    })

    if (!category) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.')
    }

    const config = (category.config as Record<string, unknown>) || {}
    const guideVideoUrl = config.guideVideoUrl

    if (!guideVideoUrl || typeof guideVideoUrl !== 'string') {
      throw new BadRequestError('삭제할 가이드 영상이 없습니다.')
    }

    try {
      await deleteFileByUrl(guideVideoUrl)
    } catch (e) {
      console.warn('B2 가이드 영상 삭제 실패 (무시됨):', e)
    }

    const updatedConfig = { ...config }
    delete updatedConfig.guideVideoUrl
    delete updatedConfig.guideVideoFileName
    delete updatedConfig.guideVideoFileSize

    await prisma.category.update({
      where: { id: category.id },
      data: { config: updatedConfig as Prisma.InputJsonValue },
    })

    return NextResponse.json({
      success: true,
      message: '가이드 영상이 삭제되었습니다.',
    })
  },
  '가이드 영상 삭제 중 오류가 발생했습니다.'
)
