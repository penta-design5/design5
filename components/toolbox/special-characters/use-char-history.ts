'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { EMPTY_HISTORY, isFavorite, pushRecent, toggleFavorite, type CharHistory, type ToggleFavoriteResult } from '@/lib/toolbox/special-characters/history'
import { loadHistory, saveHistory } from '@/lib/toolbox/special-characters/storage'
import type { CharEntry } from '@/lib/toolbox/special-characters/types'

/**
 * 최근 사용·즐겨찾기 상태(localStorage 영속). 페이지는 ssr:false라 첫 렌더에서 바로 읽어도 하이드레이션 불일치가 없다.
 * 저장은 변경 때만 하고, 저장소를 쓸 수 없어도 이번 방문 동안은 메모리 상태로 정상 동작한다.
 */
export function useCharHistory() {
  const [history, setHistory] = useState<CharHistory>(() => (typeof window === 'undefined' ? EMPTY_HISTORY : loadHistory()))
  const initial = useRef(history)

  useEffect(() => {
    // 처음 읽은 값 그대로면 쓰지 않는다 — 읽기만 한 방문이 저장값(깨진 값·다른 탭이 쓴 값 포함)을 덮어쓰지 않도록.
    // 플래그 대신 객체 동일성으로 비교해야 개발 모드 StrictMode의 effect 이중 실행에서도 안전하다.
    if (history === initial.current) return
    saveHistory(history)
  }, [history])

  const recordUse = useCallback((entry: CharEntry) => setHistory((h) => ({ ...h, recent: pushRecent(h.recent, entry) })), [])
  const clearRecent = useCallback(() => setHistory((h) => ({ ...h, recent: [] })), [])

  // 상한(full) 여부를 호출 쪽에서 알 수 있게 최신 상태를 ref로 읽어 결과를 동기 반환한다
  const latest = useRef(history)
  latest.current = history
  const toggleFav = useCallback((entry: CharEntry): ToggleFavoriteResult['action'] => {
    const result = toggleFavorite(latest.current.favorites, entry)
    if (result.action !== 'full') {
      latest.current = { ...latest.current, favorites: result.favorites }
      setHistory((h) => ({ ...h, favorites: result.favorites }))
    }
    return result.action
  }, [])
  const isFav = useCallback((char: string) => isFavorite(history.favorites, char), [history.favorites])

  return { history, recordUse, clearRecent, toggleFav, isFav }
}
