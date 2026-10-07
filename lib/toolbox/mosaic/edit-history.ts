import type { History } from '@/lib/toolbox/common/history'
import type { Region } from './types'

/**
 * 연속 동작(끌기·슬라이더·방향키 누르고 있기)을 되돌리기 1단계로 묶는다.
 * 동작 중에는 현재 상태만 교체(replacePresent)하고, 동작이 끝나면 **시작 시점의 상태(base)**를 기록으로 넣는다.
 * 아무것도 바뀌지 않았으면(base와 같으면) 기록을 늘리지 않는다.
 */
export function commitFrom<T>(history: History<T>, base: T, limit: number): History<T> {
  if (history.present === base) return history
  const past = [...history.past, base]
  return { past: past.length > limit ? past.slice(past.length - limit) : past, present: history.present, future: [] }
}

/** 영역 목록이 내용까지 같은지 — 같은 값으로 다시 바꾸는 입력이 기록을 늘리지 않게 한다 */
export function sameRegions(a: readonly Region[], b: readonly Region[]): boolean {
  return (
    a === b ||
    (a.length === b.length &&
      a.every((r, i) => {
        const o = b[i]
        return (
          r.id === o.id &&
          r.x === o.x &&
          r.y === o.y &&
          r.width === o.width &&
          r.height === o.height &&
          r.pattern === o.pattern &&
          r.shape === o.shape &&
          r.strength === o.strength &&
          Boolean(r.whole) === Boolean(o.whole)
        )
      }))
  )
}
