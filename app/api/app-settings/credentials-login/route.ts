import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import {
  getShowCredentialsLogin,
  setShowCredentialsLogin,
} from '@/lib/app-settings'
import { isPrivilegedLoginSettingsEmail } from '@/lib/access-control'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { ForbiddenError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const patchBodySchema = z.object({
  showCredentialsLogin: z.boolean(),
})

export const GET = withRouteHandler(async () => {
  const user = await requireAuth()
  if (!isPrivilegedLoginSettingsEmail(user.email)) {
    throw new ForbiddenError('권한이 없습니다.')
  }
  const showCredentialsLogin = await getShowCredentialsLogin()
  return NextResponse.json({ showCredentialsLogin })
}, '설정을 불러올 수 없습니다.')

export const PATCH = withRouteHandler(async (request: Request) => {
  const user = await requireAuth()
  if (!isPrivilegedLoginSettingsEmail(user.email)) {
    throw new ForbiddenError('권한이 없습니다.')
  }

  const body = await request.json()
  const data = patchBodySchema.parse(body)
  await setShowCredentialsLogin(data.showCredentialsLogin)
  return NextResponse.json({
    showCredentialsLogin: data.showCredentialsLogin,
  })
}, '설정 저장 중 오류가 발생했습니다.')
