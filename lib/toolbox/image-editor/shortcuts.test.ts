import { describe, expect, it } from 'vitest'
import { TOOL_SHORTCUTS } from './annotations'
import { canRedo, createHistory, pushHistory, redoHistory, replacePresent, undoHistory } from '@/lib/toolbox/common/history'
import { NUDGE_STEP, NUDGE_STEP_LARGE, SHORTCUT_GROUPS, nudgeDelta } from './shortcuts'

describe('nudgeDelta', () => {
  it('방향키 → 1px, Shift → 10px, 그 외 키는 null', () => {
    expect(nudgeDelta('ArrowLeft', false)).toEqual({ dx: -NUDGE_STEP, dy: 0 })
    expect(nudgeDelta('ArrowDown', false)).toEqual({ dx: 0, dy: NUDGE_STEP })
    expect(nudgeDelta('ArrowRight', true)).toEqual({ dx: NUDGE_STEP_LARGE, dy: 0 })
    expect(nudgeDelta('ArrowUp', true)).toEqual({ dx: 0, dy: -NUDGE_STEP_LARGE })
    expect(nudgeDelta('a', false)).toBeNull()
  })
})

describe('SHORTCUT_GROUPS', () => {
  it('모든 도구 단축키가 도움말에 포함된다(실제 동작과 목록 일치)', () => {
    const toolKeys = SHORTCUT_GROUPS.find((g) => g.title === '도구')!.items.flatMap((i) => i.keys.flat())
    for (const key of Object.keys(TOOL_SHORTCUTS)) expect(toolKeys).toContain(key.toUpperCase())
    expect(toolKeys).toContain('C')
  })
})

describe('replacePresent — 연속 동작을 실행취소 1단계로', () => {
  it('첫 동작만 기록, 이후는 교체 → 한 번 실행취소로 시작 상태 복귀', () => {
    let h = createHistory(0)
    h = pushHistory(h, 1) // 방향키 첫 입력
    h = replacePresent(h, 2) // 누르고 있는 동안
    h = replacePresent(h, 3)
    expect(h.present).toBe(3)
    expect(h.past).toEqual([0])
    expect(undoHistory(h).present).toBe(0)
  })

  it('다시실행 목록은 비운다', () => {
    let h = pushHistory(pushHistory(createHistory(0), 1), 2)
    h = undoHistory(h)
    expect(canRedo(h)).toBe(true)
    h = replacePresent(h, 9)
    expect(canRedo(h)).toBe(false)
    expect(redoHistory(h)).toEqual(h)
  })
})
