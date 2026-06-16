import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  errorResponse,
  statusForError,
} from '@/lib/api/errors'
import {
  parsePaginationParams,
  buildPaginationMeta,
} from '@/lib/api/pagination'
import { withRouteHandler } from '@/lib/api/with-route-handler'

describe('api/errors', () => {
  describe('error classes', () => {
    it('전용 에러 클래스는 status와 publicMessage를 갖는다', () => {
      expect(new UnauthorizedError().status).toBe(401)
      expect(new ForbiddenError().status).toBe(403)
      expect(new NotFoundError().status).toBe(404)
      expect(new BadRequestError().status).toBe(400)
    })

    it('레거시 호환: message는 기존 문자열을 유지한다', () => {
      // 아직 마이그레이션하지 않은 catch가 `error.message === 'Unauthorized'`로 식별
      expect(new UnauthorizedError().message).toBe('Unauthorized')
      expect(new ForbiddenError().message).toBe('Forbidden')
    })

    it('publicMessage는 커스터마이즈 가능하다', () => {
      expect(new ForbiddenError('관리자 권한이 필요합니다.').publicMessage).toBe(
        '관리자 권한이 필요합니다.'
      )
      // 식별용 message는 그대로 'Forbidden'
      expect(new ForbiddenError('관리자 권한이 필요합니다.').message).toBe(
        'Forbidden'
      )
    })

    it('instanceof로 식별 가능하다', () => {
      const err = new UnauthorizedError()
      expect(err).toBeInstanceOf(ApiError)
      expect(err).toBeInstanceOf(Error)
    })
  })

  describe('statusForError', () => {
    it('ApiError는 자신의 status를 반환한다', () => {
      expect(statusForError(new NotFoundError())).toBe(404)
    })
    it('ZodError는 400', () => {
      const zerr = z.string().safeParse(1)
      expect(statusForError((zerr as any).error)).toBe(400)
    })
    it('레거시 문자열 에러를 매핑한다', () => {
      expect(statusForError(new Error('Unauthorized'))).toBe(401)
      expect(statusForError(new Error('Forbidden'))).toBe(403)
    })
    it('알 수 없는 에러는 500', () => {
      expect(statusForError(new Error('boom'))).toBe(500)
    })
  })

  describe('errorResponse', () => {
    it('ApiError → status + publicMessage', async () => {
      const res = errorResponse(new ForbiddenError('관리자 권한이 필요합니다.'))
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ error: '관리자 권한이 필요합니다.' })
    })

    it('ZodError → 400 + 첫 번째 메시지', async () => {
      const schema = z.object({ title: z.string().min(1, '제목을 입력해주세요.') })
      const parsed = schema.safeParse({ title: '' })
      const res = errorResponse((parsed as any).error)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: '제목을 입력해주세요.' })
    })

    it('레거시 Error("Unauthorized") → 401', async () => {
      const res = errorResponse(new Error('Unauthorized'))
      expect(res.status).toBe(401)
    })

    it('알 수 없는 에러 → 500 + fallback', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const res = errorResponse(new Error('boom'), '게시물 오류')
      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: '게시물 오류' })
      spy.mockRestore()
    })
  })
})

describe('api/pagination', () => {
  describe('parsePaginationParams', () => {
    it('URLSearchParams에서 page/limit를 파싱한다', () => {
      const p = parsePaginationParams(
        new URLSearchParams('page=3&limit=10')
      )
      expect(p).toEqual({ page: 3, limit: 10, skip: 20 })
    })

    it('값이 없으면 기본값(page=1, limit=20)', () => {
      expect(parsePaginationParams(new URLSearchParams())).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      })
    })

    it('limit는 maxLimit(기본 100)으로 상한 제한', () => {
      expect(parsePaginationParams(new URLSearchParams('limit=500')).limit).toBe(
        100
      )
    })

    it('잘못된/음수 값은 기본값으로 보정', () => {
      expect(parsePaginationParams(new URLSearchParams('page=0&limit=-5'))).toEqual(
        { page: 1, limit: 20, skip: 0 }
      )
      expect(parsePaginationParams(new URLSearchParams('page=abc'))).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      })
    })

    it('객체 형태 입력도 지원한다', () => {
      expect(parsePaginationParams({ page: '2', limit: '5' })).toEqual({
        page: 2,
        limit: 5,
        skip: 5,
      })
    })

    it('defaultLimit 옵션을 적용한다', () => {
      expect(
        parsePaginationParams(new URLSearchParams(), { defaultLimit: 12 }).limit
      ).toBe(12)
    })
  })

  describe('buildPaginationMeta', () => {
    it('hasMore = skip + returnedCount < total', () => {
      // page 1, limit 20, 20개 반환, total 50 → 더 있음
      expect(
        buildPaginationMeta({ page: 1, limit: 20, total: 50, returnedCount: 20 })
      ).toEqual({ page: 1, limit: 20, total: 50, hasMore: true })
    })

    it('마지막 페이지는 hasMore=false', () => {
      // page 3, limit 20, skip 40, 10개 반환, total 50 → 40+10=50, 50<50=false
      expect(
        buildPaginationMeta({ page: 3, limit: 20, total: 50, returnedCount: 10 })
      ).toEqual({ page: 3, limit: 20, total: 50, hasMore: false })
    })

    it('빈 결과는 hasMore=false', () => {
      expect(
        buildPaginationMeta({ page: 1, limit: 20, total: 0, returnedCount: 0 })
      ).toEqual({ page: 1, limit: 20, total: 0, hasMore: false })
    })
  })
})

describe('api/with-route-handler', () => {
  it('정상 응답은 그대로 통과시킨다', async () => {
    const handler = withRouteHandler(async () => {
      const { NextResponse } = await import('next/server')
      return NextResponse.json({ ok: true })
    })
    const res = await handler()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('던져진 ApiError를 표준 응답으로 변환한다', async () => {
    const handler = withRouteHandler(async () => {
      throw new ForbiddenError('관리자 권한이 필요합니다.')
    })
    const res = await handler()
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: '관리자 권한이 필요합니다.' })
  })

  it('핸들러 인자를 그대로 전달한다', async () => {
    const handler = withRouteHandler(async (a: number, b: number) => {
      const { NextResponse } = await import('next/server')
      return NextResponse.json({ sum: a + b })
    })
    const res = await handler(2, 3)
    expect(await res.json()).toEqual({ sum: 5 })
  })

  it('알 수 없는 에러는 fallbackMessage로 500', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = withRouteHandler(async () => {
      throw new Error('boom')
    }, '실패했습니다.')
    const res = await handler()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: '실패했습니다.' })
    spy.mockRestore()
  })
})
