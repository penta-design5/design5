'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadEmojiCatalog, type EmojiCatalog } from '@/lib/toolbox/special-characters/data/emoji'

export type EmojiCatalogState =
  | { status: 'idle' | 'loading' }
  | { status: 'error' }
  | { status: 'ready'; catalog: EmojiCatalog }

/**
 * 이모지 카탈로그를 필요할 때(`enabled`가 처음 true가 될 때) 한 번 불러온다.
 * 데이터·감지·국기 글꼴 준비는 `loadEmojiCatalog`가 처리하고 결과는 모듈에 캐시된다.
 */
export function useEmojiCatalog(enabled: boolean): EmojiCatalogState & { retry: () => void } {
  const [state, setState] = useState<EmojiCatalogState>({ status: 'idle' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }))
    loadEmojiCatalog().then(
      (catalog) => !cancelled && setState({ status: 'ready', catalog }),
      () => !cancelled && setState({ status: 'error' })
    )
    return () => {
      cancelled = true
    }
  }, [enabled, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, retry }
}
