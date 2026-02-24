import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { createCardTemplateSchema } from '@/lib/card-schemas'
import { downloadFile, uploadFile, isB2StorageUrl } from '@/lib/b2'
import type { BackgroundImageItem } from '@/lib/card-schemas'

const CARD_THUMB_WIDTH = 318
const CARD_THUMB_HEIGHT = 167

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
    console.warn('[POST generateCardThumbnail]', err)
    return null
  }
}

// GET: 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'PUBLISHED'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = status === 'all' ? {} : { status }

    const [templates, total] = await Promise.all([
      prisma.cardTemplate.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cardTemplate.count({ where }),
    ])

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + templates.length < total,
      },
    })
  } catch (error) {
    console.error('[GET /api/card-templates] Error:', error)
    return NextResponse.json(
      { error: '템플릿 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 템플릿 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자만 템플릿을 생성할 수 있습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validationResult = createCardTemplateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, description, backgroundImages, width, height, config, status } =
      validationResult.data

    const template = await prisma.cardTemplate.create({
      data: {
        name,
        description,
        thumbnailUrl: null,
        backgroundImages: backgroundImages as object[],
        width,
        height,
        config: config as object,
        status,
        authorId: session.user.id,
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

    const images = backgroundImages as BackgroundImageItem[] | undefined
    if (images?.length && images[0].url) {
      const thumbUrl = await generateCardThumbnail(images[0].url, template.id)
      if (thumbUrl) {
        const updated = await prisma.cardTemplate.update({
          where: { id: template.id },
          data: { thumbnailUrl: thumbUrl },
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
        })
        return NextResponse.json(updated, { status: 201 })
      }
    }

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('[POST /api/card-templates] Error:', error)
    return NextResponse.json(
      { error: '템플릿 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
