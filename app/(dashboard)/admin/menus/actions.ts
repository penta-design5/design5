'use server'

import { updateTag } from 'next/cache'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * 메뉴 변경 직후 카테고리 캐시를 즉시 만료하고 현재 화면(사이드바 포함)을 다시 그린다.
 * Route Handler의 revalidateTag는 응답 이후(waitUntil)에 처리되어, 바로 이어지는 router.refresh()가
 * 옛 캐시를 받을 수 있다. Server Action의 updateTag는 렌더 전에 만료를 끝낸다(read-your-own-writes).
 */
export async function refreshMenuCache() {
  await requireAdmin()
  updateTag('categories')
}
