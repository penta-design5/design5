import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const SETTINGS_ROW_ID = 'default'

/** 로그인 페이지 등 — 인증 없이 이메일/비밀번호 로그인 노출 여부만 반환 */
export async function GET() {
  try {
    let row = await prisma.appSettings.findUnique({
      where: { id: SETTINGS_ROW_ID },
    })
    if (!row) {
      row = await prisma.appSettings.create({
        data: { id: SETTINGS_ROW_ID, showCredentialsLogin: true },
      })
    }
    return NextResponse.json({ showCredentialsLogin: row.showCredentialsLogin })
  } catch (e) {
    console.error('GET /api/app-settings/public', e)
    return NextResponse.json(
      { showCredentialsLogin: true },
      { status: 200 }
    )
  }
}
