/**
 * Word 화면 미리보기 — docx-preview(Apache-2.0)로 페이지 모양을 그린 뒤 `sanitizePreview`로 정리한다(브라우저 전용).
 * 문서에 든 삽입 HTML(altChunk)은 그리지 않는다(같은 출처 iframe srcdoc으로 그려져 스크립트가 실행될 수 있음).
 */
import { sanitizePreview } from './sanitize-preview'

export async function renderDocxPreview(data: ArrayBuffer, body: HTMLElement, style: HTMLElement): Promise<void> {
  const { renderAsync } = await import('docx-preview')
  await renderAsync(data, body, style, {
    className: 'docx',
    inWrapper: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    renderComments: false,
    renderChanges: false,
    renderAltChunks: false,
    useBase64URL: true,
    experimental: false,
  })
  sanitizePreview(body)
}
