import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-helpers'
import {
  getMenuSubscriptionEnabled,
  setMenuSubscriptionEnabled,
} from '@/lib/app-settings'
import { withRouteHandler } from '@/lib/api/with-route-handler'

export const dynamic = 'force-dynamic'

const patchBodySchema = z.object({
  menuSubscriptionEnabled: z.boolean(),
})

export const GET = withRouteHandler(async () => {
  await requireAdmin()
  const menuSubscriptionEnabled = await getMenuSubscriptionEnabled()
  return NextResponse.json({ menuSubscriptionEnabled })
}, '설정을 불러올 수 없습니다.')

export const PATCH = withRouteHandler(async (request: Request) => {
  await requireAdmin()
  const body = await request.json()
  const data = patchBodySchema.parse(body)
  await setMenuSubscriptionEnabled(data.menuSubscriptionEnabled)
  return NextResponse.json({
    menuSubscriptionEnabled: data.menuSubscriptionEnabled,
  })
}, '설정 저장 중 오류가 발생했습니다.')
