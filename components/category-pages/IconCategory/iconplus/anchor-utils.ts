/**
 * ICON+ anchor / 절단 원 좌표 계산 공용 헬퍼 (순수 함수, icon-merger 이식)
 *
 * 업로드 다이얼로그(신규 등록)와 프리셋 편집 다이얼로그(MAIN 마스킹 프리셋)가 공유한다.
 */

/** 값을 [min, max] 범위로 제한한다. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** anchor 좌표를 0.5 단위로 반올림한 문자열로 포맷한다. */
export function formatCoordinate(value: number): string {
  return Number((Math.round(value * 2) / 2).toFixed(1)).toString()
}

/**
 * 프리셋 편집 스테이지가 아이콘 박스 주위에 두는 여백 비율.
 * 절단 원과 앵커를 아이콘 **밖으로도** 끌어낼 수 있어야 한다(상단 오버플로 프리셋).
 */
export const STAGE_PADDING_RATIO = 0.25

/**
 * 여백 프레임까지 확장한 범위로 좌표를 제한한다.
 * 기존 `[min, min + size]` → `[min - 0.25·size, min + 1.25·size]`.
 */
export function clampToExtendedRange(
  value: number,
  min: number,
  size: number,
  paddingRatio: number = STAGE_PADDING_RATIO
): number {
  return clamp(value, min - size * paddingRatio, min + size * (1 + paddingRatio))
}

/**
 * viewBox 문자열에서 좌표계 사각형을 읽는다.
 * anchor·절단 원은 **원본 viewBox 좌표계** 값이므로(merge-svg가 `min`을 차감) min을 함께 본다.
 * 파싱 불가 시 width/height 기반 `0 0 W H`로 대체한다.
 */
export function readViewBoxRect(
  viewBox: string | null | undefined,
  fallback: { width: number; height: number }
): { minX: number; minY: number; width: number; height: number } {
  if (viewBox) {
    const values = viewBox.trim().split(/[\s,]+/).map(Number)
    if (
      values.length === 4 &&
      values.every((value) => Number.isFinite(value)) &&
      values[2] > 0 &&
      values[3] > 0
    ) {
      return { minX: values[0], minY: values[1], width: values[2], height: values[3] }
    }
  }
  return { minX: 0, minY: 0, width: fallback.width, height: fallback.height }
}

/** object-contain으로 렌더된 미디어의 실제 화면 사각형(레터박스 보정)을 계산한다. */
export function getContainedRect(
  containerRect: DOMRect,
  mediaSize: { width: number; height: number }
): { left: number; top: number; width: number; height: number } {
  const containerRatio = containerRect.width / containerRect.height
  const mediaRatio = mediaSize.width / mediaSize.height

  if (mediaRatio > containerRatio) {
    const height = containerRect.width / mediaRatio
    return {
      left: containerRect.left,
      top: containerRect.top + (containerRect.height - height) / 2,
      width: containerRect.width,
      height,
    }
  }

  const width = containerRect.height * mediaRatio
  return {
    left: containerRect.left + (containerRect.width - width) / 2,
    top: containerRect.top,
    width,
    height: containerRect.height,
  }
}
