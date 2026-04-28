import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { downloadFile } from '@/lib/b2'
import { changeIconSvgProperties } from '@/lib/svg-utils'
import sharp from 'sharp'
import { z } from 'zod'
import { getBucketIcons, getS3Client, isS3StorageConfigured } from '@/lib/s3/config'
import { streamToBuffer } from '@/lib/s3/stream-utils'
import { s3ObjectKeyFromAnyPublicUrl } from '@/lib/s3/url-helpers'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  format: z.enum(['png', 'jpg', 'svg']),
  size: z.coerce.number().optional(),
  color: z.string().optional(),
  strokeWidth: z.coerce.number().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse({
      format: searchParams.get('format') || 'png',
      size: searchParams.get('size'),
      color: searchParams.get('color'),
      strokeWidth: searchParams.get('strokeWidth'),
    })

    const { id } = params

    const { prisma } = await import('@/lib/prisma')
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        fileUrl: true,
      },
    })

    if (!post || !post.fileUrl) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const fileUrl = post.fileUrl
    let svgContent: string

    try {
      if (isS3StorageConfigured()) {
        const key =
          s3ObjectKeyFromAnyPublicUrl(fileUrl, getBucketIcons()) ||
          (() => {
            try {
              const p = new URL(fileUrl).pathname.split('/').filter(Boolean)
              return p.length ? p[p.length - 1] : null
            } catch {
              return null
            }
          })()
        if (!key) throw new Error('no S3 key')
        const res = await getS3Client().send(
          new GetObjectCommand({
            Bucket: getBucketIcons(),
            Key: key,
          })
        )
        if (!res.Body) throw new Error('empty')
        const buf = await streamToBuffer(res.Body)
        svgContent = buf.toString('utf-8')
      } else {
        const { fileBuffer } = await downloadFile(fileUrl)
        svgContent = fileBuffer.toString('utf-8')
      }
    } catch (error: any) {
      console.error('SVG download error:', error)
      return NextResponse.json(
        { error: 'SVG 파일을 다운로드할 수 없습니다.' },
        { status: 500 }
      )
    }

    const color = validatedQuery.color || '#000000'
    const strokeWidth = validatedQuery.strokeWidth || 1
    const size = validatedQuery.size || 24

    svgContent = changeIconSvgProperties(svgContent, color, strokeWidth, size)

    if (validatedQuery.format === 'svg') {
      return new NextResponse(svgContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="${post.title}.svg"`,
        },
      })
    }

    const format = validatedQuery.format === 'jpg' ? 'jpeg' : 'png'
    const mimeType = `image/${format}`

    let sharpInstance = sharp(Buffer.from(svgContent), { density: 600 })

    if (size) {
      const roundedSize = Math.round(size)
      sharpInstance = sharpInstance.resize(roundedSize, roundedSize)
    }

    if (format === 'jpeg') {
      sharpInstance = sharpInstance.flatten({ background: { r: 255, g: 255, b: 255 } })
    }

    const imageBuffer = await sharpInstance.toFormat(format, { quality: 100 }).toBuffer()

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${post.title}.${validatedQuery.format}"`,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('ICON download error:', error)
    return NextResponse.json(
      { error: error.message || '다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
