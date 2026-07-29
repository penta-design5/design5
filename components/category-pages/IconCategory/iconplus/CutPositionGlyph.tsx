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
 * 메인 카드용 프리셋 배지. 두 위치의 글리프를 나란히 보여 어떤 프리셋이 설정됐는지 목록에서 바로 구분한다.
 * 프리셋이 하나도 없으면 두 글리프가 모두 비어 있어 "미설정" 상태로 읽힌다.
 */
export function CutPresetBadge({
  positions,
  className,
}: {
  positions: IconPlusCutPosition[]
  className?: string
}) {
  const configured = CUT_POSITION_ORDER.filter((position) => positions.includes(position))
  const title =
    configured.length > 0
      ? `마스킹 프리셋: ${configured.map((position) => CUT_POSITION_LABELS[position]).join(', ')}`
      : '마스킹 프리셋 없음'

  return (
    <span
      title={title}
      className={cn(
        'pointer-events-auto flex items-center gap-0.5 rounded-md border border-border bg-background/95 px-1 py-0.5 shadow-sm',
        className
      )}
    >
      <span className="sr-only">{title}</span>
      {CUT_POSITION_ORDER.map((position) => (
        <CutPositionGlyph
          key={position}
          position={position}
          filled={positions.includes(position)}
          className="h-3 w-3"
        />
      ))}
    </span>
  )
}
