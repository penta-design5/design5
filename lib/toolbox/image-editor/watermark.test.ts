import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WATERMARK_SETTINGS,
  MAX_TILES,
  isWatermarkActive,
  layoutWatermark,
  logoItemSize,
  parseStoredWatermark,
  rotatedExtent,
  serializeWatermark,
  watermarkFontSize,
  type ItemSize,
  type Placement,
  type WatermarkLogo,
  type WatermarkSettings,
} from './watermark'

const settings = (patch: Partial<WatermarkSettings> = {}): WatermarkSettings => ({
  ...DEFAULT_WATERMARK_SETTINGS,
  enabled: true,
  ...patch,
})

/** 점이 (회전된) 항목 안에 있는지 */
function covers(p: Placement, item: ItemSize, deg: number, x: number, y: number) {
  const rad = (-deg * Math.PI) / 180
  const dx = x - p.x
  const dy = y - p.y
  const lx = dx * Math.cos(rad) - dy * Math.sin(rad)
  const ly = dx * Math.sin(rad) + dy * Math.cos(rad)
  return Math.abs(lx) <= item.width / 2 + 1e-6 && Math.abs(ly) <= item.height / 2 + 1e-6
}

describe('isWatermarkActive', () => {
  it('꺼져 있거나 내용이 없으면 비활성', () => {
    const logo = {} as WatermarkLogo
    expect(isWatermarkActive(settings({ enabled: false }), logo)).toBe(false)
    expect(isWatermarkActive(settings({ text: '   ' }), null)).toBe(false)
    expect(isWatermarkActive(settings({ text: 'A' }), null)).toBe(true)
    expect(isWatermarkActive(settings({ kind: 'image' }), null)).toBe(false)
    expect(isWatermarkActive(settings({ kind: 'image' }), logo)).toBe(true)
  })
})

describe('크기 기준 = 짧은 변 %', () => {
  it('글자 크기·로고 크기는 이미지 짧은 변에 비례 (가로·세로 무관)', () => {
    expect(watermarkFontSize({ width: 2000, height: 1000 }, settings({ textSize: 5 }))).toBe(50)
    expect(watermarkFontSize({ width: 1000, height: 2000 }, settings({ textSize: 5 }))).toBe(50)
    expect(logoItemSize({ width: 4000, height: 2000 }, settings({ logoSize: 10 }), { width: 400, height: 100 })).toEqual({
      width: 200,
      height: 50,
    })
  })
})

describe('rotatedExtent', () => {
  it('0°는 그대로, 90°는 교환', () => {
    expect(rotatedExtent(100, 40, 0)).toEqual({ width: 100, height: 40 })
    const r = rotatedExtent(100, 40, 90)
    expect(r.width).toBeCloseTo(40)
    expect(r.height).toBeCloseTo(100)
  })
})

describe('layoutWatermark — 단일 배치', () => {
  const doc = { width: 1000, height: 500 }
  const item = { width: 100, height: 20 }

  it('9방향 위치 + 여백(짧은 변 %)', () => {
    const at = (position: WatermarkSettings['position']) =>
      layoutWatermark(doc, item, settings({ layout: 'single', position, margin: 2, rotation: 0 }))[0]
    // 여백 = 500 × 2% = 10px
    expect(at('top-left')).toEqual({ x: 60, y: 20 })
    expect(at('center')).toEqual({ x: 500, y: 250 })
    expect(at('bottom-right')).toEqual({ x: 1000 - 10 - 50, y: 500 - 10 - 10 })
    expect(at('top-center')).toEqual({ x: 500, y: 20 })
    expect(at('middle-left')).toEqual({ x: 60, y: 250 })
  })

  it('회전하면 회전된 bounding box가 여백 안에 들어가도록', () => {
    const [p] = layoutWatermark(doc, item, settings({ layout: 'single', position: 'bottom-right', margin: 0, rotation: 90 }))
    // 90° → 20×100 상자
    expect(p.x).toBeCloseTo(1000 - 10)
    expect(p.y).toBeCloseTo(500 - 50)
  })

  it('이미지 크기가 달라도 상대 위치가 일관 (2배 이미지 = 2배 좌표)', () => {
    const s = settings({ layout: 'single', position: 'bottom-right', margin: 3 })
    const small = layoutWatermark({ width: 800, height: 600 }, { width: 80, height: 20 }, s)[0]
    const large = layoutWatermark({ width: 1600, height: 1200 }, { width: 160, height: 40 }, s)[0]
    expect(large.x).toBeCloseTo(small.x * 2)
    expect(large.y).toBeCloseTo(small.y * 2)
  })
})

describe('layoutWatermark — 타일', () => {
  it.each([0, -30, 45, 90, 180])('간격 0이면 이미지 전체를 빈틈없이 덮는다 (회전 %s°)', (rotation) => {
    const doc = { width: 640, height: 360 }
    const item = { width: 90, height: 24 }
    const placements = layoutWatermark(doc, item, settings({ layout: 'tile', gap: 0, rotation }))
    for (let y = 0; y <= doc.height; y += 8) {
      for (let x = 0; x <= doc.width; x += 8) {
        expect(placements.some((p) => covers(p, item, rotation, x, y))).toBe(true)
      }
    }
  })

  it('이미지와 겹치지 않는 항목은 제외된다', () => {
    const doc = { width: 500, height: 300 }
    const item = { width: 60, height: 20 }
    const placements = layoutWatermark(doc, item, settings({ layout: 'tile', gap: 5, rotation: -30 }))
    const half = rotatedExtent(item.width, item.height, -30)
    for (const p of placements) {
      expect(p.x + half.width / 2).toBeGreaterThanOrEqual(0)
      expect(p.x - half.width / 2).toBeLessThanOrEqual(doc.width)
      expect(p.y + half.height / 2).toBeGreaterThanOrEqual(0)
      expect(p.y - half.height / 2).toBeLessThanOrEqual(doc.height)
    }
  })

  it('간격이 커지면 항목 수가 줄어든다', () => {
    const doc = { width: 1000, height: 1000 }
    const item = { width: 100, height: 30 }
    const dense = layoutWatermark(doc, item, settings({ layout: 'tile', gap: 0 })).length
    const sparse = layoutWatermark(doc, item, settings({ layout: 'tile', gap: 20 })).length
    expect(sparse).toBeLessThan(dense)
  })

  it('아주 작은 항목도 개수 상한을 넘지 않는다', () => {
    const placements = layoutWatermark({ width: 4096, height: 100 }, { width: 2, height: 1 }, settings({ layout: 'tile', gap: 0 }))
    expect(placements.length).toBeGreaterThan(0)
    expect(placements.length).toBeLessThanOrEqual(MAX_TILES)
  })
})

describe('localStorage 저장값', () => {
  it('저장 → 복원 시 설정 유지, 켜짐 상태는 저장하지 않음', () => {
    const s = settings({ text: '사내 한정', color: '#123abc', rotation: -30, layout: 'tile', gap: 12 })
    const raw = serializeWatermark(s)
    expect(JSON.parse(raw)).not.toHaveProperty('enabled')
    expect(parseStoredWatermark(raw)).toEqual({ ...s, enabled: false })
  })

  it('잘못된 값은 기본값/경계값으로', () => {
    expect(parseStoredWatermark(null)).toEqual(DEFAULT_WATERMARK_SETTINGS)
    expect(parseStoredWatermark('{broken')).toEqual(DEFAULT_WATERMARK_SETTINGS)
    const parsed = parseStoredWatermark(
      JSON.stringify({ kind: 'video', color: 'red', opacity: 5, rotation: -999, position: 'nowhere', textSize: 'big' })
    )
    expect(parsed.kind).toBe('text')
    expect(parsed.color).toBe(DEFAULT_WATERMARK_SETTINGS.color)
    expect(parsed.opacity).toBe(1)
    expect(parsed.rotation).toBe(-180)
    expect(parsed.position).toBe(DEFAULT_WATERMARK_SETTINGS.position)
    expect(parsed.textSize).toBe(DEFAULT_WATERMARK_SETTINGS.textSize)
  })
})
