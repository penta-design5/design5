import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { updateCardTemplateSchema } from '@/lib/card-schemas'
import { deleteFileByUrl, downloadFile, uploadFile, isB2StorageUrl } from '@/lib/b2'
import type { BackgroundImageItem } from '@/lib/card-schemas'

interface RouteParams {
  params: Promise<{ id: string }>
}

const CARD_THUMB_WIDTH = 318
const CARD_THUMB_HEIGHT = 167

function getB2UrlsFromBackgroundImages(images: unknown): string[] {
  if (!Array.isArray(images)) return []
  return images
    .filter((item): item is BackgroundImageItem => item && typeof item === 'object' && 'url' in item)
    .map((item) => item.url)
    .filter((url) => typeof url === 'string' && isB2StorageUrl(url))
}

/** 첫 배경 이미지로부터 썸네일 생성 후 B2 업로드 (eDM 방식: 318×167) */
async function generateCardThumbnail(
  firstImageUrl: string,
  templateId: string
): Promise<string | null> {
  if (!isB2StorageUrl(firstImageUrl)) return null
  try {
    const { fileBuffer } = await downloadFile(firstImageUrl)
    const scaled = await sharp(fileBuffer)
      .resize(CARD_THUMB_WIDTH, null, { fit: 'inside' })
      .toBuffer()
    const scaledMeta = await sharp(scaled).metadata()
    const scaledHeight = scaledMeta.height ?? CARD_THUMB_HEIGHT
    const extractHeight = Math.min(scaledHeight, CARD_THUMB_HEIGHT)
    const thumbBuffer = await sharp(scaled)
      .extract({ left: 0, top: 0, width: CARD_THUMB_WIDTH, height: extractHeight })
      .jpeg({ quality: 85 })
      .toBuffer()
    const fileName = `card-thumbnails/${templateId}_${Date.now()}.jpg`
    const result = await uploadFile(thumbBuffer, fileName, 'image/jpeg')
    return result.fileUrl
  } catch (err) {
    console.warn('[generateCardThumbnail]', err)
    return null
  }
}

// GET: 단일 템플릿 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const template = await prisma.cardTemplate.findUnique({
      where: { id },
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

    if (!template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('[GET /api/card-templates/[id]] Error:', error)
    return NextResponse.json(
      { error: '템플릿을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 템플릿 수정 (관리자 전용)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자만 템플릿을 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validationResult = updateCardTemplateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const existingTemplate = await prisma.cardTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // backgroundImages가 바뀌면 기존 B2 URL 중 새 목록에 없는 것은 삭제
    const newImages = validationResult.data.backgroundImages as BackgroundImageItem[] | undefined
    if (newImages) {
      const oldUrls = new Set(getB2UrlsFromBackgroundImages(existingTemplate.backgroundImages))
      const newUrls = new Set(getB2UrlsFromBackgroundImages(newImages))
      for (const url of oldUrls) {
        if (!newUrls.has(url)) {
          try {
            await deleteFileByUrl(url)
          } catch (e) {
            console.error('[PUT] Failed to delete old background image:', url, e)
          }
        }
      }
    }

    const updateData = { ...validationResult.data } as {
      name?: string
      description?: string
      thumbnailUrl?: string
      backgroundImages?: object[]
      width?: number
      height?: number
      config?: object
      status?: string
    }

    // 배경 이미지가 있으면 썸네일 생성 후 B2 업로드, 기존 썸네일(B2) 삭제
    if (newImages?.length && newImages[0].url) {
      const thumbUrl = await generateCardThumbnail(newImages[0].url, id)
      if (thumbUrl) updateData.thumbnailUrl = thumbUrl
      const existingThumb = existingTemplate.thumbnailUrl
      if (existingThumb && isB2StorageUrl(existingThumb)) {
        try {
          await deleteFileByUrl(existingThumb)
        } catch (e) {
          console.warn('[PUT] Failed to delete old thumbnail:', e)
        }
      }
    }

    const template = await prisma.cardTemplate.update({
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

    return NextResponse.json(template)
  } catch (error) {
    console.error('[PUT /api/card-templates/[id]] Error:', error)
    return NextResponse.json(
      { error: '템플릿 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 템플릿 삭제 (관리자 전용)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자만 템플릿을 삭제할 수 있습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params

    const existingTemplate = await prisma.cardTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const urls = getB2UrlsFromBackgroundImages(existingTemplate.backgroundImages)
    for (const url of urls) {
      try {
        await deleteFileByUrl(url)
      } catch (e) {
        console.error('[DELETE] Failed to delete background image:', url, e)
      }
    }
    const thumbUrl = existingTemplate.thumbnailUrl
    if (thumbUrl && isB2StorageUrl(thumbUrl)) {
      try {
        await deleteFileByUrl(thumbUrl)
      } catch (e) {
        console.warn('[DELETE] Failed to delete thumbnail:', e)
      }
    }

    await prisma.cardTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: '템플릿이 삭제되었습니다.' })
  } catch (error) {
    console.error('[DELETE /api/card-templates/[id]] Error:', error)
    return NextResponse.json(
      { error: '템플릿 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
