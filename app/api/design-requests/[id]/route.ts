import { NextResponse } from 'next/server'
import { DesignRequestStatus, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors'
import { deleteFileByUrl } from '@/lib/b2'
import {
  DESIGN_REQUEST_ATTACHMENT_MAX_COUNT,
  designRequestAttachmentInputSchema,
} from '@/lib/design-request-attachments'

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
  addedAttachments: z.array(designRequestAttachmentInputSchema).optional(),
  removedAttachmentIds: z.array(z.string()).optional(),
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
        attachments: { orderBy: { createdAt: 'asc' } },
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

    const removedIds = data.removedAttachmentIds ?? []
    const added = data.addedAttachments ?? []
    const hasAttachmentChange = removedIds.length > 0 || added.length > 0

    if (Object.keys(update).length === 0 && !hasAttachmentChange) {
      throw new BadRequestError('수정할 항목이 없습니다.')
    }

    // 첨부 개수 상한 재검증: (현재 - 삭제 + 추가) ≤ MAX
    if (hasAttachmentChange) {
      const current = await prisma.designRequestAttachment.findMany({
        where: { requestId: params.id },
        select: { id: true, fileUrl: true },
      })
      const currentIds = new Set(current.map((a) => a.id))
      // 이 의뢰에 속하지 않는 삭제 요청은 무시
      const validRemovedIds = removedIds.filter((id) => currentIds.has(id))
      const finalCount = current.length - validRemovedIds.length + added.length
      if (finalCount > DESIGN_REQUEST_ATTACHMENT_MAX_COUNT) {
        throw new BadRequestError(
          `첨부는 최대 ${DESIGN_REQUEST_ATTACHMENT_MAX_COUNT}개까지 가능합니다.`
        )
      }

      // DB 반영 (트랜잭션): 제거분 삭제 + 신규 생성 + 본문 업데이트
      await prisma.$transaction([
        ...(validRemovedIds.length > 0
          ? [
              prisma.designRequestAttachment.deleteMany({
                where: { id: { in: validRemovedIds }, requestId: params.id },
              }),
            ]
          : []),
        ...(added.length > 0
          ? [
              prisma.designRequestAttachment.createMany({
                data: added.map((a) => ({
                  requestId: params.id,
                  fileName: a.fileName,
                  fileUrl: a.fileUrl,
                  fileSize: a.fileSize,
                  mimeType: a.mimeType,
                })),
              }),
            ]
          : []),
        prisma.designRequest.update({
          where: { id: params.id },
          data: update,
        }),
      ])

      // S3 객체 정리 (DB 커밋 후, 실패해도 요청은 성공 처리 — 고아 객체는 로그만)
      const removedUrls = current
        .filter((a) => validRemovedIds.includes(a.id))
        .map((a) => a.fileUrl)
      await Promise.all(
        removedUrls.map((url) =>
          deleteFileByUrl(url).catch((e) =>
            console.error('첨부 S3 삭제 실패:', url, e)
          )
        )
      )
    } else {
      await prisma.designRequest.update({
        where: { id: params.id },
        data: update,
      })
    }

    const updated = await prisma.designRequest.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        attachments: { orderBy: { createdAt: 'asc' } },
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

    // 첨부 S3 객체 먼저 정리 (DB는 onDelete: Cascade로 자동 삭제)
    const attachments = await prisma.designRequestAttachment.findMany({
      where: { requestId: params.id },
      select: { fileUrl: true },
    })
    await Promise.all(
      attachments.map((a) =>
        deleteFileByUrl(a.fileUrl).catch((e) =>
          console.error('첨부 S3 삭제 실패:', a.fileUrl, e)
        )
      )
    )

    await prisma.designRequest.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  },
  '삭제 중 오류가 발생했습니다.'
)
