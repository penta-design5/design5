import { describe, expect, it } from 'vitest'
import {
  FACE_EDGE_MARGIN,
  FACE_INPUT_SIZE,
  FACE_MAX_TILES,
  FACE_TILE_OVERLAP,
  clipFaceBox,
  countFaceTiles,
  decodeYunet,
  dropOverlapping,
  faceRegionRect,
  iou,
  parseFaceSettings,
  planFaceLevels,
  rgbaToBgrTensor,
  suppressBoxes,
  tileBoxesToImage,
  tileOffsets,
  type FaceBox,
  type YunetOutputs,
} from './face'

const box = (x: number, y: number, width: number, height: number, score = 0.9): FaceBox => ({ x, y, width, height, score })

describe('tileOffsets — 한 변을 640 타일로 덮기', () => {
  it('640 이하면 타일 하나', () => {
    expect(tileOffsets(300)).toEqual([0])
    expect(tileOffsets(640)).toEqual([0])
  })
  it('가장자리까지 덮고 이웃 타일이 최소 겹침(160px)을 지킨다', () => {
    for (const length of [641, 900, 1200, 1840, 3000, 4096, 5000]) {
      const offsets = tileOffsets(length)
      expect(offsets[0]).toBe(0)
      expect(offsets[offsets.length - 1] + FACE_INPUT_SIZE).toBe(length)
      for (let i = 1; i < offsets.length; i++) {
        expect(offsets[i] - offsets[i - 1]).toBeLessThanOrEqual(FACE_INPUT_SIZE - FACE_TILE_OVERLAP)
        expect(offsets[i]).toBeGreaterThan(offsets[i - 1])
      }
    }
  })
})

describe('planFaceLevels — 원본 타일 + 축소 단계', () => {
  it('작은 이미지는 원본 한 단계·타일 하나(이미지 크기 그대로)', () => {
    const levels = planFaceLevels({ width: 600, height: 400 })
    expect(levels).toHaveLength(1)
    expect(levels[0].scale).toBe(1)
    expect(levels[0].tiles).toEqual([{ x: 0, y: 0, width: 600, height: 400 }])
  })

  it('큰 이미지는 절반씩 줄여 한 변이 640 이하가 되는 단계에서 끝난다', () => {
    const levels = planFaceLevels({ width: 4096, height: 4096 })
    expect(levels.map((l) => l.scale)).toEqual([1, 0.5, 0.25, 0.125])
    expect(levels[levels.length - 1].tiles).toHaveLength(1)
    expect(levels[3].width).toBe(512)
    expect(countFaceTiles(levels)).toBeLessThanOrEqual(FACE_MAX_TILES)
  })

  it('모든 단계의 타일이 그 단계 이미지를 빈틈없이 덮고 바깥으로 나가지 않는다', () => {
    for (const size of [{ width: 1200, height: 1840 }, { width: 3000, height: 2000 }, { width: 4000, height: 3000 }]) {
      for (const level of planFaceLevels(size)) {
        const covered = new Uint8Array(level.width * level.height)
        for (const t of level.tiles) {
          expect(t.x + t.width).toBeLessThanOrEqual(level.width)
          expect(t.y + t.height).toBeLessThanOrEqual(level.height)
          for (let y = t.y; y < t.y + t.height; y++) for (let x = t.x; x < t.x + t.width; x++) covered[y * level.width + x] = 1
        }
        expect(covered.every((v) => v === 1)).toBe(true)
      }
    }
  })

  it('타일이 너무 많으면 원본 해상도 단계부터 제외한다', () => {
    const levels = planFaceLevels({ width: 16384, height: 1024 })
    expect(countFaceTiles(levels)).toBeLessThanOrEqual(FACE_MAX_TILES)
    expect(levels.length).toBeGreaterThanOrEqual(1)
  })
})

describe('rgbaToBgrTensor', () => {
  it('채널 순서 B, G, R · 값 0~255 · 남는 영역은 0', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]) // 2×1 픽셀: (R10 G20 B30), (R40 G50 B60)
    const t = rgbaToBgrTensor(rgba, 2, 1)
    const plane = FACE_INPUT_SIZE * FACE_INPUT_SIZE
    expect(t).toHaveLength(3 * plane)
    expect([t[0], t[1]]).toEqual([30, 60]) // B 평면
    expect([t[plane], t[plane + 1]]).toEqual([20, 50]) // G 평면
    expect([t[2 * plane], t[2 * plane + 1]]).toEqual([10, 40]) // R 평면
    expect(t[2]).toBe(0)
    expect(t[FACE_INPUT_SIZE]).toBe(0) // 다음 행(패딩)
  })

  it('버퍼를 재사용해도 이전 내용이 남지 않는다', () => {
    const out = new Float32Array(3 * FACE_INPUT_SIZE * FACE_INPUT_SIZE)
    rgbaToBgrTensor(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]), 2, 1, out)
    const again = rgbaToBgrTensor(new Uint8ClampedArray([9, 9, 9, 255]), 1, 1, out)
    expect(again).toBe(out)
    expect(out[1]).toBe(0)
  })
})

describe('decodeYunet — 모델 출력 해독', () => {
  const outputs = (cell: { stride: number; r: number; c: number; cls: number; obj: number; bbox: [number, number, number, number] }): YunetOutputs => {
    const make = (len: number) => new Float32Array(len)
    const o: YunetOutputs = { cls: {}, obj: {}, bbox: {} }
    for (const s of [8, 16, 32]) {
      const n = (FACE_INPUT_SIZE / s) ** 2
      o.cls[s] = make(n)
      o.obj[s] = make(n)
      o.bbox[s] = make(n * 4)
    }
    const n = FACE_INPUT_SIZE / cell.stride
    const i = cell.r * n + cell.c
    o.cls[cell.stride][i] = cell.cls
    o.obj[cell.stride][i] = cell.obj
    o.bbox[cell.stride].set(cell.bbox, i * 4)
    return o
  }

  it('점수 = √(cls × obj), 중심 = (격자 + 오프셋) × 스트라이드, 크기 = exp(값) × 스트라이드', () => {
    // 스트라이드 8, 격자 (r5, c7), 오프셋 0.5, 크기 exp(ln 4) × 8 = 32
    const boxes = decodeYunet(outputs({ stride: 8, r: 5, c: 7, cls: 0.81, obj: 0.81, bbox: [0.5, 0.5, Math.log(4), Math.log(4)] }))
    expect(boxes).toHaveLength(1)
    expect(boxes[0].score).toBeCloseTo(0.81, 5)
    expect(boxes[0].x).toBeCloseTo(60 - 16, 4) // cx = 7.5 × 8 = 60
    expect(boxes[0].y).toBeCloseTo(44 - 16, 4) // cy = 5.5 × 8 = 44
    expect(boxes[0].width).toBeCloseTo(32, 4)
    expect(boxes[0].height).toBeCloseTo(32, 4)
  })

  it('점수가 하한 미만이면 버리고, 0~1 밖의 값은 잘라서 계산한다', () => {
    expect(decodeYunet(outputs({ stride: 16, r: 0, c: 0, cls: 0.3, obj: 0.3, bbox: [0, 0, 0, 0] }))).toHaveLength(0)
    const clipped = decodeYunet(outputs({ stride: 32, r: 1, c: 1, cls: 5, obj: 5, bbox: [0, 0, 0, 0] }))
    expect(clipped[0].score).toBe(1)
  })
})

describe('상자 정리·좌표 변환', () => {
  it('iou', () => {
    expect(iou(box(0, 0, 10, 10), box(0, 0, 10, 10))).toBe(1)
    expect(iou(box(0, 0, 10, 10), box(20, 20, 10, 10))).toBe(0)
    expect(iou(box(0, 0, 10, 10), box(5, 0, 10, 10))).toBeCloseTo(1 / 3, 5)
  })

  it('suppressBoxes: 겹치는 상자는 높은 점수만, 큰 상자 안의 작은 상자도 정리, 떨어진 상자는 유지', () => {
    const kept = suppressBoxes([box(0, 0, 100, 100, 0.8), box(5, 5, 100, 100, 0.9), box(30, 30, 30, 30, 0.7), box(300, 300, 50, 50, 0.6)])
    expect(kept.map((b) => b.score)).toEqual([0.9, 0.6])
  })

  it('tileBoxesToImage: 타일 오프셋·배율을 이미지 좌표로 되돌린다', () => {
    const level = { scale: 0.5, width: 1000, height: 1000 }
    const tile = { x: 200, y: 100, width: 640, height: 640 }
    const [b] = tileBoxesToImage([box(100, 50, 40, 60)], tile, level)
    expect(b).toMatchObject({ x: 600, y: 300, width: 80, height: 120 })
  })

  it('tileBoxesToImage: 이미지 안쪽 타일 경계에 닿은 상자(잘린 얼굴)는 버리고, 이미지 가장자리와 맞닿은 쪽은 유지', () => {
    const level = { scale: 1, width: 1280, height: 640 }
    const right = { x: 640, y: 0, width: 640, height: 640 } // 왼쪽 경계만 안쪽, 오른쪽·위·아래는 이미지 가장자리
    expect(tileBoxesToImage([box(1, 100, 50, 50)], right, level)).toHaveLength(0) // 왼쪽 경계에 닿음
    expect(tileBoxesToImage([box(FACE_EDGE_MARGIN + 1, 100, 50, 50)], right, level)).toHaveLength(1)
    expect(tileBoxesToImage([box(580, 0, 60, 60)], right, level)).toHaveLength(1) // 오른쪽·위는 이미지 가장자리라 유지
  })

  it('clipFaceBox: 이미지 밖으로 나간 부분을 잘라 내고 완전히 밖이면 null', () => {
    expect(clipFaceBox(box(-10, -10, 50, 50), { width: 100, height: 100 })).toMatchObject({ x: 0, y: 0, width: 40, height: 40 })
    expect(clipFaceBox(box(120, 10, 20, 20), { width: 100, height: 100 })).toBeNull()
  })
})

describe('faceRegionRect — 얼굴 여백', () => {
  const size = { width: 1000, height: 800 }
  it('여백 30% → 너비·높이 1.3배, 중심 유지(정수)', () => {
    expect(faceRegionRect({ x: 400, y: 300, width: 100, height: 120 }, 30, size)).toEqual({ x: 385, y: 282, width: 130, height: 156 })
  })
  it('여백 0 → 상자 그대로', () => {
    expect(faceRegionRect({ x: 400, y: 300, width: 100, height: 120 }, 0, size)).toEqual({ x: 400, y: 300, width: 100, height: 120 })
  })
  it('이미지 가장자리에서는 안쪽으로 자른다(이미지 밖으로 나가지 않음)', () => {
    const r = faceRegionRect({ x: 5, y: 5, width: 100, height: 100 }, 100, size)
    expect(r.x).toBe(0)
    expect(r.y).toBe(0)
    expect(r.x + r.width).toBeLessThanOrEqual(size.width)
  })
  it('여백 범위를 벗어난 값은 0~100으로 제한', () => {
    expect(faceRegionRect({ x: 400, y: 300, width: 100, height: 100 }, 500, size).width).toBe(200)
    expect(faceRegionRect({ x: 400, y: 300, width: 100, height: 100 }, -50, size).width).toBe(100)
  })
})

describe('dropOverlapping — 이미 있는 영역과 겹치면 건너뜀', () => {
  it('IoU 0.5 이상만 제외', () => {
    const existing = [{ x: 0, y: 0, width: 100, height: 100 }]
    const rects = [{ x: 10, y: 10, width: 100, height: 100 }, { x: 80, y: 80, width: 100, height: 100 }, { x: 300, y: 300, width: 50, height: 50 }]
    expect(dropOverlapping(rects, existing)).toEqual([rects[1], rects[2]])
  })
})

describe('parseFaceSettings', () => {
  it('저장값을 검증해 복원(범위·형식 밖은 기본값/경계값)', () => {
    expect(parseFaceSettings(null)).toEqual({ auto: false, margin: 30 })
    expect(parseFaceSettings(JSON.stringify({ auto: true, margin: 45.4 }))).toEqual({ auto: true, margin: 45 })
    expect(parseFaceSettings(JSON.stringify({ auto: 'yes', margin: 999 }))).toEqual({ auto: false, margin: 100 })
    expect(parseFaceSettings(JSON.stringify({ margin: -5 }))).toEqual({ auto: false, margin: 0 })
    expect(parseFaceSettings('{깨짐')).toEqual({ auto: false, margin: 30 })
  })
})
