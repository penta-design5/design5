import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { downloadFile, downloadFileWithRange } from '@/lib/b2'

export const dynamic = 'force-dynamic'

const CHUNK_END_FALLBACK = 10 * 1024 * 1024 // 10MB max per range if end not specified

function parseRange(rangeHeader: string | null): { start: number; end: number } | null {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) return null
  const parts = rangeHeader.slice(6).trim().split('-')
  const start = parseInt(parts[0], 10)
  if (isNaN(start) || start < 0) return null
  const endRaw = parts[1]
  const end = endRaw === '' ? start + CHUNK_END_FALLBACK - 1 : parseInt(endRaw, 10)
  if (isNaN(end) || end < start) return null
  return { start, end }
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { config: true },
    })

    if (!category) {
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다.' }, { status: 404 })
    }

    const config = category.config as Record<string, unknown> | null
    const guideVideoUrl = config?.guideVideoUrl
    if (!guideVideoUrl || typeof guideVideoUrl !== 'string') {
      return NextResponse.json({ error: '가이드 영상이 없습니다.' }, { status: 404 })
    }

    const rangeHeader = request.headers.get('range')
    const range = parseRange(rangeHeader)

    if (range) {
      const { fileBuffer, contentType, contentRange, totalLength } = await downloadFileWithRange(
        guideVideoUrl,
        range.start,
        range.end
      )
      return new Response(new Uint8Array(fileBuffer), {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(fileBuffer.length),
          'Content-Range': contentRange || `bytes ${range.start}-${range.start + fileBuffer.length - 1}/${totalLength}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    const { fileBuffer, contentType } = await downloadFile(guideVideoUrl)
    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuffer.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error: unknown) {
    console.error('Guide video stream error:', error)
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: '가이드 영상을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
