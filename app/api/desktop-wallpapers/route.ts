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

    const [wallpapers, total] = await Promise.all([
      prisma.desktopWallpaper.findMany({
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.desktopWallpaper.count(),
    ])

    return NextResponse.json({
      wallpapers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + wallpapers.length < total,
      },
    })
  } catch (error) {
    console.error('[GET /api/desktop-wallpapers] Error:', error)
    return NextResponse.json(
      { error: '바탕화면 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 썸네일 생성 (윈도우용 우선, 없으면 맥용)
async function generateThumbnailUrl(
  backgroundUrlWindows: string | null,
  backgroundUrlMac: string | null,
  prefix: string
): Promise<string | null> {
  const sourceUrl = backgroundUrlWindows || backgroundUrlMac
  if (!sourceUrl || !isB2StorageUrl(sourceUrl)) return null

  try {
    const { fileBuffer } = await downloadFile(sourceUrl)
    const CARD_WIDTH = 320
    const thumbnail = await sharp(fileBuffer)
      .resize(CARD_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    const thumbnailFileName = `wallpaper/thumbnails/${prefix}_${Date.now()}.jpg`
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
        { error: '관리자만 바탕화면을 추가할 수 있습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      backgroundUrlWindows,
      backgroundUrlMac,
      thumbnailUrl: clientThumbnailUrl,
    } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: '제목을 입력해주세요.' },
        { status: 400 }
      )
    }

    const hasWindows = backgroundUrlWindows && typeof backgroundUrlWindows === 'string'
    const hasMac = backgroundUrlMac && typeof backgroundUrlMac === 'string'
    if (!hasWindows && !hasMac) {
      return NextResponse.json(
        { error: '배경 이미지를 최소 1개 이상 업로드해주세요.' },
        { status: 400 }
      )
    }

    let thumbnailUrl = clientThumbnailUrl
    if (!thumbnailUrl) {
      thumbnailUrl = await generateThumbnailUrl(
        hasWindows ? backgroundUrlWindows : null,
        hasMac ? backgroundUrlMac : null,
        `thumb_${Date.now()}`
      )
    }

    const wallpaper = await prisma.desktopWallpaper.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        thumbnailUrl,
        backgroundUrlWindows: hasWindows ? backgroundUrlWindows : null,
        backgroundUrlMac: hasMac ? backgroundUrlMac : null,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(wallpaper, { status: 201 })
  } catch (error) {
    console.error('[POST /api/desktop-wallpapers] Error:', error)
    return NextResponse.json(
      { error: '바탕화면 추가에 실패했습니다.' },
      { status: 500 }
    )
  }
}
