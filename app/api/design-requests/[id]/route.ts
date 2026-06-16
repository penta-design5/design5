import { NextResponse } from 'next/server'
import { DesignRequestStatus, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다.')

function parseDateOnlyUtc(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  departmentTeam: z.string().min(1).optional(),
  dueDate: dateStr.optional(),
  content: z.string().min(1).optional(),
  status: z.nativeEnum(DesignRequestStatus).optional(),
})

function canMutate(
  user: { id: string; role?: UserRole },
  authorId: string
): boolean {
  return user.id === authorId || user.role === UserRole.ADMIN
}

export const GET = withRouteHandler(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requireAuth()

    const row = await prisma.designRequest.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!row) {
      throw new NotFoundError('게시글을 찾을 수 없습니다.')
    }

    return NextResponse.json({ item: row })
  },
  '불러오는 중 오류가 발생했습니다.'
)

export const PATCH = withRouteHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const user = await requireAuth()
    const existing = await prisma.designRequest.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      throw new NotFoundError('게시글을 찾을 수 없습니다.')
    }

    if (!canMutate(user, existing.authorId)) {
      throw new ForbiddenError('수정 권한이 없습니다.')
    }

    const body = await request.json()
    const data = patchSchema.parse(body)

    const update: {
      title?: string
      departmentTeam?: string
      dueDate?: Date
      content?: string
      status?: DesignRequestStatus
    } = {}

    if (data.title !== undefined) update.title = data.title.trim()
    if (data.departmentTeam !== undefined)
      update.departmentTeam = data.departmentTeam.trim()
    if (data.dueDate !== undefined) update.dueDate = parseDateOnlyUtc(data.dueDate)
    if (data.content !== undefined) update.content = data.content.trim()
    /** 비관리자가 보낸 status는 무시 (권한 없음). 관리자만 반영 */
    if (data.status !== undefined && user.role === UserRole.ADMIN) {
      update.status = data.status
    }

    if (Object.keys(update).length === 0) {
      throw new BadRequestError('수정할 항목이 없습니다.')
    }

    const updated = await prisma.designRequest.update({
      where: { id: params.id },
      data: update,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ item: updated })
  },
  '수정 중 오류가 발생했습니다.'
)

export const DELETE = withRouteHandler(
  async (_request: Request, { params }: { params: { id: string } }) => {
    const user = await requireAuth()
    const existing = await prisma.designRequest.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      throw new NotFoundError('게시글을 찾을 수 없습니다.')
    }

    if (!canMutate(user, existing.authorId)) {
      throw new ForbiddenError('삭제 권한이 없습니다.')
    }

    await prisma.designRequest.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  },
  '삭제 중 오류가 발생했습니다.'
)
