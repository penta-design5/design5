import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import {
  getShowCredentialsLogin,
  setShowCredentialsLogin,
} from '@/lib/app-settings'
import { isPrivilegedLoginSettingsEmail } from '@/lib/privileged-admin'

export const dynamic = 'force-dynamic'

const patchBodySchema = z.object({
  showCredentialsLogin: z.boolean(),
})

export async function GET() {
  try {
    const user = await requireAuth()
    if (!isPrivilegedLoginSettingsEmail(user.email)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
    const showCredentialsLogin = await getShowCredentialsLogin()
    return NextResponse.json({ showCredentialsLogin })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    console.error('GET /api/app-settings/credentials-login', error)
    return NextResponse.json(
      { error: '설정을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    if (!isPrivilegedLoginSettingsEmail(user.email)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const data = patchBodySchema.parse(body)
    await setShowCredentialsLogin(data.showCredentialsLogin)
    return NextResponse.json({
      showCredentialsLogin: data.showCredentialsLogin,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
        { status: 400 }
      )
    }
    console.error('PATCH /api/app-settings/credentials-login', error)
    return NextResponse.json(
      { error: '설정 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
