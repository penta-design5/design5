import { NextResponse } from 'next/server'
import { DesignRequestStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { notifyDesignRequestCreated } from '@/lib/mail/design-request-notification'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다.')

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  q: z.string().optional(),
  authorName: z.string().optional(),
  departmentTeam: z.string().optional(),
  status: z.nativeEnum(DesignRequestStatus).optional(),
  createdFrom: dateStr.optional(),
  createdTo: dateStr.optional(),
  dueFrom: dateStr.optional(),
  dueTo: dateStr.optional(),
})

function parseDateOnlyUtc(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const createBodySchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  departmentTeam: z.string().min(1, '의뢰 부서/팀을 입력해주세요.'),
  dueDate: dateStr,
  content: z.string().min(1, '의뢰 내용을 입력해주세요.'),
})

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const validated = listQuerySchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      q: searchParams.get('q') || undefined,
      authorName: searchParams.get('authorName') || undefined,
      departmentTeam: searchParams.get('departmentTeam') || undefined,
      status: searchParams.get('status') || undefined,
      createdFrom: searchParams.get('createdFrom') || undefined,
      createdTo: searchParams.get('createdTo') || undefined,
      dueFrom: searchParams.get('dueFrom') || undefined,
      dueTo: searchParams.get('dueTo') || undefined,
    })

    const skip = (validated.page - 1) * validated.limit

    const where: Prisma.DesignRequestWhereInput = {}

    if (validated.q?.trim()) {
      where.title = { contains: validated.q.trim(), mode: 'insensitive' }
    }
    if (validated.departmentTeam?.trim()) {
      where.departmentTeam = {
        contains: validated.departmentTeam.trim(),
        mode: 'insensitive',
      }
    }
    if (validated.status) {
      where.status = validated.status
    }
    if (validated.authorName?.trim()) {
      const term = validated.authorName.trim()
      where.author = {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      }
    }
    const createdAtFilter: Prisma.DateTimeFilter = {}
    if (validated.createdFrom) {
      createdAtFilter.gte = parseDateOnlyUtc(validated.createdFrom)
    }
    if (validated.createdTo) {
      const end = parseDateOnlyUtc(validated.createdTo)
      end.setUTCHours(23, 59, 59, 999)
      createdAtFilter.lte = end
    }
    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter
    }

    const dueDateFilter: Prisma.DateTimeFilter = {}
    if (validated.dueFrom) {
      dueDateFilter.gte = parseDateOnlyUtc(validated.dueFrom)
    }
    if (validated.dueTo) {
      dueDateFilter.lte = parseDateOnlyUtc(validated.dueTo)
    }
    if (Object.keys(dueDateFilter).length > 0) {
      where.dueDate = dueDateFilter
    }

    const [total, rows] = await Promise.all([
      prisma.designRequest.count({ where }),
      prisma.designRequest.findMany({
        where,
        skip,
        take: validated.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      items: rows,
      total,
      page: validated.page,
      pageSize: validated.limit,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '요청 형식이 올바르지 않습니다.', details: error.flatten() },
        { status: 400 }
      )
    }
    console.error('GET /api/design-requests', error)
    return NextResponse.json(
      { error: '목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = createBodySchema.parse(body)

    const created = await prisma.designRequest.create({
      data: {
        title: data.title.trim(),
        departmentTeam: data.departmentTeam.trim(),
        content: data.content.trim(),
        dueDate: parseDateOnlyUtc(data.dueDate),
        status: DesignRequestStatus.REQUESTED,
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // 서버리스 환경에서 백그라운드 작업이 끊기지 않도록 발송 완료까지 대기 (SMTP는 Promise.all로 병렬)
    await notifyDesignRequestCreated(created)

    return NextResponse.json({ item: created }, { status: 201 })
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
    console.error('POST /api/design-requests', error)
    return NextResponse.json(
      { error: '등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
