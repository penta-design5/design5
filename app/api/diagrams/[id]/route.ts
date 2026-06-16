import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, deleteFileByUrl } from '@/lib/b2'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/api/errors'

// GET /api/diagrams/[id] - 단일 다이어그램 조회
export const GET = withRouteHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await auth()
  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  const diagram = await prisma.diagram.findUnique({
    where: {
      id: params.id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!diagram) {
    throw new NotFoundError('다이어그램을 찾을 수 없습니다.')
  }

  // 작성자만 조회 가능
  if (diagram.authorId !== session.user.id) {
    throw new ForbiddenError('접근 권한이 없습니다.')
  }

  return NextResponse.json({ diagram })
}, '다이어그램을 불러오는데 실패했습니다.')

// PATCH /api/diagrams/[id] - 다이어그램 수정
export const PATCH = withRouteHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await auth()
  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  // 기존 다이어그램 조회
  const existingDiagram = await prisma.diagram.findUnique({
    where: { id: params.id },
  })

  if (!existingDiagram) {
    throw new NotFoundError('다이어그램을 찾을 수 없습니다.')
  }

  // 작성자만 수정 가능
  if (existingDiagram.authorId !== session.user.id) {
    throw new ForbiddenError('수정 권한이 없습니다.')
  }

  const body = await request.json()
  const { title, description, canvasData, width, height, thumbnailDataUrl } = body

  let thumbnailUrl = existingDiagram.thumbnailUrl

  // 새 썸네일이 제공된 경우
  if (thumbnailDataUrl) {
    try {
      // 기존 썸네일 삭제
      if (existingDiagram.thumbnailUrl) {
        try {
          await deleteFileByUrl(existingDiagram.thumbnailUrl)
        } catch (deleteError) {
          console.warn('Failed to delete old thumbnail:', deleteError)
        }
      }

      // 새 썸네일 업로드
      const base64Data = thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const timestamp = Date.now()
      const fileName = `diagrams/thumbnails/diagram_${timestamp}.png`

      const uploadResult = await uploadFile(buffer, fileName, 'image/png')
      thumbnailUrl = uploadResult.fileUrl
    } catch (uploadError) {
      console.error('Thumbnail upload error:', uploadError)
    }
  }

  // 다이어그램 업데이트
  const diagram = await prisma.diagram.update({
    where: { id: params.id },
    data: {
      title: title !== undefined ? title : existingDiagram.title,
      description: description !== undefined ? description : existingDiagram.description,
      canvasData: canvasData !== undefined ? canvasData : existingDiagram.canvasData,
      width: width !== undefined ? width : existingDiagram.width,
      height: height !== undefined ? height : existingDiagram.height,
      thumbnailUrl,
    },
  })

  return NextResponse.json({ diagram })
}, '다이어그램 수정에 실패했습니다.')

// DELETE /api/diagrams/[id] - 다이어그램 삭제
export const DELETE = withRouteHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await auth()
  if (!session?.user?.id) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  // 기존 다이어그램 조회
  const existingDiagram = await prisma.diagram.findUnique({
    where: { id: params.id },
  })

  if (!existingDiagram) {
    throw new NotFoundError('다이어그램을 찾을 수 없습니다.')
  }

  // 작성자만 삭제 가능
  if (existingDiagram.authorId !== session.user.id) {
    throw new ForbiddenError('삭제 권한이 없습니다.')
  }

  // B2에서 썸네일 삭제
  if (existingDiagram.thumbnailUrl) {
    try {
      await deleteFileByUrl(existingDiagram.thumbnailUrl)
    } catch (deleteError) {
      console.warn('Failed to delete thumbnail from B2:', deleteError)
    }
  }

  // DB에서 다이어그램 삭제
  await prisma.diagram.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}, '다이어그램 삭제에 실패했습니다.')
