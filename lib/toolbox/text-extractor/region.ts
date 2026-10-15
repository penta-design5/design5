/**
 * 영역 지정·인식 상자 표시 — 순수 함수(테스트 가능).
 * 좌표는 **0~1 정규화**로 다룬다 — 미리보기(PDF 1,600px)와 OCR(2,400px)의 해상도가 달라도 같은 위치를 가리키도록.
 */

export interface NormRect {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface PixelRect {
  x: number
  y: number
  width: number
  height: number
}

/** 이보다 작은 선택(원본 px)은 영역으로 보지 않는다 — 클릭 실수 방지, 인식 최소 크기 */
export const MIN_REGION_PX = 8

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** 드래그 시작·끝 점(정규화) → 정규화 사각형(방향 무관, 0~1로 자름) */
export function rectFromDrag(a: { x: number; y: number }, b: { x: number; y: number }): NormRect {
  return {
    x0: clamp01(Math.min(a.x, b.x)),
    y0: clamp01(Math.min(a.y, b.y)),
    x1: clamp01(Math.max(a.x, b.x)),
    y1: clamp01(Math.max(a.y, b.y)),
  }
}

/** 정규화 사각형 → 원본 픽셀 사각형(바깥쪽으로 반올림, 이미지 안으로 자름) */
export function toPixelRect(rect: NormRect, width: number, height: number): PixelRect {
  const x = Math.max(0, Math.floor(rect.x0 * width))
  const y = Math.max(0, Math.floor(rect.y0 * height))
  const x1 = Math.min(width, Math.ceil(rect.x1 * width))
  const y1 = Math.min(height, Math.ceil(rect.y1 * height))
  return { x, y, width: Math.max(0, x1 - x), height: Math.max(0, y1 - y) }
}

/** 원본 크기에서 최소 크기 이상인가 */
export function isUsableRegion(rect: NormRect, width: number, height: number): boolean {
  const px = toPixelRect(rect, width, height)
  return px.width >= MIN_REGION_PX && px.height >= MIN_REGION_PX
}

/** 상자 중심이 영역 안에 있는가(정규화 좌표) — PDF 텍스트 레이어에서 영역 안 글자만 고를 때 */
export function centerInside(box: { x0: number; y0: number; x1: number; y1: number }, rect: NormRect): boolean {
  const cx = (box.x0 + box.x1) / 2
  const cy = (box.y0 + box.y1) / 2
  return cx >= rect.x0 && cx <= rect.x1 && cy >= rect.y0 && cy <= rect.y1
}

/** 픽셀 상자 → 정규화 상자 */
export function normalizeBox<T extends { x0: number; y0: number; x1: number; y1: number }>(box: T, width: number, height: number): T {
  return { ...box, x0: box.x0 / width, x1: box.x1 / width, y0: box.y0 / height, y1: box.y1 / height }
}

/** 잘라 낸 영역 안의 정규화 상자 → 전체 이미지 기준 정규화 상자 */
export function mapFromRegion<T extends { x0: number; y0: number; x1: number; y1: number }>(box: T, region: NormRect): T {
  const w = region.x1 - region.x0
  const h = region.y1 - region.y0
  return { ...box, x0: region.x0 + box.x0 * w, x1: region.x0 + box.x1 * w, y0: region.y0 + box.y0 * h, y1: region.y0 + box.y1 * h }
}
