/**
 * 「이미지 편집」 전용 상수 (공용 제한값은 lib/toolbox/common/constants.ts)
 */

/** 히스토리 최대 단계 */
export const HISTORY_MAX_STEPS = 30

/** 히스토리 최소 보장 단계 (큰 이미지라도 이만큼은 되돌릴 수 있게) */
export const HISTORY_MIN_STEPS = 5

/** 히스토리 스냅샷 전체 메모리 예산(바이트) — 스냅샷 1개 = 가로×세로×4바이트 */
export const HISTORY_MEMORY_BUDGET_BYTES = 512 * 1024 * 1024
