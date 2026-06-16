/**
 * 접근 제어 관련 이메일/도메인 규칙의 단일 출처.
 *
 * 이전에는 동일한 이메일/도메인 하드코딩이 여러 모듈에 흩어져 있었다:
 * - `lib/privileged-admin.ts` (tiper@pentasecurity.com)
 * - `lib/design-system-access.ts` (tiper@pentasecurity.com)
 * - `lib/auth.ts` / `app/api/auth/register/route.ts` (@pentasecurity.com 도메인 체크)
 *
 * 여기로 집약하여 한 곳만 수정하면 되도록 한다.
 */

/** 회원가입/로그인이 허용되는 사내 이메일 도메인 */
export const PENTA_EMAIL_DOMAIN = '@pentasecurity.com'

/** 사내 이메일 도메인 여부 (대소문자 무시) */
export function isPentaEmail(email: string | null | undefined): boolean {
  return (email ?? '').toLowerCase().endsWith(PENTA_EMAIL_DOMAIN)
}

/** 로그인 화면의 이메일/비밀번호 영역 표시 설정을 변경할 수 있는 계정 */
export const PRIVILEGED_LOGIN_SETTINGS_EMAIL = 'tiper@pentasecurity.com'

export function isPrivilegedLoginSettingsEmail(
  email: string | null | undefined
): boolean {
  return (email ?? '').toLowerCase() === PRIVILEGED_LOGIN_SETTINGS_EMAIL
}

/**
 * 디자인 시스템 페이지(/admin/design-system) 접근 허용 이메일 목록.
 * 이 목록에 있는 이메일을 가진 사용자만 사이드바 메뉴가 보이고 페이지에 접근할 수 있습니다.
 * 필요 시 이메일을 추가하세요.
 */
export const ALLOWED_DESIGN_SYSTEM_EMAILS: string[] = [
  'tiper@pentasecurity.com',
]

export function canAccessDesignSystem(
  email: string | null | undefined
): boolean {
  if (!email) return false
  return ALLOWED_DESIGN_SYSTEM_EMAILS.includes(email.toLowerCase())
}
