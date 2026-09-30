'use client'

import type { ReactNode } from 'react'
import {
  ArrowUpRight,
  Check,
  Circle,
  Crop,
  Highlighter,
  MousePointer2,
  Pencil,
  Slash,
  Square,
  Type,
  X,
  FlipHorizontal2,
  FlipVertical2,
  FolderOpen,
  History as HistoryIcon,
  Keyboard,
  Maximize,
  Redo2,
  RotateCcwSquare,
  RotateCwSquare,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { FlipDirection } from '@/lib/toolbox/image-editor/transform'
import { TOOL_LABELS, TOOL_SHORTCUTS, type EditorTool } from '@/lib/toolbox/image-editor/annotations'

const TOOL_ICONS: Record<EditorTool, typeof Pencil> = {
  select: MousePointer2,
  pen: Pencil,
  highlighter: Highlighter,
  line: Slash,
  arrow: ArrowUpRight,
  rect: Square,
  ellipse: Circle,
  text: Type,
}
const TOOLS = Object.keys(TOOL_ICONS) as EditorTool[]
const shortcutOf = (tool: EditorTool) =>
  Object.entries(TOOL_SHORTCUTS).find(([, t]) => t === tool)?.[0].toUpperCase()
import { Button } from '@/components/ui/button'
import { HorizontalScrollEdgeFades } from '@/components/ui/horizontal-scroll-edge-fades'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface EditorToolbarProps {
  canUndo: boolean
  canRedo: boolean
  canRevert: boolean
  onUndo: () => void
  onRedo: () => void
  onOpenNew: () => void
  onRevert: () => void
  onRotate90: (direction: 1 | -1) => void
  onFlip: (direction: FlipDirection) => void
  cropActive: boolean
  onToggleCrop: () => void
  onApplyCrop: () => void
  tool: EditorTool
  onToolChange: (tool: EditorTool) => void
  onShowShortcuts: () => void
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
          // 선택된 도구: 인디고 배경 + 흰 아이콘 (oklch 변수에는 /투명도가 적용되지 않아 단색 사용)
          className={
            pressed
              ? 'h-8 w-8 bg-[var(--penta-indigo)] text-white shadow-sm hover:bg-[var(--penta-indigo)] hover:text-white'
              : 'h-8 w-8'
          }
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

const Divider = () => <div className="mx-1 h-5 w-px shrink-0 bg-border" />

/**
 * 상단 툴바 — 실행취소/다시실행·그리기 도구·자르기·회전/반전·원본 복원·새 이미지 (줌은 캔버스 위 `ZoomControls`).
 * 폭이 좁으면 줄바꿈 대신 한 줄 가로 스크롤(양 끝 페이드) — 캔버스 높이 확보.
 */
export function EditorToolbar({
  canUndo,
  canRedo,
  canRevert,
  onUndo,
  onRedo,
  onOpenNew,
  onRevert,
  onRotate90,
  onFlip,
  cropActive,
  onToggleCrop,
  onApplyCrop,
  tool,
  onToolChange,
  onShowShortcuts,
}: EditorToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <HorizontalScrollEdgeFades edgeFadeVariant="background" className="overflow-hidden rounded-lg border bg-card">
        <div role="toolbar" aria-label="이미지 편집 도구" className="flex w-max min-w-full items-center gap-0.5 px-2 py-1">
          <ToolButton label="실행취소 (Ctrl/⌘+Z)" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="다시실행 (Ctrl/⌘+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </ToolButton>

          <Divider />

          {TOOLS.map((t) => {
            const Icon = TOOL_ICONS[t]
            return (
              <ToolButton key={t} label={`${TOOL_LABELS[t]} (${shortcutOf(t)})`} onClick={() => onToolChange(t)} pressed={!cropActive && tool === t} disabled={cropActive}>
                <Icon className="h-4 w-4" />
              </ToolButton>
            )
          })}

          <Divider />

          <ToolButton label="자르기 (C)" onClick={onToggleCrop} pressed={cropActive}>
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

          <div className="ml-auto flex items-center gap-0.5 pl-2">
            <ToolButton label="원본으로 되돌리기" onClick={onRevert} disabled={!canRevert}>
              <HistoryIcon className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="새 이미지 열기" onClick={onOpenNew}>
              <FolderOpen className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="단축키 (?)" onClick={onShowShortcuts}>
              <Keyboard className="h-4 w-4" />
            </ToolButton>
          </div>
        </div>
      </HorizontalScrollEdgeFades>
    </TooltipProvider>
  )
}

interface ZoomControlsProps {
  zoomPercent: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onActualSize: () => void
}

/** 캔버스 오른쪽 아래에 떠 있는 줌 컨트롤 */
export function ZoomControls({ zoomPercent, onZoomIn, onZoomOut, onFit, onActualSize }: ZoomControlsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-lg border bg-card/95 px-1 py-0.5 shadow-sm">
        <ToolButton label="축소" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </ToolButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 min-w-[52px] px-1.5 text-xs tabular-nums"
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
      </div>
    </TooltipProvider>
  )
}
