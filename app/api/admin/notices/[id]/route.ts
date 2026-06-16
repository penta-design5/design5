import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError } from '@/lib/api/errors'

const attachmentSchema = z.object({
  url: z.string(),
  name: z.string(),
})

const updateNoticeSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').optional(),
  content: z.string().min(1, '내용을 입력해주세요.').optional(),
  isImportant: z.boolean().optional(),
  attachments: z.array(attachmentSchema).optional().nullable(),
})

export const PATCH = withRouteHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  await requireAdmin()
  const { id } = params
  const body = await request.json()

  const validatedData = updateNoticeSchema.parse(body)

  const notice = await prisma.notice.findUnique({
    where: { id },
  })

  if (!notice) {
    throw new NotFoundError('공지사항을 찾을 수 없습니다.')
  }

  // Prisma Json 필드에 null을 설정하려면 Prisma.JsonNull 사용
  const updateData: any = { ...validatedData }
  if (updateData.attachments === null) {
    updateData.attachments = Prisma.JsonNull
  }

  const updatedNotice = await prisma.notice.update({
    where: { id },
    data: updateData,
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

  return NextResponse.json({ notice: updatedNotice })
}, '공지사항을 수정하는 중 오류가 발생했습니다.')

export const DELETE = withRouteHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  await requireAdmin()
  const { id } = params

  const notice = await prisma.notice.findUnique({
    where: { id },
  })

  if (!notice) {
    throw new NotFoundError('공지사항을 찾을 수 없습니다.')
  }

  await prisma.notice.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}, '공지사항을 삭제하는 중 오류가 발생했습니다.')
