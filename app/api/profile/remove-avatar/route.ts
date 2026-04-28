import { NextResponse } from 'next/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBucketAvatars, getS3Client } from '@/lib/s3/config'
import { s3ObjectKeyFromAnyPublicUrl } from '@/lib/s3/url-helpers'
import { requireS3Json } from '@/lib/s3/require-storage'

export async function DELETE() {
  const bad = requireS3Json()
  if (bad) return bad

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    })

    if (!user?.avatar) {
      return NextResponse.json(
        { error: '삭제할 프로필 사진이 없습니다.' },
        { status: 400 }
      )
    }

    try {
      const key =
        s3ObjectKeyFromAnyPublicUrl(user.avatar, getBucketAvatars()) ||
        (() => {
          const name = user.avatar.split('/').pop()
          return name ? `avatars/${name}` : null
        })()
      if (key) {
        await getS3Client().send(
          new DeleteObjectCommand({ Bucket: getBucketAvatars(), Key: key })
        )
      }
    } catch (error) {
      console.error('Error deleting avatar from storage:', error)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: null },
    })

    return NextResponse.json({
      success: true,
      message: '프로필 사진이 삭제되었습니다.',
    })
  } catch (error) {
    console.error('Remove avatar error:', error)
    return NextResponse.json(
      { error: '프로필 사진 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
