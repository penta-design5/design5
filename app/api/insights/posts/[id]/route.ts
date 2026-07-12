import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth-helpers'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError, BadRequestError } from '@/lib/api/errors'
import { deleteFileByUrl } from '@/lib/b2'
import { isSubscribableCategory } from '@/lib/categories'
import { notifyMenuUpdate } from '@/lib/mail/menu-subscription-notification'
import { insightUpdateFieldsSchema } from '@/lib/insights-schemas'
import { uploadInsightHtml, uploadInsightThumbnail } from '@/lib/insights-storage'

export const dynamic = 'force-dynamic'

const AUTHOR_SELECT = { id: true, name: true, email: true } as const

// GET: 단건 (로그인 사용자)
export const GET = withRouteHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    await requireAuth()

    const item = await prisma.insightPost.findUnique({
      where: { id: params.id },
      include: { author: { select: AUTHOR_SELECT } },
    })
    if (!item) {
      throw new NotFoundError('게시물을 찾을 수 없습니다.')
    }

    return NextResponse.json({ item })
  },
  '불러오는 중 오류가 발생했습니다.'
)

// PATCH: 수정 (관리자 전용) — multipart. 제목/설명 + (선택) HTML/썸네일 교체.
export const PATCH = withRouteHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const user = await requireAdmin()

    const existing = await prisma.insightPost.findUnique({
      where: { id: params.id },
      include: { category: { select: { id: true, slug: true, type: true } } },
    })
    if (!existing) {
      throw new NotFoundError('게시물을 찾을 수 없습니다.')
    }

    const formData = await request.formData()
    const fields = insightUpdateFieldsSchema.parse({
      title: formData.get('title') ?? undefined,
      description: formData.get('description') ?? undefined,
      cardColor: formData.get('cardColor') ?? undefined,
    })

    const htmlFile = formData.get('htmlFile')
    const thumbnailFile = formData.get('thumbnail')

    const hasHtml = htmlFile instanceof File
    const hasThumbnail = thumbnailFile instanceof File
    const hasFieldChange =
      fields.title !== undefined ||
      fields.description !== undefined ||
      fields.cardColor !== undefined

    if (!hasFieldChange && !hasHtml && !hasThumbnail) {
      throw new BadRequestError('수정할 내용이 없습니다.')
    }

    const data: {
      title?: string
      description?: string | null
      cardColor?: string | null
      htmlUrl?: string
      htmlFileName?: string
      htmlFileSize?: number
      thumbnailUrl?: string
      updatedById: string
    } = { updatedById: user.id }

    if (fields.title !== undefined) data.title = fields.title
    if (fields.description !== undefined) {
      data.description = fields.description.trim() || null
    }
    if (fields.cardColor !== undefined) {
      data.cardColor = fields.cardColor || null
    }

    // HTML 교체: 새 파일 업로드 → 기존 객체는 커밋 후 정리
    let oldHtmlUrlToDelete: string | null = null
    if (hasHtml) {
      const uploaded = await uploadInsightHtml(htmlFile, existing.category.slug)
      data.htmlUrl = uploaded.htmlUrl
      data.htmlFileName = uploaded.htmlFileName
      data.htmlFileSize = uploaded.htmlFileSize
      oldHtmlUrlToDelete = existing.htmlUrl
    }

    let oldThumbnailUrlToDelete: string | null = null
    if (hasThumbnail) {
      data.thumbnailUrl = await uploadInsightThumbnail(
        thumbnailFile,
        existing.category.slug
      )
      oldThumbnailUrlToDelete = existing.thumbnailUrl
    }

    const updated = await prisma.insightPost.update({
      where: { id: params.id },
      data,
      include: { author: { select: AUTHOR_SELECT } },
    })

    // 교체된 기존 객체 정리 (best-effort — 실패해도 수정은 성공)
    for (const url of [oldHtmlUrlToDelete, oldThumbnailUrlToDelete]) {
      if (url) {
        try {
          await deleteFileByUrl(url)
        } catch (err) {
          console.error('[insights] 기존 객체 삭제 실패:', url, err)
        }
      }
    }

    if (isSubscribableCategory(existing.category)) {
      await notifyMenuUpdate({
        categoryId: existing.category.id,
        action: 'updated',
        title: updated.title,
        slug: existing.category.slug,
        postId: updated.id,
      })
    }

    return NextResponse.json({ item: updated })
  },
  '수정 중 오류가 발생했습니다.'
)

// DELETE: 삭제 (관리자 전용) — DB 삭제 후 S3 객체 정리(best-effort)
export const DELETE = withRouteHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    await requireAdmin()

    const existing = await prisma.insightPost.findUnique({
      where: { id: params.id },
      select: { id: true, htmlUrl: true, thumbnailUrl: true },
    })
    if (!existing) {
      throw new NotFoundError('게시물을 찾을 수 없습니다.')
    }

    await prisma.insightPost.delete({ where: { id: params.id } })

    for (const url of [existing.htmlUrl, existing.thumbnailUrl]) {
      if (url) {
        try {
          await deleteFileByUrl(url)
        } catch (err) {
          console.error('[insights] 객체 삭제 실패:', url, err)
        }
      }
    }

    return NextResponse.json({ ok: true })
  },
  '삭제 중 오류가 발생했습니다.'
)
