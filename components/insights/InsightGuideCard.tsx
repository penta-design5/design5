'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { InsightPostDTO } from '@/lib/insights-schemas'

// HW 카드와 동일 폭 (요구사항). 썸네일 없이 제목·설명을 크게 보여주는 텍스트 카드.
const CARD_WIDTH = 320

interface InsightGuideCardProps {
  item: InsightPostDTO
  onClick: (id: string) => void
  onEdit?: (item: InsightPostDTO) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

export function InsightGuideCard({
  item,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
}: InsightGuideCardProps) {
  return (
    <div
      className="group relative flex min-h-[200px] cursor-pointer flex-col rounded-lg border p-6 transition-shadow duration-200 hover:shadow-md bg-gradient-to-br from-white to-[#F7F8FA]"
      style={{
        width: CARD_WIDTH,
        // 색상 선택 시에만 하단에 3px 컬러 액센트(미선택은 균일 1px 테두리 유지)
        ...(item.cardColor
          ? { borderBottomWidth: '3px', borderBottomColor: item.cardColor }
          : {}),
      }}
      onClick={() => onClick(item.id)}
    >
      {showActions && (onEdit || onDelete) && (
        <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item)
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      <h3 className="pr-10 text-2xl font-bold leading-snug text-neutral-900 line-clamp-2">
        {item.title || 'N/A'}
      </h3>
      {item.description ? (
        <p className="mt-3 text-sm leading-relaxed text-neutral-500 line-clamp-5">
          {item.description}
        </p>
      ) : null}
    </div>
  )
}
