/**
 * HTML 메뉴 slug로 쓸 수 없는 최상위 경로.
 * `/[slug]`보다 우선하는 app/ 고정 라우트와 public/ 최상위 폴더가 겹치면 메뉴가 열리지 않는다.
 * lib/__tests__/menu-reserved-slugs.test.ts가 실제 디렉터리 목록과 대조해 누락을 막는다.
 * 계획: docs/MENU_ADMIN_구현계획.md §3.6
 */
export const RESERVED_MENU_SLUGS: ReadonlySet<string> = new Set([
  // app/ 최상위
  'api',
  'notice',
  // app/(auth)
  'login',
  'register',
  'error',
  // app/(dashboard)
  'admin',
  'chart-generator',
  'diagram',
  'edm',
  'pdf-extractor',
  'penta-design-system',
  'profile',
  'toolbox',
  // public/ 최상위 폴더
  'edm-guide',
  'font',
  'img',
  'js',
  'licenses',
  'tool-models',
])

export function isReservedMenuSlug(slug: string): boolean {
  return RESERVED_MENU_SLUGS.has(slug)
}
