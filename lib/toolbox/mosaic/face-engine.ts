import { DetectionEngine } from './detection-engine'
import { FACE_MODEL, FACE_SCORE_THRESHOLD } from './face'

/** 얼굴 감지 엔진 — 모델 0.23MB, 취소하면 다음 감지에서 다시 준비한다 */
export const createFaceEngine = () =>
  new DetectionEngine({
    createWorker: () => new Worker(new URL('./face.worker.ts', import.meta.url)),
    model: FACE_MODEL,
    label: '얼굴',
    threshold: FACE_SCORE_THRESHOLD,
  })
