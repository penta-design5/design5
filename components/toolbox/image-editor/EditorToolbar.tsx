'use client'

import type { ReactNode } from 'react'
import { FolderOpen, Maximize, Redo2, RotateCcw, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface EditorToolbarProps {
  canUndo: boolean
  canRedo: boolean
  canRevert: boolean
  zoomPercent: number
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onActualSize: () => void
  onOpenNew: () => void
  onRevert: () => void
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClick} disabled={disabled} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const Divider = () => <div className="mx-1 h-5 w-px bg-border" />

/** 상단 툴바 — P1: 실행취소/다시실행·줌·새 이미지·원본 복원. 편집 도구는 P2~P5에서 추가 */
export function EditorToolbar({
  canUndo,
  canRedo,
  canRevert,
  zoomPercent,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  onActualSize,
  onOpenNew,
  onRevert,
}: EditorToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 overflow-x-auto rounded-lg border bg-card px-2 py-1">
        <ToolButton label="실행취소 (Ctrl/⌘+Z)" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="다시실행 (Ctrl/⌘+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </ToolButton>

        <Divider />

        <ToolButton label="축소" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </ToolButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 min-w-[56px] px-2 text-xs tabular-nums"
              onClick={onActualSize}
              aria-label="100%로 보기"
            >
              {zoomPercent}%
            </Button>
          </TooltipTrigger>
          <TooltipContent>100%로 보기</TooltipContent>
        </Tooltip>
        <ToolButton label="확대" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="화면에 맞추기" onClick={onFit}>
          <Maximize className="h-4 w-4" />
        </ToolButton>

        <div className="ml-auto flex items-center gap-0.5 pl-2">
          <ToolButton label="원본으로 되돌리기" onClick={onRevert} disabled={!canRevert}>
            <RotateCcw className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="새 이미지 열기" onClick={onOpenNew}>
            <FolderOpen className="h-4 w-4" />
          </ToolButton>
        </div>
      </div>
    </TooltipProvider>
  )
}
