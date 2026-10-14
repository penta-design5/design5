/** 조합 입력창 최대 글자 수(UTF-16 길이) — 넘으면 더 붙이지 않는다 */
export const COMPOSE_MAX_LENGTH = 1000

export interface ComposeInsert {
  char: string
  /** 텍스트 이모티콘 등 폭이 가변인 항목 */
  wide?: boolean
}

export interface ComposeResult {
  text: string
  /** 삽입 직후 커서 위치 */
  caret: number
}

const clamp = (n: number, max: number) => Math.min(Math.max(Number.isFinite(n) ? n : 0, 0), max)

/**
 * 선택 범위(start~end)를 대체해 문자를 끼워 넣는다. 선택이 없으면(start === end) 커서 위치에 삽입한다.
 * - 텍스트 이모티콘은 앞 글자와 붙어 읽기 어려우므로, 앞에 글자가 있고 공백으로 끝나지 않으면 **공백 한 칸을 먼저 넣는다**(특수 문자·이모지는 그대로 붙인다).
 * - 결과가 {@link COMPOSE_MAX_LENGTH}를 넘으면 null(호출 쪽에서 안내).
 */
export function insertAtSelection(text: string, start: number, end: number, insert: ComposeInsert, max = COMPOSE_MAX_LENGTH): ComposeResult | null {
  const s = clamp(Math.min(start, end), text.length)
  const e = clamp(Math.max(start, end), text.length)
  const before = text.slice(0, s)
  const after = text.slice(e)
  const needsSpace = insert.wide === true && before !== '' && !/\s$/.test(before)
  const inserted = (needsSpace ? ' ' : '') + insert.char
  const next = before + inserted + after
  if (next.length > max) return null
  return { text: next, caret: before.length + inserted.length }
}

/** 화면에 표시하는 글자 수(grapheme 기준 — 이모지·결합 문자 한 개를 1로 센다). */
export function graphemeCount(text: string): number {
  if (text === '') return 0
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    let n = 0
    for (const _ of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) n++
    return n
  }
  return Array.from(text).length
}
