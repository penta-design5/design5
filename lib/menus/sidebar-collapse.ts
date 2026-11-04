/**
 * 사이드바 섹션 접기/펴기 상태 규칙 (순수 함수 + localStorage 입출력).
 * 계획·결정 사항: docs/SIDEBAR_collapse_handoff.md (P2)
 *
 * - 저장값은 "접힌 섹션 id 배열". 기본은 모두 펼침이라 새 섹션이 생겨도 펼쳐진다.
 * - 현재 메뉴가 든 섹션이 접혀 있으면 화면에서만 "일시 펼침"(autoOpen)한다. 저장값은 바꾸지 않는다.
 */

export const SIDEBAR_COLLAPSE_STORAGE_KEY = 'design5:sidebar:collapsed-sections'
/** 같은 문서 안의 다른 사이드바 인스턴스(데스크톱·모바일 시트)에 변경을 알리는 이벤트 */
export const SIDEBAR_COLLAPSE_EVENT = 'design5:sidebar-collapse-change'

export interface SidebarCollapseState {
  /** 저장된 접힌 섹션 id */
  collapsed: string[]
  /** 일시 펼침 중인 섹션 id (현재 메뉴가 든 접힌 섹션) */
  autoOpen: string | null
}

export const INITIAL_COLLAPSE_STATE: SidebarCollapseState = { collapsed: [], autoOpen: null }

export const isSectionOpen = (state: SidebarCollapseState, id: string) =>
  !state.collapsed.includes(id) || state.autoOpen === id

/**
 * 섹션 제목 클릭.
 * - 일시 펼침 중인 섹션을 접으면 일시 펼침만 해제한다(저장값은 이미 접힘).
 * - applyToAll(Alt/Option + 클릭): 클릭한 섹션의 새 상태를 모든 섹션(allIds)에 적용한다.
 */
export function toggleSection(
  state: SidebarCollapseState,
  id: string,
  allIds: readonly string[],
  applyToAll = false
): SidebarCollapseState {
  const willOpen = !isSectionOpen(state, id)

  if (applyToAll) {
    if (willOpen) {
      // 목록에 없는(지금 화면에 없는) 섹션의 저장값은 건드리지 않는다
      return { collapsed: state.collapsed.filter((c) => !allIds.includes(c)), autoOpen: null }
    }
    return { collapsed: unique([...state.collapsed, ...allIds]), autoOpen: null }
  }

  if (willOpen) {
    return { ...state, collapsed: state.collapsed.filter((c) => c !== id) }
  }
  if (state.autoOpen === id) {
    return { ...state, autoOpen: null }
  }
  return { ...state, collapsed: [...state.collapsed, id] }
}

/**
 * 페이지 이동 후: 현재 메뉴가 든 섹션이 접혀 있으면 일시 펼침, 아니면 일시 펼침 해제.
 * skip(플라이아웃에서 이동)이면 펼치지 않는다.
 */
export function applyRoute(
  state: SidebarCollapseState,
  activeSectionId: string | null,
  skip = false
): SidebarCollapseState {
  const autoOpen =
    !skip && activeSectionId && state.collapsed.includes(activeSectionId) ? activeSectionId : null
  return autoOpen === state.autoOpen ? state : { ...state, autoOpen }
}

/** 저장값 파싱 — 형식이 다르면 빈 배열 */
export function parseCollapsedSections(raw: string | null): string[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? unique(value.filter((v): v is string => typeof v === 'string')) : []
  } catch {
    return []
  }
}

/**
 * 저장소를 쓸 수 없을 때의 대체값 — 이번 문서(페이지)에서만 유지된다.
 * 이게 없으면 쓰기 실패 후 변경 이벤트로 다시 읽을 때 빈 값이 돌아와 방금 한 토글이 되돌아간다.
 */
let memoryFallback: string[] = []

/** 시크릿 모드·저장소 차단 환경에서도 예외 없이 동작 (차단 시 메모리 값) */
export function readCollapsedSections(): string[] {
  try {
    return parseCollapsedSections(window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY))
  } catch {
    return memoryFallback
  }
}

export function writeCollapsedSections(collapsed: readonly string[]) {
  memoryFallback = [...collapsed]
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, JSON.stringify(collapsed))
  } catch {
    // 저장 불가 환경 — 이번 화면에서만 유지
  }
  try {
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSE_EVENT))
  } catch {
    // 무시
  }
}

export const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id))

function unique(ids: string[]) {
  return Array.from(new Set(ids))
}
