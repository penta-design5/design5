/**
 * 자기완결형 단일 HTML 문서 업로드 공용 규칙 (INSIGHTS 문서 · 메뉴 관리 HTML 메뉴).
 * 서버(API)·클라이언트(폼) 공용 — 외부 의존 없음.
 */

/** 허용 HTML 확장자 */
export const HTML_DOCUMENT_EXTENSIONS = ['.html', '.htm'] as const

/** 저장·응답 시 강제할 HTML content-type */
export const HTML_DOCUMENT_CONTENT_TYPE = 'text/html; charset=utf-8'

/** 파일명이 허용 HTML 확장자인지 */
export function hasHtmlExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return HTML_DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/**
 * 업로드 HTML 파일 검증 (확장자 + MIME + 크기).
 * 문제가 있으면 사용자 표시용 메시지, 없으면 null.
 */
export function getHtmlFileError(
  file: { name: string; type: string; size: number },
  maxBytes: number
): string | null {
  if (!hasHtmlExtension(file.name)) {
    return 'HTML 문서(.html) 파일만 업로드할 수 있습니다.'
  }
  // 브라우저가 text/html 외 빈 값/octet-stream을 보낼 수 있어 확장자를 우선하되,
  // 명백히 다른 타입(image/*, application/pdf 등)은 거부한다.
  const type = (file.type || '').toLowerCase()
  if (type && type !== 'text/html') {
    return 'HTML 문서(text/html)만 업로드할 수 있습니다.'
  }
  if (file.size <= 0) {
    return '빈 파일은 업로드할 수 없습니다.'
  }
  if (file.size > maxBytes) {
    return `HTML 문서는 ${Math.round(maxBytes / 1024 / 1024)}MB 이하만 업로드할 수 있습니다.`
  }
  return null
}
