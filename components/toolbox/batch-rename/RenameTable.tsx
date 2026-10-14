'use client'

import { memo } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/design-request-attachments'
import type { RenameItem } from '@/lib/toolbox/batch-rename/types'
import { Button } from '@/components/ui/button'

interface RenameTableProps {
  items: readonly RenameItem[]
  /** 행별 새 이름(규칙 오류면 null — 「—」로 표시) */
  newNames: readonly string[] | null
  /** 좁은 폭(768px 미만) — 표 대신 카드형 목록(원본 이름 → 변경 후 이름 2줄) */
  compact: boolean
  onMove: (id: string, delta: -1 | 1) => void
  onRemove: (id: string) => void
}

/** 터치 기기에서는 버튼을 44px 이상으로(WCAG 2.5.5) */
const TOUCH_ICON = '[@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11'
const TOUCH_TEXT = '[@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:px-3.5'

/**
 * 파일 목록 — 넓으면 표(원본 이름 · 변경 후 이름 · 크기 · 순서·삭제, 머리글 고정), 좁으면 카드형 목록.
 * 표 영역만 스크롤한다. 크기 열은 표에서도 md 미만이면 숨긴다(카드형은 원본 이름 줄 끝에 표시).
 */
export function RenameTable({ items, newNames, compact, onMove, onRemove }: RenameTableProps) {
  if (compact) {
    return (
      <ol className="divide-y text-sm">
        {items.map((item, index) => (
          <RenameCard
            key={item.id}
            item={item}
            index={index}
            isLast={index === items.length - 1}
            newName={newNames?.[index] ?? null}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
      </ol>
    )
  }

  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
      <thead className="sticky top-0 z-10 bg-muted text-left text-xs text-foreground/80">
        <tr>
          <th scope="col" className="w-12 border-b px-3 py-2.5 text-right font-medium">
            #
          </th>
          <th scope="col" className="border-b px-3 py-2.5 font-medium">
            원본 이름
          </th>
          <th scope="col" className="border-b px-3 py-2.5 font-medium">
            변경 후 이름
          </th>
          <th scope="col" className="hidden w-20 border-b px-3 py-2.5 text-right font-medium md:table-cell">
            크기
          </th>
          <th scope="col" className="w-[136px] border-b px-3 py-2.5 font-medium [@media(pointer:coarse)]:w-[172px]">
            순서 · 삭제
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <RenameRow
            key={item.id}
            item={item}
            index={index}
            isLast={index === items.length - 1}
            newName={newNames?.[index] ?? null}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
      </tbody>
    </table>
  )
}

interface RowProps {
  item: RenameItem
  index: number
  isLast: boolean
  newName: string | null
  onMove: (id: string, delta: -1 | 1) => void
  onRemove: (id: string) => void
}

const RenameRow = memo(function RenameRow({ item, index, isLast, newName, onMove, onRemove }: RowProps) {
  return (
    <tr data-row-index={index} className="hover:bg-muted/40">
      <td className="border-b px-3 py-2 text-right tabular-nums text-xs text-muted-foreground">{index + 1}</td>
      <td className="truncate border-b px-3 py-2" title={item.originalName} data-original-name>
        {item.originalName}
      </td>
      <td className="truncate border-b px-3 py-2 text-[var(--penta-indigo)]" title={newName ?? undefined} data-new-name>
        {newName ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="hidden border-b px-3 py-2 text-right tabular-nums text-xs text-muted-foreground md:table-cell">
        {formatFileSize(item.size)}
      </td>
      <td className="border-b px-3 py-1.5">
        <RowActions item={item} index={index} isLast={isLast} onMove={onMove} onRemove={onRemove} />
      </td>
    </tr>
  )
})

/** 좁은 폭 카드 — 1줄: 번호 · 원본 이름 · 크기 / 2줄: 변경 후 이름 / 오른쪽: ↑ ↓ 삭제 */
const RenameCard = memo(function RenameCard({ item, index, isLast, newName, onMove, onRemove }: RowProps) {
  return (
    <li data-row-index={index} className="flex items-center gap-2 px-3 py-2">
      <span className="w-7 shrink-0 text-right tabular-nums text-xs text-muted-foreground" aria-hidden>
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-baseline gap-2 text-xs text-muted-foreground">
          <span className="truncate" title={item.originalName} data-original-name>
            <span className="sr-only">{index + 1}번 원본 </span>
            {item.originalName}
          </span>
          <span className="shrink-0 tabular-nums">{formatFileSize(item.size)}</span>
        </p>
        <p className="truncate text-[var(--penta-indigo)]" title={newName ?? undefined}>
          <span className="sr-only">변경 후 </span>
          <span data-new-name>{newName ?? '—'}</span>
        </p>
      </div>
      <RowActions item={item} index={index} isLast={isLast} onMove={onMove} onRemove={onRemove} />
    </li>
  )
})

function RowActions({ item, index, isLast, onMove, onRemove }: Omit<RowProps, 'newName'>) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn('h-8 w-8', TOUCH_ICON)}
        aria-label={`위로 이동: ${item.originalName}`}
        data-move-up-index={index}
        disabled={index === 0}
        onClick={() => onMove(item.id, -1)}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn('h-8 w-8', TOUCH_ICON)}
        aria-label={`아래로 이동: ${item.originalName}`}
        data-move-down-index={index}
        disabled={isLast}
        onClick={() => onMove(item.id, 1)}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('h-8 px-2.5 text-xs', TOUCH_TEXT)}
        aria-label={`삭제: ${item.originalName}`}
        data-remove-index={index}
        onClick={() => onRemove(item.id)}
      >
        삭제
      </Button>
    </div>
  )
}
