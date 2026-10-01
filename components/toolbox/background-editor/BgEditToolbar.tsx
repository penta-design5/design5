'use client'

import { BoxSelect, Eraser, Hand, Paintbrush, Pipette, Redo2, Undo2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { EditTool } from './BgPreview'

export const EDIT_TOOLS: { value: EditTool; label: string; shortcut: string; icon: LucideIcon }[] = [
  { value: 'pan', label: '화면 이동', shortcut: 'H', icon: Hand },
  { value: 'erase', label: '지우기', shortcut: 'E', icon: Eraser },
  { value: 'restore', label: '복원', shortcut: 'R', icon: Paintbrush },
  { value: 'rect', label: '사각형 영역', shortcut: 'M', icon: BoxSelect },
  { value: 'picker', label: '스포이드 색 제거', shortcut: 'I', icon: Pipette },
]

interface BgEditToolbarProps {
  tool: EditTool
  onToolChange: (tool: EditTool) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** 미리보기 위 수동 보정 도구 막대 — 도구 선택 + 실행 취소·다시 실행 */
export function BgEditToolbar({ tool, onToolChange, canUndo, canRedo, onUndo, onRedo }: BgEditToolbarProps) {
  const mod = isMac() ? '⌘' : 'Ctrl+'
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 rounded-lg border bg-card/95 p-0.5 shadow-sm" data-testid="bg-edit-toolbar">
        <div className="flex" role="radiogroup" aria-label="수동 보정 도구">
          {EDIT_TOOLS.map((t) => (
            <Tooltip key={t.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={tool === t.value}
                  aria-label={t.label}
                  data-tool={t.value}
                  onClick={() => onToolChange(t.value)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    tool === t.value ? 'bg-[var(--penta-indigo)] text-white' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <t.icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {t.label} ({t.shortcut})
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="mx-0.5 h-5 w-px bg-border" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo} aria-label="실행 취소">
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>실행 취소 ({mod}Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo} aria-label="다시 실행">
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>다시 실행 ({isMac() ? '⇧⌘Z' : 'Ctrl+Shift+Z'})</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
