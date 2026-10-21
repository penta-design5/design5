'use client'

import { forwardRef } from 'react'
import { ArrowDownAZ, ClipboardPaste, FilePlus2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface RenameToolbarProps {
  summary: string
  limitLabel: string
  addButtonRef: React.RefObject<HTMLButtonElement | null>
  onBrowse: () => void
  onPaste: () => void
  onClearAll: () => void
  onSortByName: () => void
}

/** 터치 기기에서는 버튼을 44px 이상으로 */
const BUTTON = 'h-9 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:min-w-11'

/**
 * 목록 위 도구 줄 — 캡처 붙여넣기·파일 추가·전체 삭제·개수/용량 · 원본 이름순 정렬.
 * 640px 미만에서는 버튼 글자를 숨기고 아이콘만 보인다(이름은 화면 낭독용으로 유지). 상한 문구는 2xl 이상에서만.
 */
export function RenameToolbar({ summary, limitLabel, addButtonRef, onBrowse, onPaste, onClearAll, onSortByName }: RenameToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b p-3 sm:p-4">
      <ToolbarButton icon={<ClipboardPaste className="h-4 w-4" />} label="캡처 붙여넣기" onClick={onPaste} />
      <ToolbarButton ref={addButtonRef} icon={<FilePlus2 className="h-4 w-4" />} label="파일 추가" onClick={onBrowse} />
      <ToolbarButton icon={<Trash2 className="h-4 w-4" />} label="전체 삭제" onClick={onClearAll} />
      <p className="ml-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{summary}</span>
        <span className="hidden 2xl:inline"> · {limitLabel}</span>
      </p>
      <ToolbarButton className="ml-auto" icon={<ArrowDownAZ className="h-4 w-4" />} label="원본 이름순 정렬" onClick={onSortByName} />
    </div>
  )
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  className?: string
  onClick: () => void
}

const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(function ToolbarButton({ icon, label, className, onClick }, ref) {
  return (
    <Button ref={ref} type="button" variant="outline" size="sm" className={cn(BUTTON, 'px-2.5 sm:px-3', className)} onClick={onClick}>
      {icon}
      <span className="sr-only sm:not-sr-only sm:ml-1.5">{label}</span>
    </Button>
  )
})
