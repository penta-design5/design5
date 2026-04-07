import { NextResponse } from 'next/server'
import { DesignRequestStatus, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'

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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ item: row })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    console.error('GET /api/design-requests/[id]', error)
    return NextResponse.json(
      { error: '불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const existing = await prisma.designRequest.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!canMutate(user, existing.authorId)) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
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
      return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 })
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? '입력값을 확인해주세요.' },
        { status: 400 }
      )
    }
    console.error('PATCH /api/design-requests/[id]', error)
    return NextResponse.json(
      { error: '수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const existing = await prisma.designRequest.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!canMutate(user, existing.authorId)) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.designRequest.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    console.error('DELETE /api/design-requests/[id]', error)
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
