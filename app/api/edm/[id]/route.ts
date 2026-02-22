import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  uploadEdmFile,
  getPresignedUrl,
  isObjectKey,
  deleteEdmFileByUrl,
} from '@/lib/r2-edm-storage'
import sharp from 'sharp'
import { parseGridToCells, generateHtmlCode } from '@/lib/edm-utils'
import type { GridConfig, CellLinks, Alignment } from '@/types/edm'

// GET /api/edm/[id] - 단일 eDM 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const edm = await prisma.edm.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!edm) {
      return NextResponse.json({ error: 'eDM을 찾을 수 없습니다.' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    if (edm.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    let thumbnailUrl = edm.thumbnailUrl
    const cellImages = (edm.cellImages as Record<string, string>) || {}
    const cellImagesResolved: Record<string, string> = {}

    if (edm.thumbnailUrl && isObjectKey(edm.thumbnailUrl)) {
      try {
        thumbnailUrl = await getPresignedUrl(edm.thumbnailUrl)
      } catch (e) {
        console.warn('Presigned URL 실패(thumbnail):', e)
      }
    }
    for (const [cellId, val] of Object.entries(cellImages)) {
      if (isObjectKey(val)) {
        try {
          cellImagesResolved[cellId] = await getPresignedUrl(val)
        } catch (e) {
          console.warn('Presigned URL 실패(cell):', cellId, e)
        }
      } else {
        cellImagesResolved[cellId] = val
      }
    }

    const htmlCode = generateHtmlCode(
      edm.gridConfig as unknown as GridConfig,
      cellImagesResolved,
      (edm.cellLinks as CellLinks) || {},
      (edm.alignment as 'left' | 'center' | 'right') || 'left',
      edm.imageWidth,
      edm.imageHeight
    )

    return NextResponse.json({
      edm: {
        ...edm,
        thumbnailUrl,
        cellImages: cellImagesResolved,
        htmlCode,
      },
    })
  } catch (error) {
    console.error('Error fetching edm:', error)
    return NextResponse.json(
      { error: 'eDM을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/edm/[id] - eDM 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.edm.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'eDM을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const formData = await request.formData()
    // 텍스트 필드를 먼저 읽고, 파일은 나중에 읽기 (multipart 파싱 시 필드 누락 방지)
    const title = formData.get('title') as string | null
    const description = formData.get('description') as string | null
    const gridConfigStr = formData.get('gridConfig') as string | null
    const cellLinksStr = formData.get('cellLinks') as string | null
    const alignment = (formData.get('alignment') as Alignment) || existing.alignment
    const image = formData.get('image') as File | null

    let gridConfig = existing.gridConfig as unknown as GridConfig
    let cellLinks = (existing.cellLinks as CellLinks) || {}
    let imageWidth = existing.imageWidth
    let imageHeight = existing.imageHeight
    let cellImages = (existing.cellImages as Record<string, string>) || {}
    let thumbnailUrl = existing.thumbnailUrl

    if (gridConfigStr) {
      gridConfig = JSON.parse(gridConfigStr) as GridConfig
    }
    if (cellLinksStr) {
      cellLinks = JSON.parse(cellLinksStr) as CellLinks
    }

    if (image && image instanceof File) {
      const arrayBuffer = await image.arrayBuffer()
      const imageBuffer = Buffer.from(arrayBuffer)
      const metadata = await sharp(imageBuffer).metadata()
      imageWidth = metadata.width || existing.imageWidth
      imageHeight = metadata.height || existing.imageHeight

      const cells = parseGridToCells(gridConfig)
      const oldCellImages = (existing.cellImages as Record<string, string>) || {}

      for (const keyOrUrl of Object.values(oldCellImages)) {
        try {
          await deleteEdmFileByUrl(keyOrUrl)
        } catch (e) {
          console.warn('Failed to delete old cell image:', e)
        }
      }

      cellImages = {}
      const timestamp = Date.now()
      const basePath = `${id}_${timestamp}`

      for (const cell of cells) {
        const left = Math.round((cell.left / 100) * imageWidth)
        const top = Math.round((cell.top / 100) * imageHeight)
        const width = Math.round((cell.width / 100) * imageWidth)
        const height = Math.round((cell.height / 100) * imageHeight)

        const cropped = await sharp(imageBuffer)
          .extract({ left, top, width, height })
          .jpeg({ quality: 85 })
          .toBuffer()

        const filePath = `${basePath}/cell_${cell.id}_${width}x${height}.jpg`
        const uploadResult = await uploadEdmFile(cropped, filePath, 'image/jpeg')
        cellImages[cell.id] = uploadResult.fileUrl ?? uploadResult.filePath
      }

      if (existing.thumbnailUrl) {
        try {
          await deleteEdmFileByUrl(existing.thumbnailUrl)
        } catch (e) {
          console.warn('Failed to delete old thumbnail:', e)
        }
      }

      // 썸네일: 너비 318px로 정비율 축소 후, 상단 167px만 잘라 사용 (카드 이미지 영역에 맞춤)
      const THUMB_WIDTH = 318
      const THUMB_HEIGHT = 167
      try {
        const scaled = await sharp(imageBuffer)
          .resize(THUMB_WIDTH, null, { fit: 'inside' })
          .toBuffer()
        const scaledMeta = await sharp(scaled).metadata()
        const scaledHeight = scaledMeta.height ?? THUMB_HEIGHT
        const extractHeight = Math.min(scaledHeight, THUMB_HEIGHT)

        const thumbBuffer = await sharp(scaled)
          .extract({ left: 0, top: 0, width: THUMB_WIDTH, height: extractHeight })
          .jpeg({ quality: 85 })
          .toBuffer()

        const thumbResult = await uploadEdmFile(
          thumbBuffer,
          `${basePath}/thumbnail.jpg`,
          'image/jpeg'
        )
        thumbnailUrl = thumbResult.fileUrl ?? thumbResult.filePath
      } catch (thumbErr) {
        console.warn('Thumbnail upload failed:', thumbErr)
      }
    }

    const cellImagesForHtml: Record<string, string> = {}
    for (const [cellId, val] of Object.entries(cellImages)) {
      cellImagesForHtml[cellId] = isObjectKey(val)
        ? await getPresignedUrl(val)
        : val
    }
    const htmlCode = generateHtmlCode(
      gridConfig,
      cellImagesForHtml,
      cellLinks,
      alignment,
      imageWidth,
      imageHeight
    )

    const edm = await prisma.edm.update({
      where: { id },
      data: {
        title:
          title !== undefined && title !== null && String(title).trim() !== ''
            ? String(title).trim()
            : existing.title,
        description:
          description !== undefined && description !== null
            ? description.trim() || null
            : existing.description,
        thumbnailUrl,
        imageWidth,
        imageHeight,
        gridConfig: gridConfig as object,
        cellLinks: cellLinks as object,
        cellImages: cellImages as object,
        htmlCode,
        alignment,
      },
    })

    const resolvedThumbnailUrl =
      edm.thumbnailUrl && isObjectKey(edm.thumbnailUrl)
        ? await getPresignedUrl(edm.thumbnailUrl)
        : edm.thumbnailUrl
    const resolvedCellImages: Record<string, string> = {}
    for (const [cellId, val] of Object.entries(edm.cellImages as Record<string, string> || {})) {
      resolvedCellImages[cellId] = isObjectKey(val) ? await getPresignedUrl(val) : val
    }

    return NextResponse.json({
      edm: {
        ...edm,
        thumbnailUrl: resolvedThumbnailUrl,
        cellImages: resolvedCellImages,
        htmlCode,
      },
    })
  } catch (error: unknown) {
    console.error('Error updating edm:', error)
    const message = error instanceof Error ? error.message : 'eDM 수정에 실패했습니다.'
    return NextResponse.json(
      { error: 'eDM 수정에 실패했습니다.', detail: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    )
  }
}

// DELETE /api/edm/[id] - eDM 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.edm.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'eDM을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    const cellImages = (existing.cellImages as Record<string, string>) || {}
    for (const keyOrUrl of Object.values(cellImages)) {
      try {
        await deleteEdmFileByUrl(keyOrUrl)
      } catch (e) {
        console.warn('Failed to delete cell image:', e)
      }
    }

    if (existing.thumbnailUrl) {
      try {
        await deleteEdmFileByUrl(existing.thumbnailUrl)
      } catch (e) {
        console.warn('Failed to delete thumbnail:', e)
      }
    }

    await prisma.edm.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting edm:', error)
    return NextResponse.json(
      { error: 'eDM 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
