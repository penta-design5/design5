import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * Supabase 무료 플랜 7일 비활동 일시정지 방지를 위한 keepalive 엔드포인트.
 * GitHub Actions 등에서 3~4일마다 호출하세요.
 * KEEPALIVE_SECRET이 설정된 경우 Authorization: Bearer <secret> 헤더가 필요합니다.
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
    // DB 활동: Supabase(PostgreSQL) 연결 유지
    await prisma.$queryRaw`SELECT 1`

    // Supabase API 활동: Storage 목록 조회 (설정된 경우에만)
    let supabaseOk = false
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceRoleKey) {
      try {
        const { createServerSupabaseClient } = await import('@/lib/supabase')
        const supabase = createServerSupabaseClient()
        const { data: buckets } = await supabase.storage.listBuckets()
        supabaseOk = Array.isArray(buckets)
      } catch {
        // Supabase 호출 실패해도 DB는 이미 성공했으므로 200 유지
      }
    }

    return NextResponse.json({
      ok: true,
      db: true,
      supabase: supabaseOk,
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
