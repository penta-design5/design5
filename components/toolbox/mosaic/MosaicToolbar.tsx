'use client'

import type { ReactNode } from 'react'
import { Circle, Droplets, Eraser, Eye, EyeOff, FolderOpen, Grid3x3, Hand, Keyboard, Loader2, Redo2, ScanFace, Square, SquarePlus, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HorizontalScrollEdgeFades } from '@/components/ui/horizontal-scroll-edge-fades'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { PATTERN_OPTIONS, SHAPE_OPTIONS, type Pattern, type Shape } from '@/lib/toolbox/mosaic/types'

export type MosaicViewMode = 'original' | 'compare' | 'result'

const VIEW_MODES: { value: MosaicViewMode; label: string }[] = [
  { value: 'original', label: '원본' },
  { value: 'compare', label: '비교' },
  { value: 'result', label: '결과' },
]

const SHAPE_ICONS: Record<Shape, typeof Square> = { rect: Square, ellipse: Circle }
const PATTERN_ICONS: Record<Pattern, typeof Square> = { pixel: Grid3x3, blur: Droplets }

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

interface MosaicToolbarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  /** 지금 바꾸는 대상(선택 영역 / 전체 영역 / 새 영역 기본값)의 모양·패턴 */
  shape: Shape
  pattern: Pattern
  /** 「이미지 전체」에서는 모양을 고를 수 없다 */
  shapeDisabled: boolean
  onShapeChange: (shape: Shape) => void
  onPatternChange: (pattern: Pattern) => void
  /** 얼굴 자동 감지 — 감지 중이면 아이콘이 돌고 누를 수 없다(취소는 패널의 버튼) */
  faceBusy: boolean
  onDetectFaces: () => void
  mode: MosaicViewMode
  onModeChange: (mode: MosaicViewMode) => void
  showOutlines: boolean
  outlinesDisabled: boolean
  onShowOutlinesChange: (show: boolean) => void
  /** 영역 추가 — 가운데에 기본 크기 영역을 만든다(끌기 없이 키보드·터치로도 영역을 만들 수 있게) */
  canAddRegion: boolean
  onAddRegion: () => void
  /** 터치 기기에서만 보이는 화면 이동 토글 — 켜면 한 손가락 끌기가 화면 이동이다(꺼 두면 영역 그리기) */
  showPanToggle: boolean
  panMode: boolean
  onPanModeChange: (on: boolean) => void
  canDeleteSelected: boolean
  canClearAll: boolean
  onDeleteSelected: () => void
  onClearAll: () => void
  onOpenNew: () => void
  openNewDisabled: boolean
  onShowShortcuts: () => void
}

/** 마우스로 눌렀다면 포커스를 풀어, 이어서 캔버스에서 누르는 Space·단축키가 이 버튼에 가지 않게 한다(키보드 조작은 그대로) */
const releaseFocus = (e: React.MouseEvent<HTMLElement>) => {
  if (e.detail > 0) e.currentTarget.blur()
}

function ToolButton({
  label,
  tooltip,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string
  /** 툴팁 문구(없으면 label) — 단축키·준비 중 안내를 덧붙일 때 */
  tooltip?: string
  onClick: () => void
  disabled?: boolean
  /** 토글·선택 버튼이면 현재 상태 */
  pressed?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      {/* 비활성 버튼은 포인터 이벤트를 받지 않으므로 span으로 감싸 툴팁(준비 중 안내 등)이 뜨게 한다 */}
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            // 선택된 항목: 인디고 배경 + 흰 아이콘 (이미지 편집 툴바와 같은 스타일)
            className={
              pressed
                ? 'h-8 w-8 bg-[var(--penta-indigo)] text-white shadow-sm hover:bg-[var(--penta-indigo)] hover:text-white'
                : 'h-8 w-8'
            }
            onClick={(e) => {
              onClick()
              releaseFocus(e)
            }}
            disabled={disabled}
            aria-label={label}
            aria-pressed={pressed}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip ?? label}</TooltipContent>
    </Tooltip>
  )
}

const Divider = () => <div className="mx-1 h-5 w-px shrink-0 bg-border" />

/**
 * 캔버스 위 툴바(이미지 편집과 같은 위치·스타일) —
 * 되돌리기/다시 실행 · 모양 · 패턴 · 보기(원본|비교|결과 + 영역 윤곽) · 영역 삭제 · 새 이미지 열기 · 단축키.
 * 폭이 좁으면 줄바꿈 대신 한 줄 가로 스크롤(양 끝 페이드)로 캔버스 높이를 지킨다.
 */
export function MosaicToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  shape,
  pattern,
  shapeDisabled,
  onShapeChange,
  onPatternChange,
  faceBusy,
  onDetectFaces,
  mode,
  onModeChange,
  showOutlines,
  outlinesDisabled,
  onShowOutlinesChange,
  canAddRegion,
  onAddRegion,
  showPanToggle,
  panMode,
  onPanModeChange,
  canDeleteSelected,
  canClearAll,
  onDeleteSelected,
  onClearAll,
  onOpenNew,
  openNewDisabled,
  onShowShortcuts,
}: MosaicToolbarProps) {
  const mod = isMac() ? '⌘' : 'Ctrl+'
  return (
    <TooltipProvider delayDuration={300}>
      <HorizontalScrollEdgeFades edgeFadeVariant="background" className="overflow-hidden rounded-lg border bg-card">
        <div role="toolbar" aria-label="모자이크 도구" className="flex w-max min-w-full items-center gap-0.5 px-2 py-1">
          <ToolButton label="되돌리기" tooltip={`되돌리기 (${mod}Z)`} onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="다시 실행" tooltip={`다시 실행 (${isMac() ? '⇧⌘Z' : 'Ctrl+Shift+Z'})`} onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </ToolButton>

          <Divider />
          <div role="group" aria-label="모양" className="flex items-center gap-0.5">
            {SHAPE_OPTIONS.map((o) => {
              const Icon = SHAPE_ICONS[o.value]
              return (
                <ToolButton
                  key={o.value}
                  label={o.label}
                  tooltip={`모양: ${o.label}${o.available ? '' : ' (준비 중)'}`}
                  onClick={() => onShapeChange(o.value)}
                  disabled={shapeDisabled || !o.available}
                  pressed={!shapeDisabled && shape === o.value}
                >
                  <Icon className="h-4 w-4" />
                </ToolButton>
              )
            })}
          </div>

          <Divider />
          <div role="group" aria-label="패턴" className="flex items-center gap-0.5">
            {PATTERN_OPTIONS.map((o) => {
              const Icon = PATTERN_ICONS[o.value]
              return (
                <ToolButton
                  key={o.value}
                  label={o.label}
                  tooltip={`패턴: ${o.label}${o.available ? '' : ' (준비 중)'}`}
                  onClick={() => onPatternChange(o.value)}
                  disabled={!o.available}
                  pressed={pattern === o.value}
                >
                  <Icon className="h-4 w-4" />
                </ToolButton>
              )
            })}
          </div>

          <Divider />
          <ToolButton label="얼굴 자동 감지" tooltip="얼굴 자동 감지 — 얼굴을 찾아 영역으로 추가" onClick={onDetectFaces} disabled={faceBusy}>
            {faceBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
          </ToolButton>

          <Divider />
          <div className="flex rounded-md bg-muted/50 p-0.5" role="radiogroup" aria-label="보기 방식">
            {VIEW_MODES.map((v) => (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={mode === v.value}
                onClick={(e) => {
                  onModeChange(v.value)
                  releaseFocus(e)
                }}
                className={cn(
                  'rounded px-2.5 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mode === v.value ? 'bg-[var(--penta-indigo)] text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <ToolButton
            label="영역 윤곽 표시"
            tooltip={`${showOutlines ? '영역 윤곽 숨기기' : '영역 윤곽 표시'} (저장에는 포함되지 않음)`}
            onClick={() => onShowOutlinesChange(!showOutlines)}
            disabled={outlinesDisabled}
            pressed={showOutlines}
          >
            {showOutlines ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </ToolButton>

          <Divider />
          <ToolButton label="영역 추가" tooltip="영역 추가 — 이미지 가운데에 영역을 만듭니다" onClick={onAddRegion} disabled={!canAddRegion}>
            <SquarePlus className="h-4 w-4" />
          </ToolButton>
          {showPanToggle && (
            <ToolButton label="화면 이동" tooltip="화면 이동 — 켜면 한 손가락으로 화면을 옮깁니다" onClick={() => onPanModeChange(!panMode)} pressed={panMode}>
              <Hand className="h-4 w-4" />
            </ToolButton>
          )}
          <ToolButton label="선택 영역 삭제" tooltip="선택 영역 삭제 (Delete)" onClick={onDeleteSelected} disabled={!canDeleteSelected}>
            <Trash2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="영역 모두 지우기" onClick={onClearAll} disabled={!canClearAll}>
            <Eraser className="h-4 w-4" />
          </ToolButton>

          <div className="ml-auto flex items-center gap-0.5 pl-2">
            <ToolButton label="새 이미지 열기" onClick={onOpenNew} disabled={openNewDisabled}>
              <FolderOpen className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="단축키" tooltip="단축키 (?)" onClick={onShowShortcuts}>
              <Keyboard className="h-4 w-4" />
            </ToolButton>
          </div>
        </div>
      </HorizontalScrollEdgeFades>
    </TooltipProvider>
  )
}
