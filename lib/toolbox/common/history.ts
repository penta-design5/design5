import {
  HISTORY_MAX_STEPS,
  HISTORY_MEMORY_BUDGET_BYTES,
  HISTORY_MIN_STEPS,
} from './constants'

/**
 * 스냅샷 방식 undo/redo (불변 — 각 함수는 새 객체를 반환).
 * 스냅샷(T)은 편집 문서 전체 상태이며, 캔버스 등은 편집 시 새로 만들어 교체한다(제자리 수정 금지).
 */
export interface History<T> {
  past: T[]
  present: T
  future: T[]
}

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] }
}

export function pushHistory<T>(history: History<T>, next: T, limit: number = HISTORY_MAX_STEPS): History<T> {
  const past = [...history.past, history.present]
  return {
    past: past.length > limit ? past.slice(past.length - limit) : past,
    present: next,
    future: [],
  }
}

/**
 * 현재 상태만 교체(기록 추가 없음) — 연속 동작(방향키를 누르고 있는 동안의 이동 등)을 실행취소 1단계로 묶을 때,
 * 첫 동작은 pushHistory, 이어지는 동작은 replacePresent를 쓴다. 다시실행 목록은 비운다.
 */
export function replacePresent<T>(history: History<T>, next: T): History<T> {
  return { past: history.past, present: next, future: [] }
}

export function undoHistory<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history
  const previous = history.past[history.past.length - 1]
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redoHistory<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history
  const [next, ...rest] = history.future
  return {
    past: [...history.past, history.present],
    present: next,
    future: rest,
  }
}

export const canUndo = <T,>(history: History<T>) => history.past.length > 0
export const canRedo = <T,>(history: History<T>) => history.future.length > 0

/** 이미지 크기에 따른 히스토리 단계 상한 — 메모리 예산 안에서 최소 5 ~ 최대 30 */
export function historyLimitFor(width: number, height: number): number {
  const bytesPerSnapshot = Math.max(1, width * height * 4)
  const byBudget = Math.floor(HISTORY_MEMORY_BUDGET_BYTES / bytesPerSnapshot)
  return Math.min(HISTORY_MAX_STEPS, Math.max(HISTORY_MIN_STEPS, byBudget))
}
