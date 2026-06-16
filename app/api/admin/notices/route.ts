import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { withRouteHandler } from '@/lib/api/with-route-handler'

const attachmentSchema = z.object({
  url: z.string(),
  name: z.string(),
})

const createNoticeSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
  isImportant: z.boolean().default(false),
  attachments: z.array(attachmentSchema).optional().nullable(),
})

export const dynamic = 'auto'
export const revalidate = 30 // 30초 캐시 (실시간 반영 중요)

export const GET = withRouteHandler(async () => {
  await requireAdmin()

  const notices = await prisma.notice.findMany({
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json({ notices }, {
    headers: {
      'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
    },
  })
}, '공지사항 목록을 가져오는 중 오류가 발생했습니다.')

export const POST = withRouteHandler(async (request: Request) => {
  const admin = await requireAdmin()
  const body = await request.json()

  const validatedData = createNoticeSchema.parse(body)

  const notice = await prisma.notice.create({
    data: {
      title: validatedData.title,
      content: validatedData.content,
      isImportant: validatedData.isImportant,
      attachments: validatedData.attachments ?? Prisma.JsonNull,
      authorId: admin.id,
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

  return NextResponse.json({ notice }, { status: 201 })
}, '공지사항을 생성하는 중 오류가 발생했습니다.')
