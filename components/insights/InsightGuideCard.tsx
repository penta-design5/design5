'use client'

import { BookOpenText, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  INSIGHT_CARD_ICON_NEUTRAL_COLOR,
  type InsightPostDTO,
} from '@/lib/insights-schemas'

// HW 카드와 동일 폭 (요구사항). 썸네일 없이 제목·설명을 크게 보여주는 텍스트 카드.
const CARD_WIDTH = 320

/**
 * 설명이 한 줄 이하인지 근사 판정한다.
 * 카드 내부 텍스트 폭 = 320 - 48(p-6) - 2(border) = 270px, text-sm(14px) 기준 한글 약 19자/줄.
 * 경계 오판을 피해 18자로 잡고, 전각은 1자·ASCII는 0.5자로 가중한다.
 * (실측 대신 순수 계산을 쓰는 이유: 레이아웃 후 상태 갱신에 따른 깜빡임·폰트 로딩 타이밍 회피)
 */
const ONE_LINE_MAX_WIDTH = 18

function isAtMostOneLine(text: string | null | undefined): boolean {
  if (!text) return true // 설명 없는 카드가 가장 비어 보이므로 포함
  let width = 0
  for (const ch of text) {
    width += ch.charCodeAt(0) < 0x0250 ? 0.5 : 1
    if (width > ONE_LINE_MAX_WIDTH) return false
  }
  return true
}

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
  // 설명이 짧아 비어 보이는 카드에만 우하단 장식 아이콘을 넣는다(긴 설명은 가독성 저하).
  const showGuideIcon = isAtMostOneLine(item.description)

  return (
    <div
      className="group relative flex h-full min-h-[200px] cursor-pointer flex-col rounded-lg border p-6 transition-shadow duration-200 hover:shadow-md bg-gradient-to-br from-white to-[#F7F8FA]"
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

      {/* 장식용. 텍스트보다 먼저 배치하고 아래 텍스트에 relative를 줘서 항상 텍스트가 위에 그려지게 한다. */}
      {showGuideIcon && (
        <BookOpenText
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 right-4 h-16 w-16"
          style={{
            color: item.cardColor || INSIGHT_CARD_ICON_NEUTRAL_COLOR,
            opacity: 0.15,
          }}
        />
      )}

      <h3 className="relative pr-10 text-2xl font-bold leading-snug text-neutral-900 line-clamp-2">
        {item.title || 'N/A'}
      </h3>
      {item.description ? (
        <p className="relative mt-3 text-sm leading-relaxed text-neutral-500 line-clamp-5">
          {item.description}
        </p>
      ) : null}
    </div>
  )
}
