'use client'

import type { ReactNode } from 'react'
import {
  Check,
  Crop,
  X,
  FlipHorizontal2,
  FlipVertical2,
  FolderOpen,
  History as HistoryIcon,
  Maximize,
  Redo2,
  RotateCcwSquare,
  RotateCwSquare,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { FlipDirection } from '@/lib/toolbox/image-editor/transform'
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
  onRotate90: (direction: 1 | -1) => void
  onFlip: (direction: FlipDirection) => void
  cropActive: boolean
  onToggleCrop: () => void
  onApplyCrop: () => void
}

function ToolButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  /** 토글 버튼이면 현재 상태 */
  pressed?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={pressed ? 'h-8 w-8 bg-[var(--penta-indigo)]/10 text-[var(--penta-indigo)]' : 'h-8 w-8'}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={pressed}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const Divider = () => <div className="mx-1 h-5 w-px bg-border" />

/** 상단 툴바 — 실행취소/다시실행·자르기·회전/반전·줌·원본 복원·새 이미지. 그리기 도구는 P4에서 추가 */
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
  onRotate90,
  onFlip,
  cropActive,
  onToggleCrop,
  onApplyCrop,
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

        <ToolButton label="자르기" onClick={onToggleCrop} pressed={cropActive}>
          <Crop className="h-4 w-4" />
        </ToolButton>
        {cropActive && (
          <>
            <ToolButton label="자르기 적용 (Enter)" onClick={onApplyCrop}>
              <Check className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="자르기 취소 (Esc)" onClick={onToggleCrop}>
              <X className="h-4 w-4" />
            </ToolButton>
          </>
        )}

        <Divider />

        <ToolButton label="왼쪽으로 90° 회전" onClick={() => onRotate90(-1)} disabled={cropActive}>
          <RotateCcwSquare className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="오른쪽으로 90° 회전" onClick={() => onRotate90(1)} disabled={cropActive}>
          <RotateCwSquare className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="좌우 반전" onClick={() => onFlip('horizontal')} disabled={cropActive}>
          <FlipHorizontal2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="상하 반전" onClick={() => onFlip('vertical')} disabled={cropActive}>
          <FlipVertical2 className="h-4 w-4" />
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
            <HistoryIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="새 이미지 열기" onClick={onOpenNew}>
            <FolderOpen className="h-4 w-4" />
          </ToolButton>
        </div>
      </div>
    </TooltipProvider>
  )
}
