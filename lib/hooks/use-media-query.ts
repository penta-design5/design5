'use client'

import { useEffect, useState } from 'react'

/** CSS 미디어 쿼리 일치 여부. SSR·첫 렌더에서는 false (마운트 후 동기화) */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setMatches(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [query])

  return matches
}
