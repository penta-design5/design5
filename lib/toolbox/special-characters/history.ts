import { KAOMOJI_MAX_LENGTH } from './data/kaomoji'
import type { CharEntry } from './types'

/** 최근 사용·즐겨찾기에 저장하는 항목(화면에 다시 그리는 데 필요한 값만) */
export interface StoredEntry {
  char: string
  name: string
  emoji?: true
  wide?: true
}

export interface CharHistory {
  recent: StoredEntry[]
  favorites: StoredEntry[]
}

export const RECENT_MAX = 30
export const FAVORITES_MAX = 60
/** 저장값 검증용 상한(이름은 이모지 데이터의 가장 긴 이름보다 넉넉하게) */
const NAME_MAX = 120

export const EMPTY_HISTORY: CharHistory = { recent: [], favorites: [] }

export function toStored(entry: CharEntry): StoredEntry {
  const stored: StoredEntry = { char: entry.char, name: entry.name }
  if (entry.emoji) stored.emoji = true
  if (entry.wide) stored.wide = true
  return stored
}

/** 방금 쓴 항목을 맨 앞으로(이미 있으면 끌어올림), 상한을 넘는 오래된 항목은 버린다. */
export function pushRecent(recent: readonly StoredEntry[], entry: CharEntry): StoredEntry[] {
  return [toStored(entry), ...recent.filter((r) => r.char !== entry.char)].slice(0, RECENT_MAX)
}

export function isFavorite(favorites: readonly StoredEntry[], char: string): boolean {
  return favorites.some((f) => f.char === char)
}

export type ToggleFavoriteResult = { favorites: StoredEntry[]; action: 'added' | 'removed' | 'full' }

/** 즐겨찾기 추가(맨 뒤)·해제. 상한이면 변경 없이 'full'. */
export function toggleFavorite(favorites: readonly StoredEntry[], entry: CharEntry): ToggleFavoriteResult {
  if (isFavorite(favorites, entry.char)) return { favorites: favorites.filter((f) => f.char !== entry.char), action: 'removed' }
  if (favorites.length >= FAVORITES_MAX) return { favorites: [...favorites], action: 'full' }
  return { favorites: [...favorites, toStored(entry)], action: 'added' }
}

function parseEntry(raw: unknown): StoredEntry | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { char, name, emoji, wide } = raw as Record<string, unknown>
  if (typeof char !== 'string' || typeof name !== 'string') return null
  if (char === '' || Array.from(char).length > KAOMOJI_MAX_LENGTH || /[\u0000-\u001F\u007F]/.test(char)) return null
  if (name.trim() === '' || name.length > NAME_MAX) return null
  const entry: StoredEntry = { char, name }
  if (emoji === true) entry.emoji = true
  if (wide === true) entry.wide = true
  return entry
}

function parseList(raw: unknown, max: number): StoredEntry[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: StoredEntry[] = []
  for (const item of raw) {
    const e = parseEntry(item)
    if (!e || seen.has(e.char)) continue
    seen.add(e.char)
    out.push(e)
    if (out.length >= max) break
  }
  return out
}

/** localStorage에서 읽은 JSON 문자열을 검증해 복원한다. 깨졌거나 모양이 다르면 빈 기록. */
export function parseHistory(json: string | null): CharHistory {
  if (!json) return EMPTY_HISTORY
  try {
    const data = JSON.parse(json) as { v?: unknown; recent?: unknown; favorites?: unknown } | null
    if (typeof data !== 'object' || data === null || data.v !== 1) return EMPTY_HISTORY
    return { recent: parseList(data.recent, RECENT_MAX), favorites: parseList(data.favorites, FAVORITES_MAX) }
  } catch {
    return EMPTY_HISTORY
  }
}

export function serializeHistory(history: CharHistory): string {
  return JSON.stringify({ v: 1, recent: history.recent, favorites: history.favorites })
}
