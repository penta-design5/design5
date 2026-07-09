import { NextRequest, NextResponse } from 'next/server'
import { CategoryType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth-helpers'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'
import { isSubscribableCategory } from '@/lib/categories'
import { notifyMenuUpdate } from '@/lib/mail/menu-subscription-notification'
import { insightCreateFieldsSchema } from '@/lib/insights-schemas'
import { uploadInsightHtml, uploadInsightThumbnail } from '@/lib/insights-storage'

export const dynamic = 'force-dynamic'

const AUTHOR_SELECT = { id: true, name: true, email: true } as const

// GET: 목록 조회 (로그인 사용자) — categoryId 기준, page/limit. 검색 없음(헤더 통합검색 사용).
export const GET = withRouteHandler(async (request: NextRequest) => {
  await requireAuth()

  const searchParams = request.nextUrl.searchParams
  const categoryId = searchParams.get('categoryId')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20)
  )
  const skip = (page - 1) * limit

  if (!categoryId) {
    throw new BadRequestError('categoryId가 필요합니다.')
  }

  const where = { categoryId }

  const [items, total] = await Promise.all([
    prisma.insightPost.findMany({
      where,
      include: { author: { select: AUTHOR_SELECT } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.insightPost.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize: limit })
}, '목록을 불러오는 중 오류가 발생했습니다.')

// POST: 생성 (관리자 전용) — multipart. HTML 문서를 S3에 저장하고 메타데이터를 DB에 기록.
export const POST = withRouteHandler(async (request: NextRequest) => {
  const user = await requireAdmin()

  const formData = await request.formData()
  const fields = insightCreateFieldsSchema.parse({
    categoryId: formData.get('categoryId'),
    title: formData.get('title'),
    description: formData.get('description') ?? undefined,
  })

  // 카테고리 검증 (INSIGHTS 타입만 허용) + slug 확보(스토리지 키·구독 링크용)
  const category = await prisma.category.findUnique({
    where: { id: fields.categoryId },
    select: { id: true, slug: true, type: true },
  })
  if (!category || category.type !== CategoryType.INSIGHTS) {
    throw new BadRequestError('유효한 INSIGHTS 카테고리가 아닙니다.')
  }

  const htmlFile = formData.get('htmlFile')
  if (!(htmlFile instanceof File)) {
    throw new BadRequestError('HTML 문서를 첨부해주세요.')
  }
  const { htmlUrl, htmlFileName, htmlFileSize } = await uploadInsightHtml(
    htmlFile,
    category.slug
  )

  const thumbnailFile = formData.get('thumbnail')
  const thumbnailUrl =
    thumbnailFile instanceof File
      ? await uploadInsightThumbnail(thumbnailFile, category.slug)
      : null

  const created = await prisma.insightPost.create({
    data: {
      categoryId: category.id,
      title: fields.title,
      description: fields.description?.trim() || null,
      htmlUrl,
      htmlFileName,
      htmlFileSize,
      thumbnailUrl,
      authorId: user.id,
    },
    include: { author: { select: AUTHOR_SELECT } },
  })

  // 구독 알림 (구독 대상 카테고리일 때만) — 상세 링크로 딥링크
  if (isSubscribableCategory(category)) {
    await notifyMenuUpdate({
      categoryId: category.id,
      action: 'created',
      title: created.title,
      slug: category.slug,
      postId: created.id,
    })
  }

  return NextResponse.json({ item: created }, { status: 201 })
}, '게시물 생성 중 오류가 발생했습니다.')
