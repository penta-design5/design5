'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  canRedo as historyCanRedo,
  canUndo as historyCanUndo,
  createHistory,
  pushHistory,
  redoHistory,
  replacePresent,
  undoHistory,
  type History,
} from '@/lib/toolbox/common/history'
import { commitFrom, sameRegions } from '@/lib/toolbox/mosaic/edit-history'
import type { Region } from '@/lib/toolbox/mosaic/types'

/** 영역 목록은 작은 객체 배열이라 스냅샷을 그대로 쌓는다(이미지 크기와 무관) */
const HISTORY_LIMIT = 100

/** 방향키를 누르고 있는 동안을 되돌리기 1단계로 묶는 간격(ms) */
const NUDGE_GROUP_MS = 500

type Updater = (prev: Region[]) => Region[]

/**
 * 영역 목록 + 되돌리기/다시 실행.
 * - commit: 즉시 한 단계로 기록(추가·삭제·좌표 입력·패턴·모양 변경)
 * - live / endLive: 연속 동작(끌기·슬라이더)은 동작 중 현재 상태만 바꾸고, 끝나면 시작 시점을 1단계로 기록
 * - liveGrouped: 방향키처럼 끝을 알 수 없는 연속 동작 — 멈추고 잠시 뒤에 1단계로 기록
 */
export function useMosaicRegions() {
  const [history, setHistory] = useState<History<Region[]>>(() => createHistory<Region[]>([]))
  const historyRef = useRef(history)
  historyRef.current = history
  /** 진행 중인 연속 동작의 시작 시점 목록 */
  const baseRef = useRef<Region[] | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const endLive = useCallback(() => {
    clearTimer()
    const base = baseRef.current
    baseRef.current = null
    if (base) setHistory((h) => commitFrom(h, base, HISTORY_LIMIT))
  }, [])

  const live = useCallback((update: Updater) => {
    if (!baseRef.current) baseRef.current = historyRef.current.present
    setHistory((h) => {
      const next = update(h.present)
      return sameRegions(next, h.present) ? h : replacePresent(h, next)
    })
  }, [])

  const liveGrouped = useCallback(
    (update: Updater) => {
      live(update)
      clearTimer()
      timerRef.current = setTimeout(endLive, NUDGE_GROUP_MS)
    },
    [live, endLive]
  )

  const commit = useCallback(
    (update: Updater) => {
      endLive()
      setHistory((h) => {
        const next = update(h.present)
        return sameRegions(next, h.present) ? h : pushHistory(h, next, HISTORY_LIMIT)
      })
    },
    [endLive]
  )

  const undo = useCallback(() => {
    endLive()
    setHistory(undoHistory)
  }, [endLive])

  const redo = useCallback(() => {
    endLive()
    setHistory(redoHistory)
  }, [endLive])

  /** 새 이미지 — 영역과 기록을 모두 버린다 */
  const reset = useCallback(() => {
    clearTimer()
    baseRef.current = null
    setHistory(createHistory<Region[]>([]))
  }, [])

  useEffect(() => clearTimer, [])

  return {
    regions: history.present,
    canUndo: historyCanUndo(history),
    canRedo: historyCanRedo(history),
    commit,
    live,
    liveGrouped,
    endLive,
    undo,
    redo,
    reset,
  }
}
