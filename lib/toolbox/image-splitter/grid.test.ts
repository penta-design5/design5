import { describe, expect, it } from 'vitest'
import { GRID_SHAPES, PIECE_COUNTS, computePieces, edgesOf, equalLines, gridSummary, pieceFileName } from './grid'

describe('격자 모양 — 항상 가로 기준 고정', () => {
  it('2 = 2×1, 4 = 2×2, 8 = 4×2, 16 = 4×4', () => {
    expect(GRID_SHAPES[2]).toEqual({ cols: 2, rows: 1 })
    expect(GRID_SHAPES[4]).toEqual({ cols: 2, rows: 2 })
    expect(GRID_SHAPES[8]).toEqual({ cols: 4, rows: 2 })
    expect(GRID_SHAPES[16]).toEqual({ cols: 4, rows: 4 })
  })

  it('균등 분할선 비율', () => {
    expect(equalLines(2)).toEqual({ xs: [0.5], ys: [] })
    expect(equalLines(8)).toEqual({ xs: [0.25, 0.5, 0.75], ys: [0.5] })
  })
})

describe('computePieces', () => {
  it.each(PIECE_COUNTS)('%s분할: 조각이 빈틈·겹침 없이 전체를 덮는다 (홀수 크기 409×416)', (count) => {
    const size = { width: 409, height: 416 }
    const pieces = computePieces(size, equalLines(count), 'row')
    expect(pieces).toHaveLength(count)
    expect(pieces.reduce((sum, p) => sum + p.width * p.height, 0)).toBe(409 * 416)
    for (const p of pieces) {
      expect(Number.isInteger(p.x) && Number.isInteger(p.width)).toBe(true)
      expect(p.width).toBeGreaterThan(0)
      expect(p.x + p.width).toBeLessThanOrEqual(409)
      expect(p.y + p.height).toBeLessThanOrEqual(416)
    }
  })

  it('4분할 409×416 → 가로 205/204, 세로 208/208', () => {
    const pieces = computePieces({ width: 409, height: 416 }, equalLines(4), 'row')
    expect(pieces.map((p) => [p.x, p.y, p.width, p.height])).toEqual([
      [0, 0, 205, 208],
      [205, 0, 204, 208],
      [0, 208, 205, 208],
      [205, 208, 204, 208],
    ])
  })

  it('가로 우선 = 1 2 / 3 4, 세로 우선 = 1 3 / 2 4', () => {
    const size = { width: 400, height: 300 }
    const at = (order: 'row' | 'column') =>
      computePieces(size, equalLines(4), order).map((p) => `${p.index}:${p.row}${p.col}`)
    expect(at('row')).toEqual(['1:00', '2:01', '3:10', '4:11'])
    expect(at('column')).toEqual(['1:00', '2:10', '3:01', '4:11'])
  })

  it('8분할 세로 우선: 열 단위로 번호(위→아래)', () => {
    const pieces = computePieces({ width: 400, height: 200 }, equalLines(8), 'column')
    expect(pieces.slice(0, 4).map((p) => [p.row, p.col])).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
  })
})

describe('edgesOf — 반올림 후에도 오름차순·최소 1px', () => {
  it('선이 겹치거나 가장자리에 붙어도 조각은 1px 이상', () => {
    expect(edgesOf([0.5, 0.5, 0.5], 10)).toEqual([0, 5, 6, 7, 10])
    expect(edgesOf([0, 1], 5)).toEqual([0, 1, 4, 5])
    expect(edgesOf([0.5], 2)).toEqual([0, 1, 2])
  })
})

describe('파일명·요약', () => {
  it('최소 2자리 번호', () => {
    expect(pieceFileName('photo', 1, 4, 'png')).toBe('photo_01.png')
    expect(pieceFileName('photo', 16, 16, 'jpg')).toBe('photo_16.jpg')
  })

  it('하단 요약', () => {
    expect(gridSummary(4)).toBe('가로 2 × 세로 2 · 4조각')
    expect(gridSummary(8)).toBe('가로 4 × 세로 2 · 8조각')
  })
})
