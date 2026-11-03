import { z } from 'zod'
import { isReservedMenuSlug } from './reserved-slugs'

/**
 * 사이드 메뉴 관리(HTML 메뉴) 공용 스키마·상수.
 * 서버(API)·클라이언트(관리 화면) 공용. 계획: docs/MENU_ADMIN_구현계획.md
 */

/** 관리자 업로드 HTML을 표시하는 메뉴의 Category.pageType */
export const HTML_MENU_PAGE_TYPE = 'html'

/** 업로드 HTML 최대 크기 (8MB) — proxy 요청 본문 기본 상한(10MB, proxyClientMaxBodySize)보다 여유 있게 */
export const MENU_HTML_MAX_BYTES = 8 * 1024 * 1024

/** 메뉴 관리 대상 섹션 (TOOLBOX·LABs·ADMIN은 코드 하드코딩이라 제외) */
export const MENU_SECTION_TYPES = ['WORK', 'SOURCE', 'TEMPLATE', 'BROCHURE', 'INSIGHTS'] as const
export type MenuSectionType = (typeof MENU_SECTION_TYPES)[number]

export const MENU_SLUG_MAX_LENGTH = 50
export const MENU_NAME_MAX_LENGTH = 40

export const menuSectionSchema = z.enum(MENU_SECTION_TYPES, {
  errorMap: () => ({ message: '섹션을 선택해주세요.' }),
})

export const menuNameSchema = z
  .string()
  .trim()
  .min(1, '메뉴 이름을 입력해주세요.')
  .max(MENU_NAME_MAX_LENGTH, `메뉴 이름은 ${MENU_NAME_MAX_LENGTH}자 이하로 입력해주세요.`)

export const menuSlugSchema = z
  .string()
  .trim()
  .min(1, '주소(slug)를 입력해주세요.')
  .max(MENU_SLUG_MAX_LENGTH, `주소(slug)는 ${MENU_SLUG_MAX_LENGTH}자 이하로 입력해주세요.`)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '주소(slug)는 영문 소문자·숫자와 하이픈(-)만 사용할 수 있습니다.')
  .refine((slug) => !isReservedMenuSlug(slug), '사이트에서 이미 쓰는 주소라 사용할 수 없습니다.')

/** HTML 메뉴 생성 (multipart의 텍스트 필드) */
export const createHtmlMenuSchema = z.object({
  name: menuNameSchema,
  slug: menuSlugSchema,
  type: menuSectionSchema,
})

/** 메뉴 수정 — 섹션 이동은 HTML 메뉴만 (API에서 검사) */
export const updateMenuSchema = z
  .object({
    name: menuNameSchema.optional(),
    type: menuSectionSchema.optional(),
    isHidden: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), '변경할 항목이 없습니다.')

/** 섹션 안 순서 변경 — ids는 해당 섹션의 메뉴 전체를 새 순서대로 */
export const reorderMenusSchema = z.object({
  type: menuSectionSchema,
  ids: z.array(z.string().min(1)).min(1, '메뉴 목록이 비어 있습니다.'),
})

/** HTML 메뉴의 Category.config */
export const htmlMenuConfigSchema = z.object({
  html: z.object({
    /** Storage 주소 — 브라우저에 노출하지 않는다 */
    url: z.string().min(1),
    fileName: z.string(),
    size: z.number().int().nonnegative(),
    /** ISO 문자열. iframe 주소의 캐시 무효화 버전으로도 쓴다 */
    updatedAt: z.string(),
  }),
})
export type HtmlMenuConfig = z.infer<typeof htmlMenuConfigSchema>

export function parseHtmlMenuConfig(config: unknown): HtmlMenuConfig | null {
  const parsed = htmlMenuConfigSchema.safeParse(config)
  return parsed.success ? parsed.data : null
}

export function isHtmlMenu(category: { pageType?: string | null }): boolean {
  return category.pageType === HTML_MENU_PAGE_TYPE
}

export function isMenuSectionType(type: string): type is MenuSectionType {
  return (MENU_SECTION_TYPES as readonly string[]).includes(type)
}

/** 관리 화면·관리자 API 응답용 메뉴 (Storage 주소 제외) */
export interface AdminMenu {
  id: string
  name: string
  slug: string
  type: MenuSectionType
  pageType: string | null
  order: number
  isHidden: boolean
  /** true면 관리자 HTML 메뉴(삭제·섹션 이동·HTML 교체 가능), false면 기존 메뉴(숨김만) */
  isHtml: boolean
  html: { fileName: string; size: number; updatedAt: string } | null
}
