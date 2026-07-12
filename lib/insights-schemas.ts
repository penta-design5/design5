import { z } from 'zod'

/**
 * INSIGHTS(AI 사용가이드 · 최신 동향) 공용 스키마·상수.
 * 서버(API)·클라이언트(폼) 공용 — 검증 규칙을 한 곳에서 관리한다.
 * 계획: docs/INSIGHTS_구현계획.md
 */

/** 업로드 HTML 최대 크기 (5MB) */
export const INSIGHT_HTML_MAX_BYTES = 5 * 1024 * 1024

/** 허용 HTML 확장자 */
export const INSIGHT_HTML_EXTENSIONS = ['.html', '.htm'] as const

/** 허용 HTML MIME (브라우저가 빈 값/octet-stream을 보낼 수 있어 확장자와 병행 검증) */
export const INSIGHT_HTML_MIME_TYPES = ['text/html'] as const

/** 저장 시 강제할 HTML content-type */
export const INSIGHT_HTML_CONTENT_TYPE = 'text/html; charset=utf-8'

/** 파일명이 허용 HTML 확장자인지 */
export function hasHtmlExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return INSIGHT_HTML_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/**
 * AI 사용가이드 카드 그라데이션 우하단 프리셋 색상.
 * 좌상단은 흰색 고정, 우하단만 선택. Penta Design System의
 * Success/Warning/Error/Info(500·700) 8색. (`public/penta-design-system`)
 * 값 없음(null)이면 기본 중립색으로 렌더.
 */
export const INSIGHT_CARD_COLOR_PRESETS = [
  { label: 'Success', value: '#22C55E' },
  { label: 'Success Dark', value: '#15803D' },
  { label: 'Warning', value: '#F59E0B' },
  { label: 'Warning Dark', value: '#B45309' },
  { label: 'Error', value: '#EF4444' },
  { label: 'Error Dark', value: '#B91C1C' },
  { label: 'Info', value: '#3B82F6' },
  { label: 'Info Dark', value: '#1D4ED8' },
] as const

/** 프리셋 HEX 값 집합 (검증용) */
export const INSIGHT_CARD_COLOR_VALUES = INSIGHT_CARD_COLOR_PRESETS.map(
  (c) => c.value
) as readonly string[]

/** 카드 그라데이션 우하단 기본 색(프리셋 미선택 시) */
export const INSIGHT_CARD_DEFAULT_COLOR = '#F7F8FA'

/** 카드 색 검증: 빈 문자열(기본) 또는 프리셋 중 하나 */
const cardColorField = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || INSIGHT_CARD_COLOR_VALUES.includes(v),
    '유효한 카드 색상이 아닙니다.'
  )
  .optional()

/** 생성 시 텍스트 필드 검증 (파일은 라우트에서 별도 검증) */
export const insightCreateFieldsSchema = z.object({
  categoryId: z.string().min(1, '카테고리가 필요합니다.'),
  title: z.string().trim().min(1, '제목을 입력해주세요.'),
  description: z
    .string()
    .trim()
    .max(500, '설명은 500자 이내로 입력해주세요.')
    .optional()
    .or(z.literal('')),
  cardColor: cardColorField,
})

/** 수정 시 텍스트 필드 검증 (모두 선택) */
export const insightUpdateFieldsSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요.').optional(),
  description: z
    .string()
    .trim()
    .max(500, '설명은 500자 이내로 입력해주세요.')
    .optional()
    .or(z.literal('')),
  cardColor: cardColorField,
})

/** 목록/상세 응답 DTO (클라이언트 공용) */
export interface InsightPostDTO {
  id: string
  categoryId: string
  title: string
  description: string | null
  htmlUrl: string
  htmlFileName: string
  htmlFileSize: number
  thumbnailUrl: string | null
  cardColor: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    name: string | null
    email: string
  }
}

export interface InsightPostListResponse {
  items: InsightPostDTO[]
  total: number
  page: number
  pageSize: number
}
