import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api/errors'

/**
 * 라우트 핸들러를 공통 try/catch로 감싼다.
 * 핸들러가 던진 ApiError/ZodError/일반 에러를 표준 `{ error }` 응답으로 변환.
 *
 * 사용 예:
 *   export const POST = withRouteHandler(async (request) => {
 *     const admin = await requireAdmin()
 *     ...
 *     return NextResponse.json({ post }, { status: 201 })
 *   }, '게시물을 생성하는 중 오류가 발생했습니다.')
 *
 * 핸들러의 인자(request, context)는 그대로 전달된다.
 */
export function withRouteHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse> | NextResponse,
  fallbackMessage?: string
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args)
    } catch (error) {
      return errorResponse(error, fallbackMessage)
    }
  }
}
