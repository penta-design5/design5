import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { downloadFile } from '@/lib/b2'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: 원본 제품 이미지 다운로드 (변환 없이 그대로 제공)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const product = await prisma.hardwareProduct.findUnique({
      where: { id },
      select: { title: true, imageUrl: true },
    })

    if (!product || !product.imageUrl) {
      return NextResponse.json(
        { error: '제품을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const { fileBuffer, contentType } = await downloadFile(product.imageUrl)

    // 원본 확장자 유지, 파일명은 제목 기반
    const ext = product.imageUrl.split('?')[0].split('.').pop() || 'png'
    const safeBase =
      (product.title || 'hardware').replace(/[^a-zA-Z0-9가-힣._-]/g, '_').slice(0, 80) ||
      'hardware'
    const fileName = `${safeBase}.${ext}`
    const encoded = encodeURIComponent(fileName)

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[GET /api/hardware/[id]/download] Error:', error)
    return NextResponse.json(
      { error: '다운로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
