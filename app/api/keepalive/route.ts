import { NextResponse } from 'next/server'
import { ListBucketsCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { getS3Client, isS3StorageConfigured } from '@/lib/s3/config'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * DB·(선택) S3( MinIO) 헬스. GitHub Actions 등에서 주기 호출.
 * KEEPALIVE_SECRET 이 있으면 Authorization: Bearer
 */
export async function GET(request: Request) {
  const secret = process.env.KEEPALIVE_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    await prisma.$queryRaw`SELECT 1`

    let storageOk = false
    if (isS3StorageConfigured()) {
      try {
        await getS3Client().send(new ListBucketsCommand({}))
        storageOk = true
      } catch {
        /* S3만 설정된 경우: 스토리지 실패해도 DB 성공이면 200 */
      }
    }

    return NextResponse.json({
      ok: true,
      db: true,
      storage: storageOk,
      at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[keepalive]', error)
    return NextResponse.json(
      { ok: false, error: 'Keepalive check failed' },
      { status: 500 }
    )
  }
}
