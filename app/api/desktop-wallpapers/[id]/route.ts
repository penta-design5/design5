import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFileByUrl, downloadFile, uploadFile } from '@/lib/b2'
import sharp from 'sharp'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 썸네일 생성
async function generateThumbnailUrl(
  backgroundUrlWindows: string | null,
  backgroundUrlMac: string | null,
  prefix: string
): Promise<string | null> {
  const sourceUrl = backgroundUrlWindows || backgroundUrlMac
  if (!sourceUrl || !sourceUrl.includes('backblazeb2.com')) return null

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

// GET: 단건 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const wallpaper = await prisma.desktopWallpaper.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!wallpaper) {
      return NextResponse.json(
        { error: '바탕화면을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(wallpaper)
  } catch (error) {
    console.error('[GET /api/desktop-wallpapers/[id]] Error:', error)
    return NextResponse.json(
      { error: '바탕화면을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 수정 (관리자 전용)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자만 바탕화면을 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      title,
      description,
      backgroundUrlWindows,
      backgroundUrlMac,
      thumbnailUrl: clientThumbnailUrl,
    } = body

    const existing = await prisma.desktopWallpaper.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: '바탕화면을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const hasWindows = backgroundUrlWindows && typeof backgroundUrlWindows === 'string'
    const hasMac = backgroundUrlMac && typeof backgroundUrlMac === 'string'
    if (!hasWindows && !hasMac) {
      return NextResponse.json(
        { error: '배경 이미지를 최소 1개 이상 유지해주세요.' },
        { status: 400 }
      )
    }

    let thumbnailUrl = clientThumbnailUrl ?? existing.thumbnailUrl
    const bgChanged =
      (hasWindows && backgroundUrlWindows !== existing.backgroundUrlWindows) ||
      (hasMac && backgroundUrlMac !== existing.backgroundUrlMac)
    if (bgChanged && !clientThumbnailUrl) {
      const generated = await generateThumbnailUrl(
        hasWindows ? backgroundUrlWindows : null,
        hasMac ? backgroundUrlMac : null,
        `thumb_${id}_${Date.now()}`
      )
      if (generated) thumbnailUrl = generated
    }

    const wallpaper = await prisma.desktopWallpaper.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(backgroundUrlWindows !== undefined && {
          backgroundUrlWindows: hasWindows ? backgroundUrlWindows : null,
        }),
        ...(backgroundUrlMac !== undefined && {
          backgroundUrlMac: hasMac ? backgroundUrlMac : null,
        }),
        thumbnailUrl,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(wallpaper)
  } catch (error) {
    console.error('[PUT /api/desktop-wallpapers/[id]] Error:', error)
    return NextResponse.json(
      { error: '바탕화면 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 삭제 (관리자 전용)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자만 바탕화면을 삭제할 수 있습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params

    const existing = await prisma.desktopWallpaper.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: '바탕화면을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const urlsToDelete = [
      existing.thumbnailUrl,
      existing.backgroundUrlWindows,
      existing.backgroundUrlMac,
    ].filter((u): u is string => !!u && u.includes('backblazeb2.com'))

    for (const url of urlsToDelete) {
      try {
        await deleteFileByUrl(url)
      } catch (err) {
        console.error('[DELETE] Failed to delete file:', url, err)
      }
    }

    await prisma.desktopWallpaper.delete({ where: { id } })

    return NextResponse.json({ success: true, message: '바탕화면이 삭제되었습니다.' })
  } catch (error) {
    console.error('[DELETE /api/desktop-wallpapers/[id]] Error:', error)
    return NextResponse.json(
      { error: '바탕화면 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
