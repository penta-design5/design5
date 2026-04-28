import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const imageSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  blurDataURL: z.string().optional(),
  name: z.string(),
  order: z.number().int().nonnegative(),
})

const updatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  images: z.array(imageSchema).min(1, '최소 1개의 이미지가 필요합니다.').optional(),
  concept: z.string().optional().nullable(),
  tool: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  config: z.record(z.any()).optional().nullable(), // CI/BI 타입 등 추가 설정
  producedAt: z.string().datetime().optional().nullable(), // ISO 8601 형식의 날짜 문자열
  thumbnailUrl: z.string().url().optional().nullable(), // PPT 썸네일 이미지 URL
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            pageType: true,
            config: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조회수 증가 (PUBLISHED 상태일 때만) - 재조회 없이 직접 업데이트
    if (post.status === 'PUBLISHED') {
      const updatedPost = await prisma.post.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              pageType: true,
              config: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json(
        { post: updatedPost },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        }
      )
    }

    return NextResponse.json(
      { post },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { error: '게시물을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()
    const { id } = params
    const body = await request.json()

    const validatedData = updatePostSchema.parse(body)

    // 게시물 존재 확인
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // PPT 썸네일 교체·제거 시 이전 Supabase(ppt-thumbnails) 객체 삭제
    if (validatedData.thumbnailUrl !== undefined) {
      const prev = existingPost.thumbnailUrl
      const next = validatedData.thumbnailUrl
      if (prev && prev !== next) {
        const { deletePptThumbnailByPublicUrl } = await import(
          '@/lib/supabase-ppt-thumbnail'
        )
        await deletePptThumbnailByPublicUrl(prev)
      }
    }

    // 태그 처리
    let tagConnections: any[] = []
    if (validatedData.tags !== undefined) {
      // 기존 태그 연결 제거
      await prisma.postTag.deleteMany({
        where: { postId: id },
      })

      // 새 태그가 있으면 생성 또는 연결
      if (validatedData.tags.length > 0) {
        for (const tagName of validatedData.tags) {
          const trimmedTag = tagName.trim()
          if (!trimmedTag) continue

          // name으로 먼저 찾기 (POST API와 동일한 로직)
          let tag = await prisma.tag.findUnique({
            where: { name: trimmedTag },
          })

          if (!tag) {
            // slug 생성 (한글 지원)
            const slug = trimmedTag
              .toLowerCase()
              .replace(/[^a-z0-9가-힣]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '')

            // slug도 unique이므로 타임스탬프 추가
            tag = await prisma.tag.create({
              data: {
                name: trimmedTag,
                slug: `${slug}-${Date.now()}`,
              },
            })
          }

          tagConnections.push({
            tagId: tag.id,
          })
        }
      }
    }

    // 업데이트 데이터 구성
    const updateData: any = {
      title: validatedData.title,
      updatedById: admin.id,
    }

    // 선택적 필드 추가
    if (validatedData.subtitle !== undefined) {
      updateData.subtitle = validatedData.subtitle
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }
    if (validatedData.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = validatedData.thumbnailUrl
    }
    // CI/BI 타입 정보는 concept 필드에 저장
    if (validatedData.config?.ciBiType !== undefined) {
      updateData.concept = validatedData.config.ciBiType
    } else if (validatedData.concept !== undefined) {
      updateData.concept = validatedData.concept
    }
    if (validatedData.tool !== undefined) {
      updateData.tool = validatedData.tool
    }
    if (validatedData.producedAt !== undefined) {
      updateData.producedAt = validatedData.producedAt ? new Date(validatedData.producedAt) : null
    }

    // 이미지 처리
    if (validatedData.images) {
      // 기존 이미지와 새 이미지를 비교하여 삭제할 파일 찾기
      try {
        const { deleteFileByUrl } = await import('@/lib/b2')
        
        // 기존 이미지 파싱
        let existingImages: Array<{ url: string; thumbnailUrl?: string; name: string; order: number }> = []
        if (existingPost.images) {
          if (Array.isArray(existingPost.images)) {
            existingImages = existingPost.images as Array<{ url: string; thumbnailUrl?: string; name: string; order: number }>
          } else if (typeof existingPost.images === 'string') {
            try {
              existingImages = JSON.parse(existingPost.images)
            } catch {
              existingImages = []
            }
          }
        }

        // 새 이미지 URL 목록
        const newImageUrls = new Set(validatedData.images.map((img: any) => img.url))
        const newThumbnailUrls = new Set(
          validatedData.images
            .map((img: any) => img.thumbnailUrl)
            .filter((url: string | undefined) => url)
        )

        // 기존 이미지 중 더 이상 사용되지 않는 파일 삭제
        for (const existingImage of existingImages) {
          // 새 이미지 목록에 없는 경우 삭제
          if (!newImageUrls.has(existingImage.url)) {
            try {
              await deleteFileByUrl(existingImage.url)
            } catch (fileError: any) {
              console.error(`Failed to delete B2 file ${existingImage.url}:`, fileError.message)
            }
          }

          // 썸네일이 있고 새 목록에 없는 경우 삭제
          if (existingImage.thumbnailUrl && !newThumbnailUrls.has(existingImage.thumbnailUrl)) {
            try {
              await deleteFileByUrl(existingImage.thumbnailUrl)
            } catch (thumbnailError: any) {
              console.error(`Failed to delete B2 thumbnail ${existingImage.thumbnailUrl}:`, thumbnailError.message)
            }
          }
        }
      } catch (b2Error: any) {
        // B2 삭제 실패는 로그만 남기고 계속 진행 (데이터베이스 업데이트는 진행)
        console.error('B2 file deletion error:', b2Error.message)
      }

      const firstImage = validatedData.images[0]
      updateData.images = validatedData.images
      
      // thumbnailUrl이 명시적으로 전달되지 않은 경우에만 firstImage.url 사용
      // (PPT 페이지에서는 thumbnailUrl이 Supabase에 저장된 이미지이므로 덮어쓰면 안 됨)
      if (validatedData.thumbnailUrl === undefined) {
        updateData.thumbnailUrl = firstImage.url
      }
      updateData.fileUrl = firstImage.url
    }

    // 게시물 업데이트
    const updatePayload: any = { ...updateData }
    
    // 태그가 업데이트되는 경우에만 tags 관계 추가
    if (validatedData.tags !== undefined && tagConnections.length > 0) {
      updatePayload.tags = {
        create: tagConnections,
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updatePayload,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ post: updatedPost })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Update post error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { 
        error: '게시물을 수정하는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { id } = params

    // 게시물 존재 확인 (이미지 정보 포함)
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (post.fileType === 'svg' && post.fileUrl) {
      try {
        const { isS3StorageConfigured, getS3Client, getBucketIcons } = await import(
          '@/lib/s3/config'
        )
        const { s3ObjectKeyFromAnyPublicUrl } = await import('@/lib/s3/url-helpers')
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

        if (isS3StorageConfigured()) {
          const key = s3ObjectKeyFromAnyPublicUrl(post.fileUrl, getBucketIcons())
          if (key) {
            await getS3Client().send(
              new DeleteObjectCommand({ Bucket: getBucketIcons(), Key: key })
            )
          }
        } else {
          console.warn(
            '[post delete] S3 미설정: icons 버킷에서 파일을 삭제하지 못했습니다.',
            post.fileUrl
          )
        }
      } catch (e: any) {
        console.error('Icon storage deletion error:', e?.message)
      }
    }

    // PPT 썸네일(S3) 삭제
    if (post.thumbnailUrl) {
      try {
        const { deletePptThumbnailByPublicUrl } = await import(
          '@/lib/supabase-ppt-thumbnail'
        )
        await deletePptThumbnailByPublicUrl(post.thumbnailUrl)
      } catch (pptThumbError: any) {
        console.error('PPT thumbnail 삭제 오류:', pptThumbError?.message)
      }
    }

    // B2에서 이미지 파일 삭제 (다른 카테고리인 경우)
    try {
      const { deleteFileByUrl } = await import('@/lib/b2')
      
      // images 배열 파싱
      let images: Array<{ url: string; thumbnailUrl?: string; name: string; order: number }> = []
      if (post.images) {
        if (Array.isArray(post.images)) {
          images = post.images as Array<{ url: string; thumbnailUrl?: string; name: string; order: number }>
        } else if (typeof post.images === 'string') {
          try {
            images = JSON.parse(post.images)
          } catch {
            images = []
          }
        }
      }

      // 각 이미지 파일 삭제 (원본 및 썸네일)
      for (const image of images) {
        try {
          // 원본 이미지 삭제
          await deleteFileByUrl(image.url)
          
          // 썸네일 이미지가 있으면 삭제
          if (image.thumbnailUrl) {
            try {
              await deleteFileByUrl(image.thumbnailUrl)
            } catch (thumbnailError: any) {
              console.error(`Failed to delete B2 thumbnail ${image.thumbnailUrl}:`, thumbnailError.message)
            }
          }
        } catch (fileError: any) {
          // 파일 삭제 실패는 로그만 남기고 계속 진행
          console.error(`Failed to delete B2 file ${image.url}:`, fileError.message)
        }
      }
    } catch (b2Error: any) {
      // B2 삭제 실패는 로그만 남기고 계속 진행 (데이터베이스 삭제는 진행)
      console.error('B2 file deletion error:', b2Error.message)
    }

    // 게시물 삭제 (관련 태그 연결도 자동 삭제됨)
    await prisma.post.delete({
      where: { id },
    })

    return NextResponse.json({ message: '게시물이 삭제되었습니다.' })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: '게시물을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

