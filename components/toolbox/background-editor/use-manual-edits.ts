'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  replacePresent,
  undoHistory,
  type History,
} from '@/lib/toolbox/common/history'
import { EditLayers, type EditOp, type PickOp, type Point, type RectOp, type StrokeOp } from '@/lib/toolbox/background-editor/edits'
import type { PickOptions } from '@/lib/toolbox/background-editor/picker'

const EMPTY: readonly EditOp[] = []

/**
 * 수동 보정 상태 — 작업 기록(실행 취소·다시 실행) + 원본 해상도 수정 레이어.
 * - 칠하는 동안에는 새로 생긴 구간만 획 마스크에 그리고(레이어에는 획을 끝낼 때 합침), 화면 갱신은 프레임당 한 번으로 묶는다.
 * - 실행 취소·다시 실행은 빈 레이어에 작업 기록을 다시 그린다.
 * - 새 이미지를 열면 기록과 레이어를 버린다.
 * `apply(cutout)`는 AI 결과(경계 다듬기 후)에 수정을 적용한 캔버스를 돌려준다(`version`이 바뀔 때마다 다시 계산).
 */
export function useManualEdits(original: HTMLCanvasElement | null) {
  const [history, setHistory] = useState<History<readonly EditOp[]>>(() => createHistory(EMPTY))
  const [version, setVersion] = useState(0)
  const layersRef = useRef<EditLayers | null>(null)
  /** 레이어에 지금 그려져 있는 기록 — history.present와 다르면 다시 그린다 */
  const renderedRef = useRef<readonly EditOp[]>(EMPTY)
  const liveRef = useRef<StrokeOp | null>(null)
  const frameRef = useRef(0)

  const bump = useCallback(() => setVersion((v) => v + 1), [])
  /** 칠하는 중 화면 갱신 — 프레임당 한 번 */
  const scheduleBump = useCallback(() => {
    if (frameRef.current) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0
      bump()
    })
  }, [bump])

  useLayoutEffect(() => {
    const layers = original ? new EditLayers(original) : null
    layersRef.current = layers
    renderedRef.current = EMPTY
    liveRef.current = null
    setHistory(createHistory(EMPTY))
    bump()
    return () => layers?.dispose()
  }, [original, bump])

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  // 기록이 바뀌었는데(실행 취소·다시 실행·모두 지우기) 레이어와 다르면 다시 그린다
  useLayoutEffect(() => {
    const layers = layersRef.current
    if (!layers || history.present === renderedRef.current) return
    layers.replay(history.present)
    renderedRef.current = history.present
    bump()
  }, [history.present, bump])

  const commit = useCallback((op: EditOp) => {
    setHistory((h) => {
      const next = [...h.present, op]
      // 칠하는 중에 이미 레이어에 그렸으므로 다시 그리지 않는다
      if (renderedRef.current === h.present) renderedRef.current = next
      return pushHistory(h, next)
    })
  }, [])

  const strokeStart = useCallback(
    (mode: StrokeOp['mode'], point: Point, radius: number, softness: number) => {
      const layers = layersRef.current
      if (!layers) return
      const op: StrokeOp = { kind: 'stroke', mode, radius, softness, points: [point] }
      liveRef.current = op
      layers.drawLive(op)
      scheduleBump()
    },
    [scheduleBump]
  )

  const strokeMove = useCallback(
    (point: Point) => {
      const op = liveRef.current
      const layers = layersRef.current
      if (!op || !layers) return
      op.points.push(point)
      layers.drawLive(op)
      scheduleBump()
    },
    [scheduleBump]
  )

  const strokeEnd = useCallback(() => {
    const op = liveRef.current
    liveRef.current = null
    layersRef.current?.endLive()
    if (op) commit(op)
  }, [commit])

  /** 칠하던 획 버리기(두 번째 손가락이 닿아 핀치로 바뀜 등) */
  const strokeCancel = useCallback(() => {
    if (!liveRef.current) return
    liveRef.current = null
    layersRef.current?.cancelLive()
    bump()
  }, [bump])

  const addRect = useCallback(
    (rect: Omit<RectOp, 'kind'>) => {
      const layers = layersRef.current
      if (!layers) return
      const op: RectOp = { kind: 'rect', ...rect }
      layers.draw(op)
      commit(op)
      bump()
    },
    [commit, bump]
  )

  /** 스포이드 — 클릭한 곳의 원본 색과 비슷한 색을 지운다 */
  const addPick = useCallback(
    (point: Point, options: PickOptions) => {
      const layers = layersRef.current
      if (!layers) return
      const x = Math.round(point.x)
      const y = Math.round(point.y)
      if (x < 0 || y < 0 || x >= layers.width || y >= layers.height) return
      const op: PickOp = { kind: 'pick', x, y, color: layers.sampleColor(x, y), ...options }
      layers.draw(op)
      commit(op)
      bump()
    },
    [commit, bump]
  )

  /** 마지막 작업이 스포이드면 바뀐 범위·허용 범위로 그 결과를 다시 계산한다(실행 취소 단계는 늘리지 않음) */
  const updateLastPick = useCallback((options: PickOptions) => {
    setHistory((h) => {
      const last = h.present[h.present.length - 1]
      if (last?.kind !== 'pick' || (last.range === options.range && last.tolerance === options.tolerance)) return h
      return replacePresent(h, [...h.present.slice(0, -1), { ...last, ...options }])
    })
  }, [])

  const undo = useCallback(() => {
    if (!liveRef.current) setHistory(undoHistory)
  }, [])
  const redo = useCallback(() => {
    if (!liveRef.current) setHistory(redoHistory)
  }, [])
  /** 수정 모두 지우기 — 실행 취소로 되돌릴 수 있다 */
  const clearAll = useCallback(() => {
    setHistory((h) => (h.present.length === 0 ? h : pushHistory(h, EMPTY)))
  }, [])

  const apply = useCallback(
    (cutout: HTMLCanvasElement | null) => {
      const layers = layersRef.current
      if (!cutout || !original || !layers) return cutout
      return layers.apply(cutout, original)
    },
    // version: 레이어 내용이 바뀌었다는 신호
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [original, version]
  )

  const lastOp = history.present[history.present.length - 1]
  return useMemo(
    () => ({
      apply,
      strokeStart,
      strokeMove,
      strokeEnd,
      strokeCancel,
      addRect,
      addPick,
      updateLastPick,
      undo,
      redo,
      clearAll,
      canUndo: canUndo(history),
      canRedo: canRedo(history),
      hasEdits: history.present.length > 0,
      /** 마지막 작업이 스포이드면 그 작업(기준색 표시·설정 반영용) */
      lastPick: lastOp?.kind === 'pick' ? lastOp : null,
    }),
    [apply, strokeStart, strokeMove, strokeEnd, strokeCancel, addRect, addPick, updateLastPick, undo, redo, clearAll, history, lastOp]
  )
}

export type ManualEdits = ReturnType<typeof useManualEdits>
