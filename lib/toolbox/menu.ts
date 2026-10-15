/**
 * TOOLBOX 사이드바 메뉴 정의 (DB 카테고리가 아닌 하드코딩 섹션).
 * 구현 완료된 도구만 등록한다 — 새 도구는 이 배열에 1줄 + `app/(dashboard)/toolbox/<slug>/` 페이지 추가.
 * 로드맵·공통 규칙: docs/TOOLBOX_handoff.md (메뉴별 기록은 docs/TOOLBOX_<slug>_handoff.md)
 */
export const TOOLBOX_BASE_PATH = '/toolbox'

export const TOOLBOX_MENU = [
  { slug: 'image-editor', label: '이미지 편집' },
  { slug: 'image-splitter', label: '이미지 분할' },
  { slug: 'background-editor', label: '배경 편집' },
  { slug: 'mosaic', label: '이미지 모자이크' },
  { slug: 'qr-code', label: 'QR 코드 생성' },
  { slug: 'special-characters', label: '특수 문자 및 이모티콘' },
  { slug: 'batch-rename', label: '파일명 일괄 변경' },
  // 이 페이지만 교차 출처 격리 헤더(OCR 멀티 스레드)가 있어, 문서를 새로 불러와야 적용된다 → 전체 이동 링크(SPA로 들어온 뒤 다시 불러오는 깜박임 방지)
  { slug: 'text-extractor', label: '텍스트추출(OCR)', fullReload: true },
] as const

export type ToolboxSlug = (typeof TOOLBOX_MENU)[number]['slug']

/** 전체 이동(새로 불러오기)으로 들어가야 하는 메뉴인가 */
export const toolboxFullReload = (menu: (typeof TOOLBOX_MENU)[number]) => 'fullReload' in menu && menu.fullReload

/** 사이드바 `renderStaticLink`용 경로(앞의 `/` 제외) */
export const toolboxPath = (slug: ToolboxSlug) => `toolbox/${slug}`
