'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { IconPlusResource } from './types'

interface IconPlusCardProps {
  resource: IconPlusResource
  isSelected: boolean
  onClick: (id: string) => void
  /** 카드 형태: icon(정사각) | text(가로형 라벨) | main(정사각, 큰 미리보기) */
  variant?: 'icon' | 'text' | 'main'
}

/**
 * ICON+ 리소스 카드.
 * svgContent는 서버(process-svg)에서 sanitize된 값이므로 dangerouslySetInnerHTML로 렌더한다.
 * 색상/두께/크기 적용은 Phase 6에서 확장(현재는 저장된 원본 그대로 표시).
 */
export function IconPlusCard({ resource, isSelected, onClick, variant = 'icon' }: IconPlusCardProps) {
  const isText = variant === 'text'

  return (
    <button
      type="button"
      onClick={() => onClick(resource.id)}
      aria-pressed={isSelected}
      title={resource.name}
      className={cn(
        'group relative flex items-center justify-center rounded-lg border bg-background transition-colors',
        'hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border',
        isText ? 'h-20 px-4' : variant === 'main' ? 'aspect-square p-4' : 'aspect-square p-2'
      )}
    >
      {/* 선택 표시 */}
      {isSelected && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}

      <span
        className={cn(
          'flex items-center justify-center text-foreground',
          isText ? 'h-full w-full [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full' : 'h-full w-full [&_svg]:h-full [&_svg]:w-full'
        )}
        // svgContent는 업로드 시 서버에서 sanitize됨 (lib/svg/process-svg.ts)
        dangerouslySetInnerHTML={{ __html: resource.svgContent }}
      />
    </button>
  )
}
