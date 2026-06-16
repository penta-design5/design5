/**
 * 페이지네이션 쿼리 파싱 + 메타데이터 생성용 순수 함수.
 * DB/Next 비의존 → 단위 테스트 가능.
 *
 * 응답 envelope 키(`posts`/`templates`/...)는 라우트마다 다르므로 여기서 강제하지 않고,
 * 공통인 `pagination` 메타 객체 형태(`{ page, limit, total, hasMore }`)만 표준화한다.
 */

export interface PaginationParams {
  page: number
  limit: number
  /** (page-1)*limit */
  skip: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

interface ParseOptions {
  defaultLimit?: number
  maxLimit?: number
}

/**
 * URLSearchParams(또는 page/limit 문자열)에서 페이지네이션 파라미터를 파싱한다.
 * 잘못된 값은 기본값으로 보정 (page>=1, 1<=limit<=maxLimit).
 */
export function parsePaginationParams(
  source: URLSearchParams | { page?: string | null; limit?: string | null },
  { defaultLimit = 20, maxLimit = 100 }: ParseOptions = {}
): PaginationParams {
  const rawPage =
    source instanceof URLSearchParams ? source.get('page') : source.page
  const rawLimit =
    source instanceof URLSearchParams ? source.get('limit') : source.limit

  const parsedPage = parseInt(rawPage ?? '', 10)
  const parsedLimit = parseInt(rawLimit ?? '', 10)

  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1
  let limit =
    Number.isFinite(parsedLimit) && parsedLimit >= 1 ? parsedLimit : defaultLimit
  if (limit > maxLimit) limit = maxLimit

  return { page, limit, skip: (page - 1) * limit }
}

/**
 * 페이지네이션 메타를 생성한다.
 * hasMore = skip + (이번 페이지 항목 수) < total
 */
export function buildPaginationMeta({
  page,
  limit,
  total,
  returnedCount,
}: {
  page: number
  limit: number
  total: number
  /** 이번 페이지에서 실제 반환된 항목 수 */
  returnedCount: number
}): PaginationMeta {
  const skip = (page - 1) * limit
  return {
    page,
    limit,
    total,
    hasMore: skip + returnedCount < total,
  }
}
