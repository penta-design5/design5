/**
 * ICON+ anchor 좌표 계산 공용 헬퍼 (순수 함수, icon-merger 이식)
 *
 * 업로드 다이얼로그(신규 등록)와 anchor 편집 다이얼로그(기존 MAIN 재편집)가 공유한다.
 */

/** 값을 [min, max] 범위로 제한한다. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** anchor 좌표를 0.5 단위로 반올림한 문자열로 포맷한다. */
export function formatCoordinate(value: number): string {
  return Number((Math.round(value * 2) / 2).toFixed(1)).toString()
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
