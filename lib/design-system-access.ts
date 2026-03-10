/**
 * 디자인 시스템 페이지(/admin/design-system) 접근 허용 이메일 목록.
 * 이 목록에 있는 이메일을 가진 사용자만 사이드바 메뉴가 보이고 페이지에 접근할 수 있습니다.
 * 필요 시 이메일을 추가하세요.
 */
export const ALLOWED_DESIGN_SYSTEM_EMAILS: string[] = [
  'tiper@pentasecurity.com',
]

export function canAccessDesignSystem(email: string | null | undefined): boolean {
  if (!email) return false
  return ALLOWED_DESIGN_SYSTEM_EMAILS.includes(email.toLowerCase())
}
