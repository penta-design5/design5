'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { IconPlusCard } from './IconPlusCard'
import type { IconPlusResource } from './types'

interface ResourceSectionProps {
  title: string
  description: string
  /** 추가 버튼 라벨 (예: '메인 추가' / '아이콘 추가' / '텍스트 추가'). 관리자만 노출 */
  addLabel: string
  resources: IconPlusResource[]
  selectedIds: Set<string>
  loading?: boolean
  isAdmin: boolean
  deleting?: boolean
  cardVariant?: 'icon' | 'text' | 'main'
  /** 카드 그리드 Tailwind 클래스 */
  gridClassName: string
  /** 컨테이너 추가 클래스 */
  className?: string
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onDelete: () => void
  onAdd: () => void
  /** 지정 시 각 카드에 anchor 편집 버튼 노출(관리자 MAIN 섹션 전용) */
  onEditAnchor?: (id: string) => void
}

/**
 * ICON+ 리소스 섹션 (메인 아이콘 / 병합용 아이콘 / 병합용 텍스트 공용).
 * 카드형 컨테이너: 헤더(제목·설명·추가 버튼) + 액션 행(선택 개수/해제/삭제 + 더보기) + 카드 그리드.
 */
export function ResourceSection({
  title,
  description,
  addLabel,
  resources,
  selectedIds,
  loading = false,
  isAdmin,
  deleting = false,
  cardVariant = 'icon',
  gridClassName,
  className,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onAdd,
  onEditAnchor,
}: ResourceSectionProps) {
  const selectedCount = selectedIds.size

  return (
    <section
      className={cn(
        'flex flex-col rounded-xl border border-border bg-background p-5',
        className
      )}
    >
      {/* 헤더: 제목/설명 + 추가 버튼 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="shrink-0" onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </div>

      {/* 액션 행: 선택 안내 / 선택 액션 + 더보기 */}
      <div className="mt-4 flex min-h-8 items-center justify-between gap-2">
        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="shrink-0 whitespace-nowrap border-transparent bg-penta-sky/20 text-penta-blue hover:bg-penta-sky/20 dark:text-penta-sky">
              {selectedCount}개 선택됨
            </Badge>
            <Button variant="secondary" size="sm" onClick={onDeselectAll} disabled={deleting}>
              선택 해제
            </Button>
            {isAdmin && (
              <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    삭제 중
                  </>
                ) : (
                  '삭제'
                )}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            항목 선택 후 선택 해제와 삭제 액션이 표시됩니다.
          </p>
        )}

        {isAdmin && resources.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="더보기">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSelectAll}>전체 선택</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 카드 그리드 / 상태 */}
      <div className="mt-4 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-10">
            <p className="text-sm text-muted-foreground">리소스가 없습니다.</p>
          </div>
        ) : (
          <div className={gridClassName}>
            {resources.map((resource) => (
              <IconPlusCard
                key={resource.id}
                resource={resource}
                isSelected={selectedIds.has(resource.id)}
                onClick={onToggleSelect}
                variant={cardVariant}
                onEditAnchor={onEditAnchor}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
