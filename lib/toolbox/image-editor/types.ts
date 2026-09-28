/**
 * 편집 문서 스냅샷 (히스토리 1단계 = EditorDoc 1개).
 * canvas는 불변으로 취급한다 — 편집은 항상 새 캔버스를 만들어 교체한다.
 * P4(주석)·P5(워터마크)에서 필드가 추가된다.
 */
export interface EditorDoc {
  /** 베이스 이미지(원본 해상도 래스터) */
  canvas: HTMLCanvasElement
  width: number
  height: number
}

export const createEditorDoc = (canvas: HTMLCanvasElement): EditorDoc => ({
  canvas,
  width: canvas.width,
  height: canvas.height,
})
