import type { CharEntry } from './types'

/** 검색 결과 상한(너무 많으면 화면이 무거워진다 — 더 구체적으로 검색하도록 안내) */
export const SEARCH_LIMIT = 400

/** 검색어를 공백 기준 토큰으로 나눈다(소문자·NFC). 비어 있으면 빈 배열 */
export function queryTokens(query: string): string[] {
  return query.normalize('NFC').toLowerCase().split(/\s+/).filter(Boolean)
}

const haystacks = new WeakMap<CharEntry, string>()
function haystack(entry: CharEntry): string {
  let h = haystacks.get(entry)
  if (h === undefined) {
    h = `${entry.name} ${entry.keywords ?? ''}`.normalize('NFC').toLowerCase()
    haystacks.set(entry, h)
  }
  return h
}

/** 모든 토큰이 이름·키워드·문자 자체에 부분 일치하면 점수(클수록 앞), 아니면 -1 */
function score(entry: CharEntry, tokens: string[]): number {
  const name = entry.name.normalize('NFC').toLowerCase()
  const h = haystack(entry)
  let best = 0
  for (const t of tokens) {
    if (entry.char === t) best = Math.max(best, 4)
    else if (name === t) best = Math.max(best, 3)
    else if (name.startsWith(t)) best = Math.max(best, 2)
    else if (h.includes(t)) best = Math.max(best, 1)
    else return -1
  }
  return best
}

export interface SearchResult {
  entries: CharEntry[]
  /** 상한 적용 전 일치 개수 */
  total: number
}

/**
 * 키워드 검색. 점수순(문자 일치 > 이름 일치 > 이름 시작 > 키워드), 같으면 원래 순서.
 * `accept`가 false인 항목(예: 현재 환경에서 그릴 수 없는 이모지)은 개수·결과에서 제외한다.
 */
export function searchEntries(
  entries: readonly CharEntry[],
  query: string,
  accept: (entry: CharEntry) => boolean = () => true,
  limit = SEARCH_LIMIT
): SearchResult {
  const tokens = queryTokens(query)
  if (tokens.length === 0) return { entries: [], total: 0 }
  const scored: { entry: CharEntry; score: number; index: number }[] = []
  entries.forEach((entry, index) => {
    const s = score(entry, tokens)
    if (s >= 0 && accept(entry)) scored.push({ entry, score: s, index })
  })
  scored.sort((a, b) => b.score - a.score || a.index - b.index)
  return { entries: scored.slice(0, limit).map((s) => s.entry), total: scored.length }
}
