import { describe, expect, it } from 'vitest'
import { tileBoxesToImage, type FaceBox } from './face'
import {
  PLATE_INPUT_SIZE,
  PLATE_MAX_TILES,
  PLATE_MIN_WIDTH,
  PLATE_OUTPUT_STRIDE,
  PLATE_PAD_VALUE,
  PLATE_SCORE_THRESHOLD,
  PLATE_UPSCALE_MAX_SIDE,
  countPlateTiles,
  decodePlateOutput,
  finalizePlateBoxes,
  parsePlateSettings,
  planPlateLevels,
  rgbaToRgbTensor,
} from './plate'

const box = (x: number, y: number, width: number, height: number, score = 0.9): FaceBox => ({ x, y, width, height, score })
/** 출력 한 행: [배치, x1, y1, x2, y2, 클래스, 점수] */
const row = (x1: number, y1: number, x2: number, y2: number, score: number) => [0, x1, y1, x2, y2, 0, score]

describe('planPlateLevels — 번호판 감지 계획', () => {
  it('640 이하 이미지는 원본 한 단계(타일 1개)', () => {
    const levels = planPlateLevels({ width: 640, height: 480 })
    expect(levels.map((l) => [l.scale, l.tiles.length])).toEqual([[1, 1]])
  })

  it('정밀 감지를 켜면 작은 이미지에 2배 확대 단계가 먼저 실행된다', () => {
    const levels = planPlateLevels({ width: 640, height: 480 }, { upscale: true })
    expect(levels.map((l) => l.scale)).toEqual([2, 1])
    expect(levels[0]).toMatchObject({ width: 1280, height: 960 })
  })

  it('원본 → 절반씩 줄인 단계(한 변이 640 이하가 되면 끝)', () => {
    const levels = planPlateLevels({ width: 4000, height: 3000 })
    expect(levels.map((l) => l.scale)).toEqual([1, 0.5, 0.25, 0.125])
    expect(levels[0].tiles.length).toBe(48) // 4000 → 8열, 3000 → 6행
    expect(levels[levels.length - 1].tiles.length).toBe(1)
  })

  it('긴 변이 확대 상한(1280)을 넘으면 정밀 감지여도 확대하지 않는다(타일 수만 는다)', () => {
    expect(planPlateLevels({ width: PLATE_UPSCALE_MAX_SIDE, height: 720 }, { upscale: true }).map((l) => l.scale)).toContain(2)
    expect(planPlateLevels({ width: PLATE_UPSCALE_MAX_SIDE + 1, height: 720 }, { upscale: true }).map((l) => l.scale)).not.toContain(2)
  })

  it('타일 합이 상한을 넘으면 그 단계를 건너뛴다 — 아주 큰 이미지는 원본 단계가 빠지고 축소 단계가 남는다', () => {
    const levels = planPlateLevels({ width: 8000, height: 6000 })
    expect(countPlateTiles(levels)).toBeLessThanOrEqual(PLATE_MAX_TILES)
    expect(levels.map((l) => l.scale)).not.toContain(1)
    expect(levels.length).toBeGreaterThan(0)
  })

  it('실행 순서는 배율이 큰 단계부터', () => {
    const scales = planPlateLevels({ width: 1200, height: 800 }, { upscale: true }).map((l) => l.scale)
    expect(scales).toEqual([...scales].sort((a, b) => b - a))
  })

  it('모든 단계의 타일이 단계 이미지를 빈틈없이 덮는다', () => {
    for (const size of [{ width: 1200, height: 799 }, { width: 860, height: 227 }, { width: 3000, height: 2000 }]) {
      for (const level of planPlateLevels(size, { upscale: true })) {
        const covered = new Uint8Array(level.width * level.height)
        for (const t of level.tiles) {
          for (let y = t.y; y < t.y + t.height; y++) for (let x = t.x; x < t.x + t.width; x++) covered[y * level.width + x] = 1
        }
        expect(covered.every((v) => v === 1)).toBe(true)
      }
    }
  })

  it('1×1 같은 극단적으로 작은 이미지도 계획이 나온다', () => {
    const levels = planPlateLevels({ width: 1, height: 1 }, { upscale: true })
    expect(levels.length).toBeGreaterThan(0)
    for (const l of levels) expect(l.tiles.length).toBeGreaterThan(0)
  })
})

describe('rgbaToRgbTensor — 모델 입력', () => {
  it('채널 순서 R,G,B(평면)·값 0~1', () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]) // 빨강, 초록 (2×1)
    const t = rgbaToRgbTensor(rgba, 2, 1)
    const plane = PLATE_INPUT_SIZE * PLATE_INPUT_SIZE
    expect(t.length).toBe(3 * plane)
    expect([t[0], t[plane], t[2 * plane]]).toEqual([1, 0, 0]) // 첫 픽셀 R·G·B
    expect([t[1], t[plane + 1], t[2 * plane + 1]]).toEqual([0, 1, 0])
  })

  it('타일 밖은 회색(114/255)으로 채우고, 버퍼를 재사용하면 이전 값이 남지 않는다', () => {
    const out = new Float32Array(3 * PLATE_INPUT_SIZE * PLATE_INPUT_SIZE)
    rgbaToRgbTensor(new Uint8ClampedArray(4 * 4).fill(255), 2, 2, out)
    rgbaToRgbTensor(new Uint8ClampedArray(4).fill(0), 1, 1, out)
    expect(out[0]).toBe(0) // 첫 픽셀은 새 값
    expect(out[1]).toBeCloseTo(PLATE_PAD_VALUE, 6) // 이전 호출이 흰색을 썼던 자리도 회색
    expect(out[PLATE_INPUT_SIZE]).toBeCloseTo(PLATE_PAD_VALUE, 6)
  })
})

describe('decodePlateOutput — 모델 출력 해독', () => {
  it('점수가 하한 이상인 행만, 타일 좌표 상자로', () => {
    const data = [...row(100, 200, 180, 230, 0.89), ...row(10, 10, 40, 30, 0), ...row(300, 300, 360, 330, 0.2)]
    expect(data.length).toBe(3 * PLATE_OUTPUT_STRIDE)
    expect(decodePlateOutput(data, 3)).toEqual([{ x: 100, y: 200, width: 80, height: 30, score: 0.89 }])
  })

  it('경계 점수(하한 그대로)는 포함하고 하한 직전은 제외한다', () => {
    expect(decodePlateOutput(row(0, 0, 50, 20, PLATE_SCORE_THRESHOLD), 1)).toHaveLength(1)
    expect(decodePlateOutput(row(0, 0, 50, 20, PLATE_SCORE_THRESHOLD - 0.01), 1)).toHaveLength(0)
  })

  it('너무 작은 점 같은 상자와 NaN 점수는 버린다', () => {
    expect(decodePlateOutput(row(5, 5, 8, 8, 0.9), 1)).toEqual([])
    expect(decodePlateOutput(row(5, 5, 50, 30, NaN), 1)).toEqual([])
  })

  it('x1>x2처럼 뒤집힌 좌표도 바로잡는다', () => {
    expect(decodePlateOutput(row(180, 230, 100, 200, 0.9), 1)[0]).toMatchObject({ x: 100, y: 200, width: 80, height: 30 })
  })

  it('행이 없으면 빈 배열', () => {
    expect(decodePlateOutput([], 0)).toEqual([])
  })
})

describe('tileBoxesToImage — 확대 단계 좌표 복원', () => {
  it('2배 확대 단계의 상자는 원본 좌표(절반)로 돌아온다', () => {
    const level = { scale: 2, width: 1280, height: 960 }
    const tile = { x: 640, y: 320, width: 640, height: 640 }
    const [b] = tileBoxesToImage([box(100, 100, 80, 40)], tile, level)
    expect(b).toMatchObject({ x: 370, y: 210, width: 40, height: 20 })
  })
})

describe('finalizePlateBoxes — 최종 정리', () => {
  const size = { width: 1000, height: 800 }

  it('겹치는 상자는 점수 높은 쪽만', () => {
    const out = finalizePlateBoxes([box(100, 100, 80, 30, 0.6), box(102, 101, 80, 30, 0.9)], size)
    expect(out).toHaveLength(1)
    expect(out[0].score).toBe(0.9)
  })

  it('이미지 밖으로 나간 부분은 잘라 내고 완전히 밖이면 버린다', () => {
    const out = finalizePlateBoxes([box(950, 100, 100, 30), box(2000, 100, 80, 30)], size)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ x: 950, width: 50 })
  })

  it('너무 좁은 상자(미등 같은 점)는 제거, 먼 번호판 크기(25×7)는 유지', () => {
    const out = finalizePlateBoxes([box(10, 10, PLATE_MIN_WIDTH - 1, 4, 0.5), box(300, 300, 25, 7, 0.57)], size)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ x: 300, width: 25 })
  })
})

describe('parsePlateSettings', () => {
  it('저장값이 없거나 깨지면 기본값(여백 10·정밀 감지 꺼짐)', () => {
    expect(parsePlateSettings(null)).toEqual({ margin: 10, precise: false })
    expect(parsePlateSettings('{깨짐')).toEqual({ margin: 10, precise: false })
  })

  it('여백은 0~100으로 제한하고 반올림, 정밀 감지는 true일 때만 켜짐', () => {
    expect(parsePlateSettings(JSON.stringify({ margin: 250, precise: true }))).toEqual({ margin: 100, precise: true })
    expect(parsePlateSettings(JSON.stringify({ margin: -5 }))).toEqual({ margin: 0, precise: false })
    expect(parsePlateSettings(JSON.stringify({ margin: 12.6, precise: 'x' }))).toEqual({ margin: 13, precise: false })
    expect(parsePlateSettings(JSON.stringify({ margin: 'a', precise: false }))).toEqual({ margin: 10, precise: false })
  })
})
