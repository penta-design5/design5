'use client'

import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { IconPlusResource } from './types'

interface IconPlusCardProps {
  resource: IconPlusResource
  isSelected: boolean
  onClick: (id: string) => void
  /** 카드 형태: icon(정사각) | text(가로형 라벨) | main(정사각, 큰 미리보기) */
  variant?: 'icon' | 'text' | 'main'
  /** 지정 시 카드 우상단에 anchor 편집 버튼 노출(관리자 MAIN 카드). 선택 버튼과 형제로 두어 버튼 중첩 회피 */
  onEditAnchor?: (id: string) => void
}

/**
 * 병합용 텍스트 카드 너비: 높이는 고정하고 종횡비에 따라 가로 폭을 확장한다.
 * (icon-merger `getTextCardWidth` 이식 — 104~176px 범위로 클램프)
 */
function getTextCardWidth(width: number, height: number) {
  const ratio = height > 0 ? width / height : 1
  return Math.min(Math.max(Math.round(64 * ratio + 24), 104), 176)
}

/**
 * ICON+ 리소스 카드.
 * svgContent는 서버(process-svg)에서 sanitize된 값이므로 dangerouslySetInnerHTML로 렌더한다.
 * - MAIN·MERGE_ICON은 `svg-line-preview`로 획(라인) 표시, 병합용 텍스트는 채움(글자) 유지.
 * - 색상/두께/크기 적용은 Phase 6에서 확장(현재는 저장된 원본 그대로 표시).
 */
export function IconPlusCard({
  resource,
  isSelected,
  onClick,
  variant = 'icon',
  onEditAnchor,
}: IconPlusCardProps) {
  const isText = variant === 'text'
  // MAIN·MERGE_ICON은 라인으로, 병합용 텍스트는 채움 그대로
  const isLine = variant === 'main' || variant === 'icon'

  // 텍스트 카드는 종횡비에 따라 가로 폭이 늘어남(높이 고정)
  const style = isText
    ? { width: `${getTextCardWidth(resource.width, resource.height)}px` }
    : undefined

  const selectButton = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onClick(resource.id)}
            aria-pressed={isSelected}
            aria-label={resource.name}
            style={onEditAnchor ? undefined : style}
            className={cn(
              'group relative flex shrink-0 items-center justify-center rounded-lg border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              // hover·선택 시 연한 포인트 배경 + 포인트 테두리
              isSelected
                ? 'border-penta-blue bg-penta-sky/10 dark:border-penta-sky'
                : 'border-border bg-background hover:border-penta-sky/50 hover:bg-penta-sky/10',
              isText
                ? 'h-20 px-4'
                : variant === 'main'
                  ? 'aspect-square w-full p-4'
                  : 'aspect-square w-full p-2'
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center text-foreground',
                isLine && 'svg-line-preview',
                isText
                  ? 'h-full w-full [&_svg]:h-10 [&_svg]:w-auto [&_svg]:max-w-full'
                  : 'h-full w-full [&_svg]:h-full [&_svg]:w-full'
              )}
              // svgContent는 업로드 시 서버에서 sanitize됨 (lib/svg/process-svg.ts)
              dangerouslySetInnerHTML={{ __html: resource.svgContent }}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{resource.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  if (!onEditAnchor) return selectButton

  // anchor 편집 버튼은 선택 버튼과 형제로 배치(버튼 중첩 회피). hover/포커스 시 노출.
  return (
    <div className="group relative w-full">
      {selectButton}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onEditAnchor(resource.id)
        }}
        aria-label={`${resource.name} anchor 편집`}
        className={cn(
          'absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition',
          'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'hover:border-penta-sky hover:text-penta-blue'
        )}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
