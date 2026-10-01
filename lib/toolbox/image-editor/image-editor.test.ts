import { describe, expect, it } from 'vitest'
import {
  canRedo,
  canUndo,
  createHistory,
  historyLimitFor,
  pushHistory,
  redoHistory,
  undoHistory,
} from '@/lib/toolbox/common/history'

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
