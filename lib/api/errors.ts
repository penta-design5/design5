import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * API 라우트용 표준 에러 클래스 + HTTP 응답 매퍼.
 *
 * 기존 라우트들은 인증 실패를 `new Error('Unauthorized')` / `'Forbidden'`로 던지고
 * catch에서 `error.message === 'Unauthorized'` 문자열로 식별하는 취약한 결합을 썼다.
 * 여기서는 전용 에러 클래스(`instanceof`로 식별)를 제공하되, `.message` 기본값을
 * 기존 문자열과 동일하게 유지하여 아직 마이그레이션하지 않은 catch 블록과도 호환된다.
 */
export class ApiError extends Error {
  /** HTTP 상태 코드 */
  readonly status: number
  /** 클라이언트에 노출할 메시지 (`{ error }` 본문에 사용) */
  readonly publicMessage: string

  constructor(status: number, publicMessage: string, internalMessage?: string) {
    super(internalMessage ?? publicMessage)
    this.name = this.constructor.name
    this.status = status
    this.publicMessage = publicMessage
  }
}

/** 401. 기존 호환을 위해 internal message는 'Unauthorized' 유지 */
export class UnauthorizedError extends ApiError {
  constructor(publicMessage = '인증이 필요합니다.') {
    super(401, publicMessage, 'Unauthorized')
  }
}

/** 403. 기존 호환을 위해 internal message는 'Forbidden' 유지 */
export class ForbiddenError extends ApiError {
  constructor(publicMessage = '권한이 없습니다.') {
    super(403, publicMessage, 'Forbidden')
  }
}

/** 404 */
export class NotFoundError extends ApiError {
  constructor(publicMessage = '찾을 수 없습니다.') {
    super(404, publicMessage, 'Not Found')
  }
}

/** 400 */
export class BadRequestError extends ApiError {
  constructor(publicMessage = '잘못된 요청입니다.') {
    super(400, publicMessage, 'Bad Request')
  }
}

/**
 * 임의의 에러를 표준 `{ error }` JSON 응답으로 변환한다.
 * - ApiError → 해당 status + publicMessage
 * - ZodError → 400 + 첫 번째 검증 메시지 (기존 라우트 관례와 동일)
 * - 그 외 → 500 + fallbackMessage (원본 에러는 console.error로 기록)
 */
export function errorResponse(
  error: unknown,
  fallbackMessage = '서버 오류가 발생했습니다.'
): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.publicMessage },
      { status: error.status }
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.errors[0]?.message ?? '입력값이 올바르지 않습니다.' },
      { status: 400 }
    )
  }

  // 레거시 호환: 아직 ApiError로 마이그레이션하지 않은 코드가 던지는 문자열 에러
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
  }

  console.error('[api] Unhandled error:', error)
  return NextResponse.json({ error: fallbackMessage }, { status: 500 })
}

/** ZodError가 아닌 에러를 식별하는 HTTP status를 계산한다 (응답 본문 없이 status만 필요할 때) */
export function statusForError(error: unknown): number {
  if (error instanceof ApiError) return error.status
  if (error instanceof z.ZodError) return 400
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') return 401
    if (error.message === 'Forbidden') return 403
  }
  return 500
}
