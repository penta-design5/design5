/**
 * 인식된 글자 상자를 읽는 순서대로 줄 텍스트로 묶는다 — 순수 함수(Worker·테스트 공용).
 *
 * 방식(XY-cut 변형):
 * 1. 좌우로 충분히 떨어진 빈 띠가 있고 양쪽이 **문단 단(段)**처럼 보이면 세로로 잘라 왼쪽 단부터 읽는다.
 *    단으로 보는 조건: 양쪽 모두 여러 줄이고, 줄마다 상자가 거의 하나(문장 한 줄)이며, 폭이 영역의 일정 비율 이상.
 *    → 표(줄마다 숫자 칸 여러 개)·영수증(좁은 금액 열)은 자르지 않고 행 단위로 읽는다.
 *    (다단 문서도 좌우 줄 높이가 대부분 맞아서 「줄 높이 정렬」로는 표와 구분되지 않았다 — 샘플 02 PoC)
 * 2. 아니면 위아래로 충분히 떨어진 빈 띠마다 가로로 자른다(문단·구역 단위).
 * 3. 더 자를 수 없는 묶음은 세로 위치로 줄을 묶고, 줄 안에서는 왼쪽부터 띄어 쓴다.
 */

export interface TextBox {
  x0: number
  y0: number
  x1: number
  y1: number
  text: string
}

/** 가로로 자르는 빈 띠 최소 높이(줄 높이 중앙값 배수) — 문단 사이 간격 */
const Y_GAP_RATIO = 0.8
/** 세로로 자르는 빈 띠 최소 폭(줄 높이 중앙값 배수) — 다단 사이 간격 */
const X_GAP_RATIO = 1.5
/** 단으로 보려면 양쪽 각각 이 줄 수 이상 */
const COLUMN_MIN_LINES = 2
/** 단으로 보려면 줄당 상자 수가 이 값 이하(표는 줄마다 칸이 여러 개) */
const COLUMN_MAX_BOXES_PER_LINE = 1.5
/** 단으로 보려면 양쪽 폭이 각각 영역 폭의 이 비율 이상(영수증 금액 열처럼 좁은 열 제외) */
const COLUMN_MIN_WIDTH_RATIO = 0.3

const centerY = (b: TextBox) => (b.y0 + b.y1) / 2
const heightOf = (b: TextBox) => b.y1 - b.y0

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/** 한 축으로 투영했을 때 빈 띠(간격)들 */
function gapsAlong(boxes: TextBox[], axis: 'x' | 'y'): { start: number; end: number }[] {
  const spans = boxes
    .map((b) => (axis === 'x' ? [b.x0, b.x1] : [b.y0, b.y1]) as [number, number])
    .sort((a, b) => a[0] - b[0])
  const gaps: { start: number; end: number }[] = []
  let reach = spans[0][1]
  for (const [s, e] of spans.slice(1)) {
    if (s > reach) gaps.push({ start: reach, end: s })
    reach = Math.max(reach, e)
  }
  return gaps
}

/** 세로 위치로 줄을 묶는다(줄 안은 왼쪽부터) */
export function groupLines(boxes: TextBox[]): TextBox[][] {
  const sorted = [...boxes].sort((a, b) => centerY(a) - centerY(b))
  const lines: { cy: number; h: number; items: TextBox[] }[] = []
  for (const b of sorted) {
    const cy = centerY(b)
    const h = heightOf(b)
    const line = lines.find((l) => Math.abs(l.cy - cy) < Math.min(l.h, h) * 0.5)
    if (line) line.items.push(b)
    else lines.push({ cy, h, items: [b] })
  }
  return lines.sort((a, b) => a.cy - b.cy).map((l) => l.items.sort((a, b) => a.x0 - b.x0))
}

const extent = (boxes: TextBox[]) => Math.max(...boxes.map((b) => b.x1)) - Math.min(...boxes.map((b) => b.x0))

/** 빈 띠 양쪽이 각각 문단 단(段)처럼 보이는가 */
function looksLikeColumns(left: TextBox[], right: TextBox[], regionWidth: number): boolean {
  return [left, right].every((side) => {
    if (side.length === 0) return false
    const lines = groupLines(side).length
    return (
      lines >= COLUMN_MIN_LINES &&
      side.length / lines <= COLUMN_MAX_BOXES_PER_LINE &&
      extent(side) >= regionWidth * COLUMN_MIN_WIDTH_RATIO
    )
  })
}

function orderBlocks(boxes: TextBox[], h: number, out: TextBox[][][]) {
  if (boxes.length <= 1) {
    if (boxes.length) out.push(groupLines(boxes))
    return
  }
  // 1) 세로 자르기 — 가장 넓은 빈 띠 하나, 양쪽이 문단 단일 때만
  const xGap = gapsAlong(boxes, 'x')
    .filter((g) => g.end - g.start >= h * X_GAP_RATIO)
    .sort((a, b) => b.end - b.start - (a.end - a.start))[0]
  if (xGap) {
    const left = boxes.filter((b) => b.x1 <= xGap.start)
    const right = boxes.filter((b) => b.x0 >= xGap.end)
    if (looksLikeColumns(left, right, extent(boxes))) {
      orderBlocks(left, h, out)
      orderBlocks(right, h, out)
      return
    }
  }
  // 2) 가로 자르기 — 기준 이상인 빈 띠마다 자른다
  const yCuts = gapsAlong(boxes, 'y').filter((g) => g.end - g.start >= h * Y_GAP_RATIO)
  if (yCuts.length > 0) {
    const bounds = [-Infinity, ...yCuts.map((g) => g.end), Infinity]
    for (let i = 0; i < bounds.length - 1; i++) {
      orderBlocks(boxes.filter((b) => b.y0 >= bounds[i] && b.y0 < bounds[i + 1]), h, out)
    }
    return
  }
  // 3) 더 자를 수 없다
  out.push(groupLines(boxes))
}

/**
 * 상자들을 읽는 순서의 줄 텍스트로 만든다. 묶음(문단·단) 사이는 빈 줄 없이 줄바꿈 하나로 잇는다.
 * 줄 안의 상자는 공백 하나로 잇는다(PDF 텍스트 조각은 `pdf.ts`의 `mergeLineFragments`로 먼저 합친다).
 */
export function layoutText(boxes: TextBox[]): string {
  const valid = boxes.filter((b) => b.text.trim() !== '' && b.x1 > b.x0 && b.y1 > b.y0)
  if (valid.length === 0) return ''
  const h = median(valid.map(heightOf))
  const blocks: TextBox[][][] = []
  orderBlocks(valid, h, blocks)
  return blocks
    .flat()
    .map((line) => line.map((b) => b.text.trim()).join(' '))
    .join('\n')
}
