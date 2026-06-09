import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { downloadFile, uploadFile, isB2StorageUrl } from '@/lib/b2'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

// GET: 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const type = searchParams.get('type')

    const where =
      type && type !== 'ALL' ? { type } : {}

    const [products, total] = await Promise.all([
      prisma.hardwareProduct.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.hardwareProduct.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + products.length < total,
      },
    })
  } catch (error) {
    console.error('[GET /api/hardware] Error:', error)
    return NextResponse.json(
      { error: '제품 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
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

// POST: 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자만 제품을 추가할 수 있습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, type, imageUrl, thumbnailUrl: clientThumbnailUrl } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: '제품 이미지를 업로드해주세요.' },
        { status: 400 }
      )
    }

    let thumbnailUrl = clientThumbnailUrl
    if (!thumbnailUrl) {
      thumbnailUrl = await generateThumbnailUrl(imageUrl, `thumb_${Date.now()}`)
    }

    const product = await prisma.hardwareProduct.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type: typeof type === 'string' && type.trim() ? type.trim() : null,
        imageUrl,
        thumbnailUrl,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('[POST /api/hardware] Error:', error)
    return NextResponse.json(
      { error: '제품 추가에 실패했습니다.' },
      { status: 500 }
    )
  }
}
