import { describe, expect, it } from 'vitest'
import {
  GRID_SHAPES,
  MIN_PIECE_PX,
  PIECE_COUNTS,
  computePieces,
  edgesOf,
  equalLines,
  fitLines,
  gridSummary,
  isEqualLines,
  minPiecePx,
  moveLine,
  pieceFileName,
} from './grid'

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

describe('moveLine — 정수 px·최소 조각 크기', () => {
  it('정수 px로 맞춰 비율로 저장한다', () => {
    const next = moveLine([0.5], 0, 0.3004, 1000)
    expect(next).toEqual([0.3])
  })

  it('가장자리에서 최소 8px을 남긴다', () => {
    expect(moveLine([0.5], 0, 0, 400)).toEqual([8 / 400])
    expect(moveLine([0.5], 0, 1.2, 400)).toEqual([392 / 400])
  })

  it('이웃 선을 넘거나 붙지 않는다', () => {
    const xs = equalLines(8).xs // 0.25 0.5 0.75
    expect(moveLine(xs, 1, 0.1, 400)).toEqual([0.25, 108 / 400, 0.75])
    expect(moveLine(xs, 1, 0.9, 400)).toEqual([0.25, 292 / 400, 0.75])
  })

  it('옮긴 뒤 조각은 모두 최소 크기 이상이고 전체를 덮는다', () => {
    let xs = equalLines(16).xs
    // 오른쪽 선부터 끝까지 밀기 → 오른쪽 세 조각이 최소 크기
    xs = moveLine(xs, 2, 1, 409)
    xs = moveLine(xs, 1, 1, 409)
    xs = moveLine(xs, 0, 1, 409)
    const pieces = computePieces({ width: 409, height: 100 }, { xs, ys: [] }, 'row')
    expect(pieces.map((p) => p.width)).toEqual([385, 8, 8, 8])
    expect(pieces.reduce((s, p) => s + p.width, 0)).toBe(409)
  })

  it('작은 이미지는 균등 간격이 최소 간격의 상한', () => {
    expect(minPiecePx(20, 3)).toBe(5)
    expect(minPiecePx(3, 3)).toBe(1)
    expect(minPiecePx(1000, 1)).toBe(MIN_PIECE_PX)
  })

  it('바뀐 게 없거나 잘못된 입력이면 같은 배열을 돌려준다', () => {
    const xs = [0.5]
    expect(moveLine(xs, 0, 0.5, 400)).toBe(xs)
    expect(moveLine(xs, 3, 0.2, 400)).toBe(xs)
    expect(moveLine(xs, 0, Number.NaN, 400)).toBe(xs)
  })
})

describe('fitLines — 크기 변경 후 최소 간격 맞춤', () => {
  it('간격을 지키면 같은 배열(비율 그대로)', () => {
    const xs = [205 / 409]
    expect(fitLines(xs, 818)).toBe(xs)
  })

  it('줄였을 때 8px 미만이 된 선만 민다 — 나머지 비율은 유지', () => {
    // 1600px에서 8px 간격(0.005)으로 붙인 선 → 400px로 줄이면 2px 간격
    const xs = [0.25, 0.255, 0.75]
    const fitted = fitLines(xs, 400)
    expect(fitted[0]).toBe(0.25)
    expect(fitted[2]).toBe(0.75)
    expect(edgesOf(fitted, 400)).toEqual([0, 100, 108, 300, 400])
  })

  it('가장자리 쪽으로 몰린 선은 뒤에서부터 밀어 모두 최소 간격 이상', () => {
    const xs = [0.99, 0.995, 0.999]
    const edges = edgesOf(fitLines(xs, 400), 400)
    expect(edges).toEqual([0, 376, 384, 392, 400])
  })

  it('선이 없으면 그대로', () => {
    const ys: number[] = []
    expect(fitLines(ys, 100)).toBe(ys)
  })
})

describe('isEqualLines', () => {
  it('균등이면 true, 선을 옮기면 false, 사진 px 기준 반올림 차이는 무시', () => {
    const size = { width: 409, height: 416 }
    expect(isEqualLines(equalLines(4), 4, size)).toBe(true)
    expect(isEqualLines({ xs: [205 / 409], ys: [0.5] }, 4, size)).toBe(true)
    expect(isEqualLines({ xs: [0.3], ys: [0.5] }, 4, size)).toBe(false)
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
