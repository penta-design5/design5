import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError, BadRequestError } from '@/lib/api/errors'

// GET /api/diagrams - 다이어그램 목록 조회
export const GET = withRouteHandler(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  // 현재 사용자의 다이어그램만 조회
  const [diagrams, total] = await Promise.all([
    prisma.diagram.findMany({
      where: {
        authorId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.diagram.count({
      where: {
        authorId: session.user.id,
      },
    }),
  ])

  return NextResponse.json({
    diagrams,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + diagrams.length < total,
    },
  })
}, '다이어그램 목록을 불러오는데 실패했습니다.')

// POST /api/diagrams - 새 다이어그램 생성
export const POST = withRouteHandler(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const body = await request.json()
  const { title, description, canvasData, width, height, thumbnailDataUrl } = body

  if (!title || !canvasData) {
    throw new BadRequestError('제목과 캔버스 데이터는 필수입니다.')
  }

  let thumbnailUrl: string | null = null

  // 썸네일이 제공된 경우 B2에 업로드
  if (thumbnailDataUrl) {
    try {
      // Data URL에서 Buffer 추출
      const base64Data = thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // 파일명 생성
      const timestamp = Date.now()
      const fileName = `diagrams/thumbnails/diagram_${timestamp}.png`

      // B2에 업로드
      const uploadResult = await uploadFile(buffer, fileName, 'image/png')
      thumbnailUrl = uploadResult.fileUrl
    } catch (uploadError) {
      console.error('Thumbnail upload error:', uploadError)
      // 썸네일 업로드 실패 시 경고만 하고 계속 진행
    }
  }

  // 다이어그램 생성
  const diagram = await prisma.diagram.create({
    data: {
      title,
      description: description || null,
      thumbnailUrl,
      canvasData,
      width: width || 1920,
      height: height || 1080,
      authorId: session.user.id,
    },
  })

  return NextResponse.json({ diagram }, { status: 201 })
}, '다이어그램 생성에 실패했습니다.')
