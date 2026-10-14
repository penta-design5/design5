/** 이름 규칙(D1·D2·D7) — `{공통 이름}_{순번}.{원래 확장자}` */

export const DEFAULT_START = 1
export const DEFAULT_DIGITS = 3
export const START_MAX = 999_999
export const DIGITS_RANGE = { min: 1, max: 6 } as const
export const BASE_NAME_MAX_LENGTH = 100
/** 공통 이름에 쓸 수 없는 문자(Windows 기준 — macOS·Linux보다 엄격) */
export const FORBIDDEN_CHARS_LABEL = '\\ / : * ? " < > |'
export const ZIP_FALLBACK_NAME = 'renamed_files'

export interface RenameRule {
  baseName: string
  start: number
  digits: number
}

/**
 * 확장자 분리(D2) — 마지막 `.` 뒤만 확장자로 본다(`a.tar.gz` → `gz`).
 * 점으로 시작하는 이름(`.env`)과 점으로 끝나는 이름(`file.`)은 확장자 없음. 대소문자는 그대로.
 */
export function splitExtension(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return { base: name, ext: '' }
  return { base: name.slice(0, dot), ext: name.slice(dot + 1) }
}

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

export interface SanitizedBaseName {
  value: string
  /** 쓸 수 없는 문자를 `_`로 바꿨는지 */
  replacedChars: boolean
  /** 끝의 공백·점을 지웠는지(Windows는 끝 공백·점을 허용하지 않음) */
  trimmedEnd: boolean
  /** Windows 예약 이름(CON 등)이라 뒤에 `_`를 붙였는지 */
  reserved: boolean
}

/** 공통 이름 정리(D7). 비어 있으면 빈 문자열 그대로(번호만 붙음) */
export function sanitizeBaseName(input: string): SanitizedBaseName {
  // 제어 문자도 파일명에 쓸 수 없다
  // eslint-disable-next-line no-control-regex
  const replaced = input.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_')
  const replacedChars = replaced !== input
  const trimmedStart = replaced.replace(/^\s+/, '')
  const trimmed = trimmedStart.replace(/[\s.]+$/, '')
  const trimmedEnd = trimmed !== trimmedStart && trimmed.length > 0
  const reserved = WINDOWS_RESERVED.test(trimmed)
  return { value: reserved ? `${trimmed}_` : trimmed, replacedChars, trimmedEnd, reserved }
}

export type RuleField = 'start' | 'digits'

/** 입력 중인 문자열 → 규칙. 숫자 칸이 올바르지 않으면 해당 칸 오류를 돌려준다 */
export function parseRule(
  baseNameInput: string,
  startText: string,
  digitsText: string
): { ok: true; rule: RenameRule } | { ok: false; errors: Partial<Record<RuleField, string>> } {
  const errors: Partial<Record<RuleField, string>> = {}
  const start = /^\d+$/.test(startText.trim()) ? Number(startText.trim()) : NaN
  if (!Number.isSafeInteger(start) || start > START_MAX) errors.start = `0 ~ ${START_MAX.toLocaleString('ko-KR')} 사이 정수를 입력하세요.`
  const digits = /^\d+$/.test(digitsText.trim()) ? Number(digitsText.trim()) : NaN
  if (!(digits >= DIGITS_RANGE.min && digits <= DIGITS_RANGE.max)) errors.digits = `${DIGITS_RANGE.min} ~ ${DIGITS_RANGE.max} 사이 정수를 입력하세요.`
  if (errors.start || errors.digits) return { ok: false, errors }
  return { ok: true, rule: { baseName: sanitizeBaseName(baseNameInput).value, start, digits } }
}

export function formatNumber(n: number, digits: number): string {
  return String(n).padStart(digits, '0')
}

/** index번째(0부터) 파일의 새 이름 */
export function buildNewName(originalName: string, index: number, rule: RenameRule): string {
  const num = formatNumber(rule.start + index, rule.digits)
  const stem = rule.baseName ? `${rule.baseName}_${num}` : num
  const { ext } = splitExtension(originalName)
  return ext ? `${stem}.${ext}` : stem
}

export function buildNewNames(originalNames: readonly string[], rule: RenameRule): string[] {
  return originalNames.map((name, i) => buildNewName(name, i, rule))
}

/**
 * 자릿수를 넘는 첫 번호(없으면 null). 예: 시작 1·자릿수 3·파일 1,001개 → 1000.
 * 넘는 파일부터 번호 자릿수가 늘어나 이름순 정렬이 어긋날 수 있다 — 경고만 하고 저장은 허용(D7).
 */
export function firstOverflowNumber(count: number, rule: Pick<RenameRule, 'start' | 'digits'>): number | null {
  if (count === 0) return null
  const limit = 10 ** rule.digits
  const last = rule.start + count - 1
  return last >= limit ? Math.max(limit, rule.start) : null
}

/** ZIP 파일명(D8) — `{공통 이름}.zip`, 비면 `renamed_files.zip` */
export function zipFileName(baseName: string): string {
  return `${sanitizeBaseName(baseName).value || ZIP_FALLBACK_NAME}.zip`
}
