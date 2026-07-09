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
