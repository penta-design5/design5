import { describe, expect, it } from 'vitest'
import {
  alignedExtent,
  blurScaleFor,
  boxBlurRGBA,
  pixelateData,
  type PixelSource,
} from './effects'
import { commitFrom, sameRegions } from './edit-history'
import { createHistory, pushHistory, replacePresent, undoHistory, redoHistory } from '@/lib/toolbox/common/history'
import {
  createRegion,
  fullRect,
  handlePoint,
  isUsableRect,
  moveRect,
  normalizeRect,
  nudgeRect,
  squareFromDrag,
  rectFromDrag,
  resizeRect,
  setRectField,
} from './regions'
import { DEFAULT_REGION_SETTINGS, blurRadiusFor, cellSizeFor, clampStrength } from './types'

/** 단색 블록들로 이루어진 RGBA 이미지(타일마다 색을 지정) */
function makeImage(width: number, height: number, colorAt: (x: number, y: number) => [number, number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorAt(x, y)
      const i = (y * width + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = a
    }
  }
  return data
}

const full = (width: number, height: number, data: Uint8ClampedArray): PixelSource => ({ data, width, height, originX: 0, originY: 0 })
const px = (out: Uint8ClampedArray, width: number, x: number, y: number) => Array.from(out.slice((y * width + x) * 4, (y * width + x) * 4 + 4))

describe('cellSizeFor — 강도 → 셀 크기', () => {
  it('짧은 변 × 강도 / 1000, 최소 2px', () => {
    expect(cellSizeFor(22, 800, 600)).toBe(13) // 600 × 0.022
    expect(cellSizeFor(22, 4096, 4096)).toBe(90)
    expect(cellSizeFor(100, 4096, 4096)).toBe(410)
    expect(cellSizeFor(1, 800, 600)).toBe(2)
    expect(cellSizeFor(1, 100, 100)).toBe(2)
  })
  it('범위를 벗어난 강도는 1~100으로 제한', () => {
    expect(clampStrength(0)).toBe(1)
    expect(clampStrength(500)).toBe(100)
    expect(clampStrength(NaN)).toBe(22)
  })
})

describe('pixelateData — 거친 픽셀', () => {
  it('셀 평균색으로 채운다(알려진 색 블록)', () => {
    // 4×4 이미지, 셀 2: 왼쪽 두 열 = (0,0,0)/(100,100,100) 번갈아 → 평균 50
    const data = makeImage(4, 4, (x, y) => (x < 2 ? (y % 2 ? [100, 100, 100, 255] : [0, 0, 0, 255]) : [200, 0, 0, 255]))
    const out = pixelateData(full(4, 4, data), { x: 0, y: 0, width: 4, height: 4 }, 2)
    expect(px(out, 4, 0, 0)).toEqual([50, 50, 50, 255])
    expect(px(out, 4, 1, 1)).toEqual([50, 50, 50, 255])
    expect(px(out, 4, 2, 0)).toEqual([200, 0, 0, 255])
    expect(px(out, 4, 3, 3)).toEqual([200, 0, 0, 255])
  })

  it('알파 가중 — 투명 픽셀이 색을 오염시키지 않는다', () => {
    // 셀 안 절반은 불투명 빨강, 절반은 완전 투명 검정
    const data = makeImage(2, 2, (x) => (x === 0 ? [255, 0, 0, 255] : [0, 0, 0, 0]))
    const out = pixelateData(full(2, 2, data), { x: 0, y: 0, width: 2, height: 2 }, 2)
    expect(px(out, 2, 0, 0)).toEqual([255, 0, 0, 128]) // 색은 빨강 유지, 알파 = 평균 127.5 → 128
  })

  it('완전 투명 셀은 투명(알파 0)', () => {
    const data = makeImage(2, 2, () => [10, 20, 30, 0])
    const out = pixelateData(full(2, 2, data), { x: 0, y: 0, width: 2, height: 2 }, 2)
    expect(px(out, 2, 1, 1)[3]).toBe(0)
  })

  it('이미지 가장자리에서 잘린 셀(홀수 크기)도 실제 픽셀 수로 평균한다', () => {
    // 5×5, 셀 2 → 마지막 열·행 셀은 1픽셀 폭. 마지막 열만 흰색
    const data = makeImage(5, 5, (x) => (x === 4 ? [255, 255, 255, 255] : [0, 0, 0, 255]))
    const out = pixelateData(full(5, 5, data), { x: 0, y: 0, width: 5, height: 5 }, 2)
    expect(px(out, 5, 4, 0)).toEqual([255, 255, 255, 255])
    expect(px(out, 5, 3, 0)).toEqual([0, 0, 0, 255])
  })

  it('영역이 셀 중간에서 시작해도 셀 색은 전체 셀 기준이고, 같은 좌표는 영역과 무관하게 같은 색(격자 고정)', () => {
    const data = makeImage(8, 8, (x, y) => [x * 30, y * 30, 0, 255])
    const size = { width: 8, height: 8 }
    const cell = 4
    const regionA = { x: 1, y: 1, width: 5, height: 5 }
    const regionB = { x: 0, y: 0, width: 8, height: 8 }
    const run = (rect: typeof regionA) => {
      const ext = alignedExtent(rect, cell, size)
      const sub = new Uint8ClampedArray(ext.width * ext.height * 4)
      for (let y = 0; y < ext.height; y++) {
        for (let x = 0; x < ext.width; x++) {
          const si = ((y + ext.y) * 8 + x + ext.x) * 4
          sub.set(data.subarray(si, si + 4), (y * ext.width + x) * 4)
        }
      }
      return pixelateData({ data: sub, width: ext.width, height: ext.height, originX: ext.x, originY: ext.y }, rect, cell)
    }
    const a = run(regionA)
    const b = run(regionB)
    // 영역 A의 (x=3,y=3)(= 이미지 좌표 4,4가 아니라 A 안 (3,3) → 이미지 (4,4))
    expect(px(a, 5, 3, 3)).toEqual(px(b, 8, 4, 4))
    expect(px(a, 5, 0, 0)).toEqual(px(b, 8, 1, 1))
  })
})

describe('alignedExtent — 셀 격자에 맞춘 범위', () => {
  it('영역을 덮는 셀 경계로 넓히고 이미지 안으로 제한', () => {
    expect(alignedExtent({ x: 5, y: 7, width: 10, height: 4 }, 4, { width: 100, height: 100 })).toEqual({ x: 4, y: 4, width: 12, height: 8 })
    expect(alignedExtent({ x: 90, y: 90, width: 10, height: 10 }, 16, { width: 100, height: 100 })).toEqual({ x: 80, y: 80, width: 20, height: 20 })
  })
})

describe('regions — 영역 기하', () => {
  const size = { width: 409, height: 416 }

  it('normalizeRect: 정수 반올림·이미지 안·최소 크기', () => {
    expect(normalizeRect({ x: -10, y: 5.6, width: 3, height: 9999 }, size)).toEqual({ x: 0, y: 0, width: 8, height: 416 })
    expect(normalizeRect({ x: 400, y: 0, width: 50, height: 50 }, size)).toEqual({ x: 359, y: 0, width: 50, height: 50 })
  })

  it('이미지가 8px보다 작으면 이미지 크기가 최소', () => {
    expect(normalizeRect({ x: 0, y: 0, width: 1, height: 1 }, { width: 5, height: 20 })).toEqual({ x: 0, y: 0, width: 5, height: 8 })
  })

  it('setRectField: 위치는 크기 유지, 크기는 위치 유지', () => {
    const r = { x: 100, y: 100, width: 50, height: 60 }
    expect(setRectField(r, 'x', 9999, size)).toEqual({ ...r, x: 359 })
    expect(setRectField(r, 'y', -5, size)).toEqual({ ...r, y: 0 })
    expect(setRectField(r, 'width', 9999, size)).toEqual({ ...r, width: 309 })
    expect(setRectField(r, 'height', 1, size)).toEqual({ ...r, height: 8 })
    expect(setRectField(r, 'x', NaN, size)).toBe(r)
  })

  it('moveRect: 크기 유지, 이미지 밖으로 나가지 않음', () => {
    const r = { x: 10, y: 10, width: 100, height: 100 }
    expect(moveRect(r, { x: 5000, y: -50 }, size)).toEqual({ x: 309, y: 0, width: 100, height: 100 })
  })

  it('resizeRect: 반대편 고정, 최소 크기·경계 제한, 뒤집히지 않음', () => {
    const r = { x: 100, y: 100, width: 100, height: 100 }
    expect(resizeRect(r, 'se', { x: 250, y: 300 }, size)).toEqual({ x: 100, y: 100, width: 150, height: 200 })
    expect(resizeRect(r, 'nw', { x: 40, y: 60 }, size)).toEqual({ x: 40, y: 60, width: 160, height: 140 })
    // 반대편을 넘기면 최소 크기에서 멈춤
    expect(resizeRect(r, 'e', { x: 0, y: 0 }, size)).toEqual({ x: 100, y: 100, width: 8, height: 100 })
    expect(resizeRect(r, 'w', { x: 9999, y: 0 }, size)).toEqual({ x: 192, y: 100, width: 8, height: 100 })
    // 경계
    expect(resizeRect(r, 'se', { x: 9999, y: 9999 }, size)).toEqual({ x: 100, y: 100, width: 309, height: 316 })
    // 변 핸들은 한 축만
    expect(resizeRect(r, 'n', { x: 9999, y: 50 }, size)).toEqual({ x: 100, y: 50, width: 100, height: 150 })
  })

  it('handlePoint: 핸들 위치', () => {
    const r = { x: 10, y: 20, width: 100, height: 60 }
    expect(handlePoint(r, 'nw')).toEqual({ x: 10, y: 20 })
    expect(handlePoint(r, 'se')).toEqual({ x: 110, y: 80 })
    expect(handlePoint(r, 'n')).toEqual({ x: 60, y: 20 })
    expect(handlePoint(r, 'e')).toEqual({ x: 110, y: 50 })
  })

  it('rectFromDrag: 방향 무관, 이미지 안으로 제한 / isUsableRect: 최소 크기', () => {
    expect(rectFromDrag({ x: 50, y: 60 }, { x: 10, y: 20 }, size)).toEqual({ x: 10, y: 20, width: 40, height: 40 })
    expect(rectFromDrag({ x: -30, y: 10 }, { x: 9999, y: 500 }, size)).toEqual({ x: 0, y: 10, width: 409, height: 406 })
    expect(isUsableRect({ x: 0, y: 0, width: 7, height: 50 }, size)).toBe(false)
    expect(isUsableRect({ x: 0, y: 0, width: 8, height: 8 }, size)).toBe(true)
  })

  it('fullRect·createRegion: 전체 영역, 고유 id, 기본 설정', () => {
    expect(fullRect(size)).toEqual({ x: 0, y: 0, width: 409, height: 416 })
    const a = createRegion(fullRect(size), DEFAULT_REGION_SETTINGS)
    const b = createRegion(fullRect(size), DEFAULT_REGION_SETTINGS)
    expect(a.id).not.toBe(b.id)
    expect(a).toMatchObject({ pattern: 'pixel', shape: 'rect', strength: 22 })
  })
})

describe('squareFromDrag — Shift로 정사각형·정원', () => {
  const size = { width: 100, height: 80 }
  it('긴 쪽 변에 맞춘 정사각형, 드래그 방향 유지', () => {
    expect(squareFromDrag({ x: 10, y: 10 }, { x: 40, y: 20 }, size)).toEqual({ x: 10, y: 10, width: 30, height: 30 })
    expect(squareFromDrag({ x: 50, y: 50 }, { x: 40, y: 10 }, size)).toEqual({ x: 10, y: 10, width: 40, height: 40 })
  })
  it('이미지 경계를 넘지 않도록 한 변을 제한', () => {
    expect(squareFromDrag({ x: 80, y: 60 }, { x: 500, y: 70 }, size)).toEqual({ x: 80, y: 60, width: 20, height: 20 })
    // 왼쪽·아래 방향: 아래 남은 공간(10)이 한계 → 10×10, 왼쪽으로 뻗는다
    expect(squareFromDrag({ x: 20, y: 70 }, { x: -50, y: 75 }, size)).toEqual({ x: 10, y: 70, width: 10, height: 10 })
  })
})

describe('nudgeRect — 방향키 이동', () => {
  const size = { width: 100, height: 100 }
  it('1px·10px 이동, 이미지 밖으로 나가지 않음', () => {
    const r = { x: 50, y: 50, width: 20, height: 20 }
    expect(nudgeRect(r, 1, 0, size)).toEqual({ ...r, x: 51 })
    expect(nudgeRect(r, 0, -10, size)).toEqual({ ...r, y: 40 })
    expect(nudgeRect(r, 100, 100, size)).toEqual({ ...r, x: 80, y: 80 })
    expect(nudgeRect(r, -100, -100, size)).toEqual({ ...r, x: 0, y: 0 })
  })
})

describe('되돌리기 기록 — 연속 동작을 1단계로', () => {
  const region = (x: number) => createRegion({ x, y: 0, width: 10, height: 10 }, DEFAULT_REGION_SETTINGS)
  it('동작 중 replacePresent, 끝에 commitFrom → 1단계', () => {
    const a = [region(0)]
    let h = createHistory<typeof a>(a)
    const base = h.present
    for (let i = 1; i <= 5; i++) h = replacePresent(h, [{ ...a[0], x: i }]) // 끌기 5프레임
    h = commitFrom(h, base, 100)
    expect(h.past).toHaveLength(1)
    expect(h.present[0].x).toBe(5)
    h = undoHistory(h)
    expect(h.present[0].x).toBe(0)
    h = redoHistory(h)
    expect(h.present[0].x).toBe(5)
  })
  it('바뀐 게 없으면 기록을 늘리지 않고, 단계 상한을 지킨다', () => {
    const a = [region(0)]
    const h = createHistory<typeof a>(a)
    expect(commitFrom(h, a, 100)).toBe(h)
    let g = createHistory<typeof a>(a)
    for (let i = 0; i < 10; i++) g = commitFrom(replacePresent(g, [{ ...a[0], x: i + 1 }]), g.present, 3)
    expect(g.past).toHaveLength(3)
  })
  it('pushHistory 후 새 동작은 다시 실행 목록을 비운다', () => {
    const a = [region(0)]
    let h = pushHistory(createHistory<typeof a>(a), [region(1)])
    h = undoHistory(h)
    expect(h.future).toHaveLength(1)
    h = commitFrom(replacePresent(h, [region(2)]), a, 100)
    expect(h.future).toHaveLength(0)
  })
  it('sameRegions: 내용이 같으면 true', () => {
    const a = [region(0)]
    expect(sameRegions(a, a.map((r) => ({ ...r })))).toBe(true)
    expect(sameRegions(a, [{ ...a[0], strength: 50 }])).toBe(false)
    expect(sameRegions(a, [])).toBe(false)
  })
})

describe('blurRadiusFor — 블러 반경', () => {
  it('같은 강도의 셀 크기의 절반(최소 1px)', () => {
    expect(blurRadiusFor(22, 409, 416)).toBe(5) // 셀 9 → 반올림 5
    expect(blurRadiusFor(100, 4096, 4096)).toBe(205) // 셀 410
    expect(blurRadiusFor(1, 100, 100)).toBe(1) // 셀 2
  })
})

describe('blurScaleFor — 블러 작업 해상도 배율', () => {
  it('작업 넓이가 상한(40만 px) 이하면 원본 해상도(1), 넘으면 줄인다', () => {
    expect(blurScaleFor(45, 500, 500)).toBe(1) // 25만
    expect(blurScaleFor(45, 600, 650)).toBe(1) // 39만
    expect(blurScaleFor(45, 600, 700)).toBe(2) // 42만 > 상한
  })
  it('넓이가 크면 상한 이하가 되도록 2의 거듭제곱으로 줄인다(최대 8)', () => {
    expect(blurScaleFor(100, 600, 700)).toBe(2)
    expect(blurScaleFor(100, 2048, 2048)).toBe(4)
    expect(blurScaleFor(100, 4096, 4096)).toBe(8)
  })
  it('배율은 반경을 넘지 않는다(줄인 뒤 반경 ≥ 1px)', () => {
    expect(blurScaleFor(2, 4096, 4096)).toBe(2)
    expect(blurScaleFor(1, 4096, 4096)).toBe(1)
    expect(blurScaleFor(5, 4096, 4096)).toBe(4)
  })
})

describe('boxBlurRGBA — 상자 흐림 3회(알파 가중)', () => {
  const rgba = (w: number, h: number, f: (x: number, y: number) => [number, number, number, number]) => {
    const d = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) d.set(f(x, y), (y * w + x) * 4)
    return d
  }
  const at = (d: Uint8ClampedArray, w: number, x: number, y: number) => Array.from(d.slice((y * w + x) * 4, (y * w + x) * 4 + 4))

  it('단색 불투명 이미지는 그대로(가장자리 포함)', () => {
    const d = rgba(9, 7, () => [120, 60, 200, 255])
    boxBlurRGBA(d, 9, 7, 3)
    for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) expect(at(d, 9, x, y)).toEqual([120, 60, 200, 255])
  })

  it('반경 0은 그대로', () => {
    const d = rgba(5, 5, (x, y) => [x * 50, y * 50, 0, 255])
    const before = Array.from(d)
    boxBlurRGBA(d, 5, 5, 0)
    expect(Array.from(d)).toEqual(before)
  })

  it('점 하나는 퍼지고(반경 1 ×3회: 중앙 ≈ 255 × (7/27)²), 밝기 총량은 거의 보존', () => {
    const d = rgba(15, 15, (x, y) => (x === 7 && y === 7 ? [255, 255, 255, 255] : [0, 0, 0, 255]))
    boxBlurRGBA(d, 15, 15, 1)
    const center = at(d, 15, 7, 7)[0]
    expect(center).toBeGreaterThanOrEqual(15)
    expect(center).toBeLessThanOrEqual(19)
    let sum = 0
    for (let i = 0; i < d.length; i += 4) sum += d[i]
    expect(Math.abs(sum - 255)).toBeLessThan(40) // 단계마다 반올림되므로 약간의 오차
    // 멀리(3px 밖)는 번지지 않음
    expect(at(d, 15, 12, 7)[0]).toBe(0)
  })

  it('알파 가중 — 투명한 쪽의 색이 번져 들어오지 않는다(경계에서 어두워지지 않음)', () => {
    // 왼쪽 6칸 불투명 빨강, 오른쪽 6칸 완전 투명(색은 검정)
    const d = rgba(12, 1, (x) => (x < 6 ? [255, 0, 0, 255] : [0, 0, 0, 0]))
    boxBlurRGBA(d, 12, 1, 1)
    const edge = at(d, 12, 6, 0) // 경계 바로 오른쪽: 반투명, 색은 여전히 빨강
    expect(edge[3]).toBeGreaterThan(0)
    expect(edge[3]).toBeLessThan(255)
    expect(edge[0]).toBeGreaterThanOrEqual(250)
    expect(edge[1]).toBe(0)
    expect(edge[2]).toBe(0)
    expect(at(d, 12, 11, 0)[3]).toBe(0) // 멀리는 완전 투명
    expect(at(d, 12, 0, 0)).toEqual([255, 0, 0, 255]) // 왼쪽 끝(가장자리 이어 붙임)은 그대로
  })

  it('경계 반투명 픽셀의 색이 알파로 정규화되어 돌아온다', () => {
    const d = rgba(6, 1, () => [200, 100, 50, 128])
    boxBlurRGBA(d, 6, 1, 1)
    for (let x = 0; x < 6; x++) {
      const [r, g, b, a] = at(d, 6, x, 0)
      expect(Math.abs(r - 200)).toBeLessThanOrEqual(2)
      expect(Math.abs(g - 100)).toBeLessThanOrEqual(2)
      expect(Math.abs(b - 50)).toBeLessThanOrEqual(2)
      expect(Math.abs(a - 128)).toBeLessThanOrEqual(1)
    }
  })
})
