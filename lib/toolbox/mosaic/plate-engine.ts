import { DetectionEngine } from './detection-engine'
import { PLATE_MODEL, PLATE_SCORE_THRESHOLD } from './plate'

/** 번호판 감지 엔진 — 모델 7.5MB(같은 출처라 브라우저 캐시를 쓴다), 취소하면 다음 감지에서 다시 준비한다 */
export const createPlateEngine = () =>
  new DetectionEngine({
    createWorker: () => new Worker(new URL('./plate.worker.ts', import.meta.url)),
    model: PLATE_MODEL,
    label: '번호판',
    threshold: PLATE_SCORE_THRESHOLD,
  })
