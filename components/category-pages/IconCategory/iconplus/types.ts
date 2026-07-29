/** ICON+ 클라이언트 공용 타입 */

import type { MergeAnchorBasis } from '@/lib/svg/merge-svg'

export type IconPlusType = 'MAIN' | 'MERGE_ICON' | 'MERGE_TEXT'

/** MAIN 아이콘 마스킹 프리셋의 위치 */
export type IconPlusCutPosition = 'TOP_RIGHT' | 'BOTTOM_RIGHT'

/** 프리셋 표시 순서 (우측 상단 → 우측 하단). 패널·편집 다이얼로그가 공유한다. */
export const CUT_POSITION_ORDER: readonly IconPlusCutPosition[] = ['TOP_RIGHT', 'BOTTOM_RIGHT']

/** 사용자에게 보이는 프리셋 라벨 */
export const CUT_POSITION_LABELS: Record<IconPlusCutPosition, string> = {
  TOP_RIGHT: '우측 상단',
  BOTTOM_RIGHT: '우측 하단',
}

/**
 * 위치별 **앵커 기준 코너**.
 * 우측 하단은 앵커에 리소스 좌상단을, 우측 상단은 앵커에 리소스 **좌하단**을 맞춘다
 * → 높이가 다른 리소스들도 우측 상단에서는 아래쪽 변이 앵커에 정렬된다.
 * 위치를 늘릴 때는 이 매핑에 한 줄만 추가한다(DB 컬럼 없이 코드로 결정).
 */
export const CUT_POSITION_ANCHOR_BASIS: Record<IconPlusCutPosition, MergeAnchorBasis> = {
  TOP_RIGHT: 'BOTTOM_LEFT',
  BOTTOM_RIGHT: 'TOP_LEFT',
}

/** 앵커 기준 코너에 맞춘 "맞추기" 버튼 라벨 */
export const ANCHOR_BASIS_ALIGN_LABELS: Record<MergeAnchorBasis, string> = {
  TOP_LEFT: '앵커를 원 좌상단에 맞추기',
  BOTTOM_LEFT: '앵커를 원 좌하단에 맞추기',
}

/** 앵커 기준 코너 설명(편집 다이얼로그 안내문) */
export const ANCHOR_BASIS_DESCRIPTIONS: Record<MergeAnchorBasis, string> = {
  TOP_LEFT: '앵커에 리소스의 좌측 상단이 맞춰집니다.',
  BOTTOM_LEFT: '앵커에 리소스의 좌측 하단이 맞춰집니다(배지가 앵커 위로 쌓입니다).',
}

/**
 * 앵커 기준 코너에 맞춰 절단 원에 정합되는 앵커 좌표를 계산한다.
 * 원의 좌상단(또는 좌하단)에 리소스 코너를 붙인다.
 */
export function getAlignedAnchor(
  cut: { cutX: number; cutY: number; cutRadius: number },
  basis: MergeAnchorBasis
): { anchorX: number; anchorY: number } {
  return {
    anchorX: cut.cutX - cut.cutRadius,
    anchorY: basis === 'BOTTOM_LEFT' ? cut.cutY + cut.cutRadius : cut.cutY - cut.cutRadius,
  }
}

/** MAIN 아이콘의 마스킹 프리셋 1건 — (절단 원 + 병합 앵커) 한 세트 */
export interface IconPlusMainPreset {
  id: string
  position: IconPlusCutPosition
  cutX: number
  cutY: number
  cutRadius: number
  /** 병합 리소스 좌상단 X. 아이콘 밖 오버플로 시 음수 가능 */
  anchorX: number
  /** 병합 리소스 좌상단 Y. 아이콘 밖 오버플로 시 음수 가능 */
  anchorY: number
}

/** GET /api/icon-plus 응답의 리소스 1건 (Prisma IconPlusResource 직렬화 형태) */
export interface IconPlusResource {
  id: string
  type: IconPlusType
  name: string
  svgContent: string
  viewBox: string
  width: number
  height: number
  baseWidth: number | null
  baseHeight: number | null
  /** legacy — 프리셋 없는 pre-cut MAIN 아이콘 전용 */
  anchorX: number | null
  /** legacy — 프리셋 없는 pre-cut MAIN 아이콘 전용 */
  anchorY: number | null
  authorId: string | null
  createdAt: string
  updatedAt: string
  /** MAIN 마스킹 프리셋. MERGE_*는 빈 배열. 표시 순서는 CUT_POSITION_ORDER로 정렬해 사용 */
  presets?: IconPlusMainPreset[]
}

/** 프리셋 배열을 표시 순서(우측 상단 → 우측 하단)로 정렬한다. */
export function sortPresets(presets: IconPlusMainPreset[]): IconPlusMainPreset[] {
  return [...presets].sort(
    (a, b) => CUT_POSITION_ORDER.indexOf(a.position) - CUT_POSITION_ORDER.indexOf(b.position)
  )
}
