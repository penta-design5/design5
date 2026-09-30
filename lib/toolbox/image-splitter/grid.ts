/**
 * 이미지 분할 격자 계산(순수 로직) — docs/TOOLBOX_image-splitter_handoff.md §1 D2
 * - 격자 모양은 조각 수로 고정(항상 가로 기준): 2 = 2×1, 4 = 2×2, 8 = 4×2, 16 = 4×4
 * - 「배치」는 번호(저장) 순서: 가로 우선(왼쪽 위 → 오른쪽 → 다음 줄) / 세로 우선(왼쪽 위 → 아래 → 다음 열)
 * - 분할선 위치는 비율(0~1)로 보관 → 사진 크기가 바뀌어도 같은 상대 위치. 조각 좌표는 정수 px(빈틈·겹침 없음)
 */

import type { Size } from '../common/canvas'

export type PieceCount = 2 | 4 | 8 | 16
export type SplitOrder = 'row' | 'column'

export const PIECE_COUNTS: PieceCount[] = [2, 4, 8, 16]
export const DEFAULT_PIECE_COUNT: PieceCount = 4
export const DEFAULT_SPLIT_ORDER: SplitOrder = 'row'

export const GRID_SHAPES: Record<PieceCount, { cols: number; rows: number }> = {
  2: { cols: 2, rows: 1 },
  4: { cols: 2, rows: 2 },
  8: { cols: 4, rows: 2 },
  16: { cols: 4, rows: 4 },
}

export const SPLIT_ORDER_OPTIONS: { value: SplitOrder; label: string; hint: string }[] = [
  { value: 'row', label: '가로 우선 · 좌우로', hint: '왼쪽 위부터 오른쪽으로, 다음 줄 순서로 저장합니다.' },
  { value: 'column', label: '세로 우선 · 위아래로', hint: '왼쪽 위부터 아래로, 다음 열 순서로 저장합니다.' },
]

/** 분할선 위치(비율). xs = 세로선(왼쪽→오른쪽, cols-1개), ys = 가로선(위→아래, rows-1개) */
export interface SplitLines {
  xs: number[]
  ys: number[]
}

/** 조각 1개 — 좌표는 정수 px. index = 저장·표시 번호(1부터) */
export interface Piece {
  index: number
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
}

/** 균등 분할선 */
export function equalLines(count: PieceCount): SplitLines {
  const { cols, rows } = GRID_SHAPES[count]
  const fractions = (n: number) => Array.from({ length: n - 1 }, (_, i) => (i + 1) / n)
  return { xs: fractions(cols), ys: fractions(rows) }
}

/** 비율 → 정수 경계 [0, ..., length]. 반올림 후에도 오름차순·최소 1px 간격을 보장 */
export function edgesOf(fractions: number[], length: number): number[] {
  const edges = [0]
  const inner = fractions.length
  fractions.forEach((f, i) => {
    const min = edges[i] + 1
    const max = length - (inner - i) // 뒤에 남은 선들이 1px씩은 차지할 수 있게
    edges.push(Math.min(max, Math.max(min, Math.round(f * length))))
  })
  edges.push(length)
  return edges
}

/** 분할선 + 사진 크기 → 조각 목록(저장 순서대로, index 1부터) */
export function computePieces(size: Size, lines: SplitLines, order: SplitOrder): Piece[] {
  const xEdges = edgesOf(lines.xs, size.width)
  const yEdges = edgesOf(lines.ys, size.height)
  const cols = xEdges.length - 1
  const rows = yEdges.length - 1
  const cells: Omit<Piece, 'index'>[] = []
  if (order === 'row') {
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) cells.push(cell(row, col))
  } else {
    for (let col = 0; col < cols; col++) for (let row = 0; row < rows; row++) cells.push(cell(row, col))
  }
  return cells.map((c, i) => ({ ...c, index: i + 1 }))

  function cell(row: number, col: number) {
    return {
      row,
      col,
      x: xEdges[col],
      y: yEdges[row],
      width: xEdges[col + 1] - xEdges[col],
      height: yEdges[row + 1] - yEdges[row],
    }
  }
}

/** 조각 파일명: `이름_01.png` (조각 수에 맞춰 최소 2자리) */
export function pieceFileName(baseName: string, index: number, total: number, ext: string): string {
  const digits = Math.max(2, String(total).length)
  return `${baseName}_${String(index).padStart(digits, '0')}.${ext}`
}

/** 하단 요약 문구 */
export function gridSummary(count: PieceCount): string {
  const { cols, rows } = GRID_SHAPES[count]
  return `가로 ${cols} × 세로 ${rows} · ${count}조각`
}
