import { formatFileSize } from '@/lib/design-request-attachments'
import type { RenameItem } from './types'

/** 목록 상한(D4) — ZIP을 메모리에서 만들기 때문 */
export const MAX_FILES = 2000
export const MAX_TOTAL_BYTES = 300 * 1024 * 1024
export const LIMIT_LABEL = '최대 2,000개 · 합계 300MB 이하'

export interface AddResult {
  items: RenameItem[]
  added: number
  /** 개수 상한(2,000개)에 걸려 추가하지 않은 수 */
  skippedByCount: number
  /** 합계 용량 상한(300MB)에 걸려 추가하지 않은 수 */
  skippedBySize: number
}

export function totalBytes(items: readonly RenameItem[]): number {
  return items.reduce((sum, item) => sum + item.size, 0)
}

/** 「8개 · 56.4MB」 */
export function summaryLabel(items: readonly RenameItem[]): string {
  return `${items.length.toLocaleString('ko-KR')}개 · ${formatFileSize(totalBytes(items))}`
}

/**
 * 기존 목록 뒤에 파일을 추가한다(불변). 순서대로 보며 상한을 넘는 파일만 건너뛴다 —
 * 큰 파일 하나가 용량을 넘어도 뒤의 작은 파일은 들어갈 수 있다.
 */
export function addFiles(items: readonly RenameItem[], files: readonly File[], createId: () => string): AddResult {
  const next = [...items]
  let total = totalBytes(items)
  let skippedByCount = 0
  let skippedBySize = 0
  for (const file of files) {
    if (next.length >= MAX_FILES) {
      skippedByCount++
      continue
    }
    if (total + file.size > MAX_TOTAL_BYTES) {
      skippedBySize++
      continue
    }
    next.push({ id: createId(), file, originalName: file.name, size: file.size })
    total += file.size
  }
  return { items: next, added: next.length - items.length, skippedByCount, skippedBySize }
}

export function removeItem(items: readonly RenameItem[], id: string): RenameItem[] {
  return items.filter((item) => item.id !== id)
}

/** 추가 결과 안내 문구(상태 줄). `folders`는 끌어다 놓기에서 건너뛴 폴더 수 */
export function addResultMessage(result: Pick<AddResult, 'added' | 'skippedByCount' | 'skippedBySize'>, folders = 0): {
  text: string
  warning: boolean
} {
  const parts: string[] = []
  const skipped = result.skippedByCount + result.skippedBySize
  if (result.added > 0) parts.push(`${result.added.toLocaleString('ko-KR')}개를 목록에 추가했습니다.`)
  if (skipped > 0) {
    const reason =
      result.skippedByCount > 0 && result.skippedBySize > 0
        ? '개수·용량 상한'
        : result.skippedByCount > 0
          ? '개수 상한(최대 2,000개)'
          : '용량 상한(합계 300MB)'
    parts.push(`${skipped.toLocaleString('ko-KR')}개는 ${reason}을 넘어 추가하지 않았습니다.`)
  }
  if (folders > 0) parts.push(`폴더 ${folders.toLocaleString('ko-KR')}개는 추가하지 않았습니다(파일만 추가할 수 있습니다).`)
  if (parts.length === 0) return { text: '추가할 파일이 없습니다.', warning: true }
  if (skipped === 0 && folders === 0) parts.push('확장자와 파일 내용은 그대로 유지됩니다.')
  return { text: parts.join(' '), warning: skipped > 0 || folders > 0 }
}

/** index 행을 delta(-1 위 / +1 아래)만큼 옮긴다(불변). 범위를 벗어나면 그대로 */
export function moveItem(items: readonly RenameItem[], index: number, delta: -1 | 1): RenameItem[] {
  const to = index + delta
  if (index < 0 || index >= items.length || to < 0 || to >= items.length) return [...items]
  const next = [...items]
  ;[next[index], next[to]] = [next[to], next[index]]
  return next
}

const nameCollator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' })

/** 원본 이름 자연 정렬(D6 — `file2` < `file10`). 같은 이름은 기존 순서 유지 */
export function sortByOriginalName(items: readonly RenameItem[]): RenameItem[] {
  return [...items].sort((a, b) => nameCollator.compare(a.originalName, b.originalName))
}
