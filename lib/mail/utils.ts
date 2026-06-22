/** 메일 헬퍼 공용 유틸 — design-request / menu-subscription 알림에서 공유 */

/** app/layout.tsx 의 metadataBase 와 동일한 origin 규칙 */
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL
  if (raw) {
    try {
      return new URL(raw).origin.replace(/\/$/, '')
    } catch {
      return raw.replace(/\/$/, '')
    }
  }
  return 'https://layerary.com'
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 메일 제목용: 줄바꿈·제어문자 제거, 공백 정리, 길이 상한(스레드 묶임·표시 깨짐 완화) */
const SUBJECT_TITLE_MAX_LEN = 70

export function formatTitleForEmailSubject(raw: string): string {
  const s = raw
    .trim()
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
  if (s.length <= SUBJECT_TITLE_MAX_LEN) return s
  return `${s.slice(0, SUBJECT_TITLE_MAX_LEN - 1)}…`
}
