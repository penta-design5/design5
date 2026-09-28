import { describe, expect, it } from 'vitest'
import { MAX_FILE_BYTES, MAX_ZOOM, MIN_ZOOM } from './constants'
import { validateImageFile, validatePixelCount } from './load'
import {
  canRedo,
  canUndo,
  createHistory,
  historyLimitFor,
  pushHistory,
  redoHistory,
  undoHistory,
} from './history'
import { centerPosition, clampZoom, fitZoom, zoomAroundPoint } from './view'
import { buildExportFileName, defaultExportBaseName } from './export'

describe('validateImageFile', () => {
  const file = (name: string, type: string, size = 1000) => ({ name, type, size })

  it('지원 형식은 통과', () => {
    expect(validateImageFile(file('a.png', 'image/png'))).toBeNull()
    expect(validateImageFile(file('a.jpg', 'image/jpeg'))).toBeNull()
    expect(validateImageFile(file('a.webp', 'image/webp'))).toBeNull()
    expect(validateImageFile(file('a.gif', 'image/gif'))).toBeNull()
    expect(validateImageFile(file('a.bmp', 'image/bmp'))).toBeNull()
  })

  it('MIME이 비어 있으면 확장자로 판단', () => {
    expect(validateImageFile(file('a.JPEG', ''))).toBeNull()
    expect(validateImageFile(file('a.txt', ''))).not.toBeNull()
  })

  it('HEIC는 전용 안내', () => {
    expect(validateImageFile(file('a.heic', 'image/heic'))).toContain('HEIC')
    expect(validateImageFile(file('a.HEIF', ''))).toContain('HEIC')
  })

  it('미지원 형식·용량 초과·빈 파일 거부', () => {
    expect(validateImageFile(file('a.svg', 'image/svg+xml'))).not.toBeNull()
    expect(validateImageFile(file('a.pdf', 'application/pdf'))).not.toBeNull()
    expect(validateImageFile(file('a.png', 'image/png', MAX_FILE_BYTES))).toBeNull()
    expect(validateImageFile(file('a.png', 'image/png', MAX_FILE_BYTES + 1))).toContain('20MB')
    expect(validateImageFile(file('a.png', 'image/png', 0))).not.toBeNull()
  })
})

describe('validatePixelCount', () => {
  it('4096×4096까지 허용, 초과 거부', () => {
    expect(validatePixelCount(4096, 4096)).toBeNull()
    expect(validatePixelCount(8192, 2048)).toBeNull()
    expect(validatePixelCount(4097, 4096)).not.toBeNull()
  })
})

describe('history', () => {
  it('push → undo → redo', () => {
    let h = createHistory(1)
    expect(canUndo(h)).toBe(false)
    h = pushHistory(h, 2)
    h = pushHistory(h, 3)
    expect(h.present).toBe(3)
    h = undoHistory(h)
    expect(h.present).toBe(2)
    expect(canRedo(h)).toBe(true)
    h = redoHistory(h)
    expect(h.present).toBe(3)
    expect(canRedo(h)).toBe(false)
  })

  it('undo 후 push하면 redo 기록은 사라짐', () => {
    let h = pushHistory(pushHistory(createHistory('a'), 'b'), 'c')
    h = undoHistory(h)
    h = pushHistory(h, 'd')
    expect(h.present).toBe('d')
    expect(h.future).toEqual([])
    expect(h.past).toEqual(['a', 'b'])
  })

  it('비어 있을 때 undo/redo는 그대로', () => {
    const h = createHistory(0)
    expect(undoHistory(h)).toBe(h)
    expect(redoHistory(h)).toBe(h)
  })

  it('상한을 넘으면 가장 오래된 기록부터 버림', () => {
    let h = createHistory(0)
    for (let i = 1; i <= 10; i++) h = pushHistory(h, i, 3)
    expect(h.past).toEqual([7, 8, 9])
    expect(h.present).toBe(10)
  })

  it('이미지 크기에 따라 5~30단계', () => {
    expect(historyLimitFor(1000, 1000)).toBe(30)
    expect(historyLimitFor(4096, 4096)).toBe(8)
    expect(historyLimitFor(100_000, 100_000)).toBe(5)
  })
})

describe('view', () => {
  it('clampZoom 범위', () => {
    expect(clampZoom(100)).toBe(MAX_ZOOM)
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('fitZoom: 큰 이미지는 축소, 작은 이미지는 100% 유지', () => {
    // 여백 24px×2를 뺀 가용 폭 1024px / 이미지 2048px = 0.5
    expect(fitZoom(2048, 1024, 1072, 1072, 24)).toBeCloseTo(0.5)
    expect(fitZoom(100, 100, 1000, 800)).toBe(1)
  })

  it('centerPosition', () => {
    expect(centerPosition(200, 100, 1000, 500, 1)).toEqual({ x: 400, y: 200 })
    expect(centerPosition(200, 100, 1000, 500, 2)).toEqual({ x: 300, y: 150 })
  })

  it('zoomAroundPoint: 기준점 아래의 이미지 좌표가 유지됨', () => {
    const pos = { x: 100, y: 50 }
    const anchor = { x: 300, y: 250 }
    const next = zoomAroundPoint(pos, 1, 2, anchor)
    // 기준점의 이미지 좌표 = (anchor - pos) / zoom
    expect((anchor.x - next.x) / 2).toBeCloseTo((anchor.x - pos.x) / 1)
    expect((anchor.y - next.y) / 2).toBeCloseTo((anchor.y - pos.y) / 1)
  })
})

describe('export file name', () => {
  it('확장자 제거 + _edited', () => {
    expect(defaultExportBaseName('photo.final.JPG')).toBe('photo.final_edited')
    expect(defaultExportBaseName('clipboard')).toBe('clipboard_edited')
    expect(defaultExportBaseName('.png')).toBe('image_edited')
  })

  it('형식별 확장자 + 금지 문자 치환', () => {
    expect(buildExportFileName('a_edited', 'png')).toBe('a_edited.png')
    expect(buildExportFileName('a_edited', 'jpeg')).toBe('a_edited.jpg')
    expect(buildExportFileName('a_edited', 'webp')).toBe('a_edited.webp')
    expect(buildExportFileName('a/b:c', 'png')).toBe('a_b_c.png')
    expect(buildExportFileName('   ', 'png')).toBe('image_edited.png')
  })
})
