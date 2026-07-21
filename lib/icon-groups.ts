/**
 * ICON 탭 그룹(카테고리) 단일 소스.
 *
 * Figma "Penta Design System" 아이콘 카탈로그의 14개 섹션 영문 슬러그.
 * (Figma 섹션명은 "한글: 영문" 형태였고, 여기서는 영문 슬러그만 사용한다.)
 *
 * 사용처:
 *  - 업로드 다이얼로그 그룹 드롭다운
 *  - IconTab 그룹 필터(ALL + 14) 및 섹션 헤더 순서
 *  - upload-icon 라우트의 그룹 검증(subtitle 저장)
 *  - 백필 스크립트(scripts/backfill-icon-groups.ts) 검증
 *
 * @see docs/ICON_SVG렌더링_수정_handoff.md §9
 */

/** 그룹 슬러그 순서(섹션 표시 순서). 알파벳 순. */
export const ICON_GROUPS = [
  'ai',
  'automotive',
  'device',
  'finance',
  'general',
  'medical',
  'misc',
  'people',
  'place',
  'security',
  'server',
  'traffic',
  'vehicle',
  'weather',
] as const

export type IconGroup = (typeof ICON_GROUPS)[number]

/** 필터에서 "전체"를 나타내는 값. */
export const ICON_GROUP_ALL = 'ALL' as const

/** 유효한 그룹 슬러그인지 검사한다. */
export function isIconGroup(value: unknown): value is IconGroup {
  return typeof value === 'string' && (ICON_GROUPS as readonly string[]).includes(value)
}
