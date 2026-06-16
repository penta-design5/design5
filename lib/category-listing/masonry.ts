/**
 * Masonry(Pinterest 스타일) 레이아웃 계산용 순수 함수.
 * DOM/React 비의존 → 단위 테스트 가능. 훅(use-masonry-layout)에서 사용.
 */

/** 컨테이너 너비에 들어갈 수 있는 열 개수 (최소 1) */
export function computeColumnCount(
  containerWidth: number,
  cardWidth: number,
  gap = 8
): number {
  return Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)))
}

/**
 * 카드들을 가장 짧은 열에 차례로 채워 numColumns 개의 열로 분배.
 * 원본 DamoListPage의 calculateColumns 동작을 그대로 옮긴 것.
 */
export function distributeIntoColumns<T>(items: T[], numColumns: number): T[][] {
  const columns: T[][] = Array(Math.max(1, numColumns))
    .fill(null)
    .map(() => [])

  items.forEach((item) => {
    // 가장 짧은 열의 인덱스 찾기
    const shortestColumnIndex = columns.reduce(
      (minIndex, column, i) =>
        column.length < columns[minIndex].length ? i : minIndex,
      0
    )
    columns[shortestColumnIndex].push(item)
  })

  return columns
}
