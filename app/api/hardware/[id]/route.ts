import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFileByUrl, downloadFile, uploadFile, isB2StorageUrl } from '@/lib/b2'
import sharp from 'sharp'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 썸네일 생성 (원본 이미지에서)
async function generateThumbnailUrl(
  imageUrl: string | null,
  prefix: string
): Promise<string | null> {
  if (!imageUrl || !isB2StorageUrl(imageUrl)) return null

  try {
    const { fileBuffer } = await downloadFile(imageUrl)
    const CARD_WIDTH = 320
    const thumbnail = await sharp(fileBuffer)
      .resize(CARD_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    const thumbnailFileName = `hw/thumbnails/${prefix}_${Date.now()}.jpg`
    const result = await uploadFile(thumbnail, thumbnailFileName, 'image/jpeg')
    return result.fileUrl
  } catch (err) {
    console.error('[generateThumbnailUrl] Error:', err)
    return null
  }
}

// GET: 단건 조회
export const GET = withRouteHandler(async (request: NextRequest, { params }: RouteParams) => {
  const { id } = await params

  const product = await prisma.hardwareProduct.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!product) {
    throw new NotFoundError('제품을 찾을 수 없습니다.')
  }

  return NextResponse.json(product)
}, '제품을 불러오는데 실패했습니다.')

// PUT: 수정 (관리자 전용)
export const PUT = withRouteHandler(async (request: NextRequest, { params }: RouteParams) => {
  const session = await auth()

  if (!session?.user) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  if (session.user.role !== 'ADMIN') {
    throw new ForbiddenError('관리자만 제품을 수정할 수 있습니다.')
  }

  const { id } = await params
  const body = await request.json()
  const { title, description, type, imageUrl, thumbnailUrl: clientThumbnailUrl } = body

  const existing = await prisma.hardwareProduct.findUnique({ where: { id } })
  if (!existing) {
    throw new NotFoundError('제품을 찾을 수 없습니다.')
  }

  const nextImageUrl =
    imageUrl !== undefined && imageUrl ? imageUrl : existing.imageUrl
  if (!nextImageUrl) {
    throw new BadRequestError('제품 이미지를 유지해주세요.')
  }

  let thumbnailUrl = clientThumbnailUrl ?? existing.thumbnailUrl
  const imageChanged = imageUrl !== undefined && imageUrl && imageUrl !== existing.imageUrl
  if (imageChanged && !clientThumbnailUrl) {
    const generated = await generateThumbnailUrl(
      nextImageUrl,
      `thumb_${id}_${Date.now()}`
    )
    if (generated) thumbnailUrl = generated
  }

  const product = await prisma.hardwareProduct.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(description !== undefined && {
        description: description?.trim() || null,
      }),
      ...(type !== undefined && {
        type: typeof type === 'string' && type.trim() ? type.trim() : null,
      }),
      imageUrl: nextImageUrl,
      thumbnailUrl,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json(product)
}, '제품 수정에 실패했습니다.')

// DELETE: 삭제 (관리자 전용)
export const DELETE = withRouteHandler(async (request: NextRequest, { params }: RouteParams) => {
  const session = await auth()

  if (!session?.user) {
    throw new UnauthorizedError('인증이 필요합니다.')
  }

  if (session.user.role !== 'ADMIN') {
    throw new ForbiddenError('관리자만 제품을 삭제할 수 있습니다.')
  }

  const { id } = await params

  const existing = await prisma.hardwareProduct.findUnique({ where: { id } })
  if (!existing) {
    throw new NotFoundError('제품을 찾을 수 없습니다.')
  }

  const urlsToDelete = [existing.imageUrl, existing.thumbnailUrl].filter(
    (u): u is string => !!u && isB2StorageUrl(u)
  )

  for (const url of urlsToDelete) {
    try {
      await deleteFileByUrl(url)
    } catch (err) {
      console.error('[DELETE] Failed to delete file:', url, err)
    }
  }

  await prisma.hardwareProduct.delete({ where: { id } })

  return NextResponse.json({ success: true, message: '제품이 삭제되었습니다.' })
}, '제품 삭제에 실패했습니다.')
