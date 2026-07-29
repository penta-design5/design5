import { cn } from '@/lib/utils'
import { CUT_POSITION_LABELS, CUT_POSITION_ORDER, type IconPlusCutPosition } from './types'

/**
 * 마스킹 프리셋 위치를 나타내는 미니 다이어그램.
 * 작은 사각형(아이콘) 안에 해당 코너의 점을 찍어 **위치**와 **설정 여부**를 한 번에 읽게 한다.
 * - 설정됨: 점이 채워짐(포인트 색) + 실선 테두리
 * - 미설정: 점이 비어 있음(연회색) + 점선 테두리
 *
 * 편집 다이얼로그 탭과 메인 카드 배지가 **같은 시각 언어**를 쓰도록 공유한다.
 * @see docs/ICON_PLUS_절단마스킹_구현계획.md §7.2
 */
export function CutPositionGlyph({
  position,
  filled,
  className,
}: {
  position: IconPlusCutPosition
  filled: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] border',
        filled ? 'border-solid border-penta-blue/70' : 'border-dashed border-neutral-400/70',
        className
      )}
    >
      <span
        className={cn(
          'absolute right-[1px] h-1.5 w-1.5 rounded-full border',
          position === 'TOP_RIGHT' ? 'top-[1px]' : 'bottom-[1px]',
          filled ? 'border-penta-blue bg-penta-blue' : 'border-neutral-400/80 bg-transparent'
        )}
      />
    </span>
  )
}

/**
 * 메인 카드용 프리셋 표시 점.
 *
 * 카드의 **실제 코너**(우측 상단 / 우측 하단)에 점을 찍어, 위치를 따로 설명하지 않아도
 * "어디에 구멍이 설정됐는지"가 바로 읽히게 한다.
 * - 설정됨: 항상 보이는 채워진 점(포인트 색)
 * - 미설정: 카드 hover/포커스 시에만 보이는 점선 빈 점 → 평소에는 목록이 깔끔하고,
 *   관리자가 카드에 마우스를 올리면 "비어 있는 자리"를 확인할 수 있다.
 *
 * 부모에 `group relative`가 있어야 한다(카드 래퍼).
 */
export function CutPresetCornerDots({ positions }: { positions: IconPlusCutPosition[] }) {
  const configured = CUT_POSITION_ORDER.filter((position) => positions.includes(position))
  const summary =
    configured.length > 0
      ? `마스킹 프리셋: ${configured.map((position) => CUT_POSITION_LABELS[position]).join(', ')}`
      : '마스킹 프리셋 없음'

  return (
    <>
      <span className="sr-only">{summary}</span>
      {CUT_POSITION_ORDER.map((position) => {
        const isConfigured = positions.includes(position)
        return (
          <span
            key={position}
            aria-hidden="true"
            title={`${CUT_POSITION_LABELS[position]} 프리셋 ${isConfigured ? '설정됨' : '없음'}`}
            className={cn(
              'pointer-events-none absolute right-1.5 z-10 h-2 w-2 rounded-full border transition-opacity',
              position === 'TOP_RIGHT' ? 'top-1.5' : 'bottom-1.5',
              isConfigured
                ? 'border-penta-blue bg-penta-blue opacity-100 dark:border-penta-sky dark:bg-penta-sky'
                : 'border-dashed border-neutral-400 bg-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
            )}
          />
        )
      })}
    </>
  )
}
