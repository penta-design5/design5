/**
 * TOOLBOX 사이드바 메뉴 정의 (DB 카테고리가 아닌 하드코딩 섹션).
 * 구현 완료된 도구만 등록한다 — 새 도구는 이 배열에 1줄 + `app/(dashboard)/toolbox/<slug>/` 페이지 추가.
 * 로드맵·공통 규칙: docs/TOOLBOX_handoff.md (메뉴별 기록은 docs/TOOLBOX_<slug>_handoff.md)
 */
export const TOOLBOX_BASE_PATH = '/toolbox'

export const TOOLBOX_MENU = [
  { slug: 'image-editor', label: '이미지 편집' },
  { slug: 'image-splitter', label: '이미지 분할' },
] as const

export type ToolboxSlug = (typeof TOOLBOX_MENU)[number]['slug']

/** 사이드바 `renderStaticLink`용 경로(앞의 `/` 제외) */
export const toolboxPath = (slug: ToolboxSlug) => `toolbox/${slug}`
