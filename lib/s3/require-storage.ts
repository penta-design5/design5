import { NextResponse } from 'next/server'
import { isS3StorageConfigured } from '@/lib/s3/config'

export function s3NotConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        '객체 스토리지(S3/MinIO)가 구성되지 않았습니다. S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY 및 버킷(S3_*)을 설정하세요.',
    },
    { status: 503 }
  )
}

export function requireS3Json(): ReturnType<typeof s3NotConfiguredResponse> | null {
  if (!isS3StorageConfigured()) return s3NotConfiguredResponse()
  return null
}
