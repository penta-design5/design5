/** 로그인 화면 이메일/비밀번호 영역 표시 여부를 설정할 수 있는 계정 */
export const PRIVILEGED_LOGIN_SETTINGS_EMAIL = 'tiper@pentasecurity.com'

export function isPrivilegedLoginSettingsEmail(
  email: string | null | undefined
): boolean {
  return (email ?? '').toLowerCase() === PRIVILEGED_LOGIN_SETTINGS_EMAIL
}
