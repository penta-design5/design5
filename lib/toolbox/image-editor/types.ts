import type { Annotation } from './annotations'

/**
 * 편집 문서 스냅샷 (히스토리 1단계 = EditorDoc 1개).
 * canvas·annotations는 불변으로 취급한다 — 편집은 항상 새 캔버스/새 배열을 만들어 교체한다.
 * P5(워터마크)에서 필드가 추가된다.
 */
export interface EditorDoc {
  /** 베이스 이미지(원본 해상도 래스터) */
  canvas: HTMLCanvasElement
  width: number
  height: number
  /** 주석(그리기·도형·텍스트) — 아래에서 위 순서 */
  annotations: Annotation[]
}

export const createEditorDoc = (canvas: HTMLCanvasElement, annotations: Annotation[] = []): EditorDoc => ({
  canvas,
  width: canvas.width,
  height: canvas.height,
  annotations,
})
