import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getCategoryBySlug } from '@/lib/categories'
import {
  getBucketIcons,
  getS3Client,
  publicUrlForIconsKey,
} from '@/lib/s3/config'
import { requireS3Json } from '@/lib/s3/require-storage'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const bad = requireS3Json()
  if (bad) return bad

  try {
    const admin = await requireAdmin()

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const categorySlug = formData.get('categorySlug') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    if (!categorySlug) {
      return NextResponse.json(
        { error: '카테고리 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    const category = await getCategoryBySlug(categorySlug)
    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    for (const file of files) {
      if (file.size > 1 * 1024 * 1024) {
        return NextResponse.json(
          { error: `파일 크기는 1MB를 초과할 수 없습니다. (${file.name})` },
          { status: 400 }
        )
      }
      if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
        return NextResponse.json(
          { error: `SVG 형식만 지원됩니다. (${file.name})` },
          { status: 400 }
        )
      }
    }

    const createdPosts = []
    const bucket = getBucketIcons()

    for (const file of files) {
      const fileName = file.name.replace(/\.svg$/i, '')
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = safeFileName

      await getS3Client().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: filePath,
          Body: buffer,
          ContentType: 'image/svg+xml',
        })
      )
      const fileUrl = publicUrlForIconsKey(filePath)

      const post = await prisma.post.create({
        data: {
          title: fileName,
          categoryId: category.id,
          images: [
            {
              url: fileUrl,
              name: file.name,
              order: 0,
            },
          ],
          thumbnailUrl: fileUrl,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: 'svg',
          mimeType: 'image/svg+xml',
          authorId: admin.id,
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true, type: true },
          },
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      })
      createdPosts.push(post)
    }

    return NextResponse.json({
      success: true,
      posts: createdPosts,
      message: `${createdPosts.length}개의 아이콘이 업로드되었습니다.`,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }
    console.error('Icon upload error:', error)
    return NextResponse.json(
      { error: error.message || '아이콘 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
