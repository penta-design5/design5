'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  INITIAL_COLLAPSE_STATE,
  SIDEBAR_COLLAPSE_EVENT,
  SIDEBAR_COLLAPSE_STORAGE_KEY,
  applyRoute,
  isSectionOpen,
  markSkipAutoOpenAfterReload,
  nextSkipAutoOpenPath,
  readCollapsedSections,
  sameIds,
  takeSkipAutoOpenAfterReload,
  toggleSection,
  writeCollapsedSections,
  type SidebarCollapseState,
} from '@/lib/menus/sidebar-collapse'
import { findActiveSectionId, type SidebarSection } from '@/lib/menus/sidebar-sections'

interface State {
  collapse: SidebarCollapseState
  /**
   * true면 높이 애니메이션 없이 바로 반영한다.
   * 저장값 불러오기·다른 인스턴스 동기화·자동 펼침은 즉시, 사용자가 제목을 누를 때만 애니메이션.
   * (자동 스크롤이 펼쳐진 뒤의 위치로 계산되도록)
   */
  instant: boolean
}

/** 사이드바 섹션 접기/펴기 상태. 규칙: lib/menus/sidebar-collapse.ts */
export function useSidebarCollapse(sections: SidebarSection[], pathname: string) {
  const [state, setState] = useState<State>({ collapse: INITIAL_COLLAPSE_STATE, instant: true })
  const [hydrated, setHydrated] = useState(false)
  /** 플라이아웃에서 이동한 경로 — 이 경로에 있는 동안은 자동 펼침하지 않는다 */
  const skipAutoOpenPathRef = useRef<string | null>(null)
  const activeSectionId = findActiveSectionId(sections, pathname)

  // 저장값은 마운트 후에 읽는다(SSR·hydration 불일치 방지). 다른 인스턴스·다른 탭의 변경도 따라간다.
  useEffect(() => {
    const sync = () => {
      const collapsed = readCollapsedSections()
      setState((prev) =>
        sameIds(prev.collapse.collapsed, collapsed)
          ? prev
          : { collapse: { ...prev.collapse, collapsed }, instant: true }
      )
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_COLLAPSE_STORAGE_KEY) sync()
    }
    // 플라이아웃에서 문서를 새로 불러오며 이동한 경우(OCR) 이전 문서가 남긴 값.
    // 값은 읽으면 지워지므로, effect가 다시 실행돼도(개발 모드 Strict Mode) 이미 읽은 값을 null로 덮지 않는다.
    const reloadSkipPath = takeSkipAutoOpenAfterReload()
    if (reloadSkipPath !== null) skipAutoOpenPathRef.current = reloadSkipPath
    sync()
    setHydrated(true)
    window.addEventListener(SIDEBAR_COLLAPSE_EVENT, sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(SIDEBAR_COLLAPSE_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // 페이지 이동 후 현재 메뉴가 든 접힌 섹션을 일시 펼침 (플라이아웃에서 이동한 경우 제외)
  useEffect(() => {
    if (!hydrated) return
    skipAutoOpenPathRef.current = nextSkipAutoOpenPath(skipAutoOpenPathRef.current, pathname)
    const skip = skipAutoOpenPathRef.current !== null
    setState((prev) => {
      const collapse = applyRoute(prev.collapse, activeSectionId, skip)
      return collapse === prev.collapse ? prev : { collapse, instant: true }
    })
  }, [pathname, activeSectionId, hydrated])

  const toggle = useCallback(
    (id: string, applyToAll: boolean) => {
      const allIds = sections.filter((s) => s.label !== null).map((s) => s.id)
      const collapse = toggleSection(state.collapse, id, allIds, applyToAll)
      setState({ collapse, instant: false })
      // 상태를 먼저 바꾼 뒤 저장 → 저장 이벤트로 오는 sync는 같은 값이라 무시된다
      if (!sameIds(collapse.collapsed, state.collapse.collapsed)) writeCollapsedSections(collapse.collapsed)
    },
    [sections, state.collapse]
  )

  /**
   * 플라이아웃에서 이동: 그 경로에서는 섹션을 자동으로 펼치지 않는다(접힌 상태 유지).
   * reload(문서를 새로 불러오는 이동)면 새 문서에 sessionStorage로 넘긴다.
   */
  const skipAutoOpenFor = useCallback((href: string, reload: boolean) => {
    let path: string
    try {
      path = new URL(href, window.location.href).pathname
    } catch {
      return
    }
    skipAutoOpenPathRef.current = path
    if (reload) markSkipAutoOpenAfterReload(path)
  }, [])

  return {
    isOpen: (id: string) => isSectionOpen(state.collapse, id),
    toggle,
    instant: state.instant,
    hydrated,
    autoOpen: state.collapse.autoOpen,
    activeSectionId,
    skipAutoOpenFor,
  }
}
