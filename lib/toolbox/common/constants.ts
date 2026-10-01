/**
 * TOOLBOX 이미지 도구 공용 제한값 — 입력 형식·용량·캔버스 픽셀 상한·화면 줌.
 * (확정: docs/TOOLBOX_image-editor_handoff.md §3 · 이미지 분할도 같은 상한 사용 — docs/TOOLBOX_image-splitter_handoff.md §1 D1)
 */

/** 입력 파일 최대 용량: 20MB */
export const MAX_FILE_BYTES = 20 * 1024 * 1024

/** 캔버스 최대 픽셀 수: 16,777,216px(= 4096×4096, Safari 캔버스 한계) — 입력·리사이즈·회전 결과 공통 */
export const MAX_PIXELS = 16_777_216

/** 지원 입력 형식 (GIF는 첫 프레임만 사용) */
export const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
] as const

export const ACCEPTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] as const

/** `<input type="file" accept>` 값 */
export const FILE_INPUT_ACCEPT = [
  ...ACCEPTED_MIME_TYPES,
  ...ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`),
].join(',')

/** 줌 범위 (1 = 100%) */
export const MIN_ZOOM = 0.05
export const MAX_ZOOM = 8
export const ZOOM_STEP = 1.25

/** 실행 취소 기록 최대 단계 (이미지 편집·배경 편집 공용 — lib/toolbox/common/history.ts) */
export const HISTORY_MAX_STEPS = 30

/** 히스토리 최소 보장 단계 (큰 이미지라도 이만큼은 되돌릴 수 있게) */
export const HISTORY_MIN_STEPS = 5

/** 히스토리 스냅샷 전체 메모리 예산(바이트) — 스냅샷 1개 = 가로×세로×4바이트 */
export const HISTORY_MEMORY_BUDGET_BYTES = 512 * 1024 * 1024
