'use client'

import { useState, useEffect } from 'react'

/** Tailwind `md`(768px) 미만 — 모바일 하단 시트 구간. Sheet는 Portal이라 부모 `hidden`만으로는 숨겨지지 않음 */
export function useIsMobileViewport() {
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobileViewport(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isMobileViewport
}
