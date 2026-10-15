'use client'

import { useEffect } from 'react'

/** 이 페이지 경로 — next.config.js의 COOP·COEP 헤더 대상 */
export const TEXT_EXTRACTOR_PATH = '/toolbox/text-extractor'

/** 격리용 새로 불러오기를 이미 해 봤는지(sessionStorage) — 격리를 지원하지 않는 브라우저(Safari)에서 반복하지 않도록 */
const RELOAD_KEY = 'toolbox:ocr-isolation-reload'
/** 이 문서에서 이미 새로 불러오기를 요청했는가(개발 모드 Strict Mode의 effect 두 번 실행이 「지원 안 함」으로 잘못 기록하지 않도록) */
let reloadRequested = false

/**
 * 교차 출처 격리(OCR 멀티 스레드) 보조.
 * COOP·COEP 헤더는 **문서를 새로 불러올 때만** 적용되는데, 앱은 SPA 이동(Next Link)을 쓴다.
 * - 들어올 때: 격리 없이 들어왔으면 한 번만 새로 불러온다. 그래도 격리가 안 되면(Safari 등) 이 탭에서는 다시 시도하지 않고 1스레드로 동작한다.
 * - 나갈 때: 격리된 문서로 다른 페이지에 SPA 이동하면 그 페이지의 외부 iframe(YouTube 등)이 막힐 수 있다 →
 *   같은 출처 링크 클릭은 전체 이동으로 바꾸고, 그 밖의 SPA 이동(뒤로 가기·router.push)은 이동 직후 새로 불러온다.
 */
export function useCrossOriginIsolation() {
  // 들어올 때
  useEffect(() => {
    let attempted: string | null = null
    try {
      attempted = sessionStorage.getItem(RELOAD_KEY)
    } catch {
      return // 저장소를 쓸 수 없으면 반복 방지를 못 하므로 시도하지 않는다
    }
    if (reloadRequested) return
    if (window.crossOriginIsolated) {
      if (attempted) sessionStorage.removeItem(RELOAD_KEY) // 격리가 되는 브라우저 — 기록을 지운다
      return
    }
    if (attempted === 'pending') {
      sessionStorage.setItem(RELOAD_KEY, 'unsupported') // 새로 불러와도 격리되지 않았다 — 이 탭에서는 1스레드
      return
    }
    if (attempted === 'unsupported') return
    sessionStorage.setItem(RELOAD_KEY, 'pending')
    reloadRequested = true
    window.location.reload()
  }, [])

  // 나갈 때
  useEffect(() => {
    if (!window.crossOriginIsolated) return
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === TEXT_EXTRACTOR_PATH) return
      e.preventDefault()
      e.stopPropagation()
      window.location.assign(url.href)
    }
    // Next Link보다 먼저 받도록 캡처 단계
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      // 링크가 아닌 SPA 이동(뒤로 가기 등)으로 페이지를 벗어났으면, 이동한 주소를 새로 불러와 격리를 푼다.
      // (개발 모드 Strict Mode의 재마운트는 경로가 그대로라 새로 불러오지 않는다)
      setTimeout(() => {
        if (window.location.pathname !== TEXT_EXTRACTOR_PATH) window.location.reload()
      }, 0)
    }
  }, [])
}
