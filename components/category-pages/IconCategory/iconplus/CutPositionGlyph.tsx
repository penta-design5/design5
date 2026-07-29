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
 * 메인 카드용 프리셋 코너 버튼(관리자).
 *
 * 카드의 **실제 코너**(우측 상단 / 우측 하단)에 점을 찍어, 설명 없이도 "어디에 구멍이 설정됐는지"가
 * 읽히게 하고, **점을 누르면 그 위치의 프리셋 탭으로 편집 다이얼로그가 열린다**
 * (별도의 편집 버튼 없이 이 점이 유일한 진입로다).
 *
 * - 카드 hover/포커스 시 두 점이 함께 나타난다(설정 여부는 채운 점 / 점선 빈 점으로 구분).
 * - **hover가 없는 기기(터치)는 항상 표시** — 그렇지 않으면 진입로가 사라진다.
 * - 점 위에 올리면 커서가 포인터로 바뀌고 점이 커진다(클릭 가능함과 조준 위치를 알린다).
 * - 툴팁은 쓰지 않는다. 접근성 이름은 `aria-label`로 제공한다.
 *
 * 클릭 표적이 8px 점보다 커야 하므로 버튼 자체는 20px이고 점은 그 안에 렌더한다.
 * 부모에 `group relative`가 있어야 한다(카드 래퍼).
 */
export function CutPresetCornerDots({
  positions,
  onSelect,
}: {
  positions: IconPlusCutPosition[]
  onSelect: (position: IconPlusCutPosition) => void
}) {
  return (
    <>
      {CUT_POSITION_ORDER.map((position) => {
        const isConfigured = positions.includes(position)
        return (
          <button
            key={position}
            type="button"
            // 툴팁 없이 스크린리더·키보드에 상태와 동작을 전달한다
            aria-label={`${CUT_POSITION_LABELS[position]} 프리셋 ${isConfigured ? '편집' : '추가'}`}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(position)
            }}
            className={cn(
              // 20px 클릭 표적(점은 8px) — 점만으로는 표적이 너무 작다
              'group/dot absolute right-0 z-10 flex h-5 w-5 items-center justify-center rounded-full transition-opacity',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              position === 'TOP_RIGHT' ? 'top-0' : 'bottom-0',
              // 평소 숨김 → 카드 hover/포커스 시 노출. 터치 기기(hover 없음)는 항상 노출
              'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-2 w-2 rounded-full border transition-all',
                // 점 위에 올리면 확대 + 옅은 링 → 두 점 중 어느 쪽을 겨냥했는지 분명해진다
                'group-hover/dot:h-3 group-hover/dot:w-3 group-hover/dot:ring-2 group-hover/dot:ring-penta-sky/40',
                isConfigured
                  ? 'border-penta-blue bg-penta-blue dark:border-penta-sky dark:bg-penta-sky'
                  : 'border-dashed border-neutral-400 bg-transparent group-hover/dot:border-solid group-hover/dot:border-penta-sky'
              )}
            />
          </button>
        )
      })}
    </>
  )
}
