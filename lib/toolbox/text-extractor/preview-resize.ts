/**
 * 화면 미리보기 크기 변경 알림 — 렌더러가 그린 뒤 내용이 바뀌면(Excel 시트 탭 전환 등) 보낸다.
 * `OfficeVisualPreview`가 받아 폭 맞춤을 다시 하고, `resetScroll`이면 미리보기 영역을 맨 위·왼쪽으로 돌린다.
 */
export const PREVIEW_RESIZE_EVENT = 'ocr-preview-resize'

export interface PreviewResizeDetail {
  resetScroll?: boolean
}

export function notifyPreviewResize(from: Element, detail: PreviewResizeDetail = {}): void {
  from.dispatchEvent(new CustomEvent<PreviewResizeDetail>(PREVIEW_RESIZE_EVENT, { bubbles: true, detail }))
}
