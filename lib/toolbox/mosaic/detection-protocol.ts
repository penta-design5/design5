import type { FaceBox } from './face'

/** 감지 Worker(얼굴·번호판 공용) ↔ 메인 스레드 메시지 */

export type DetectionWorkerRequest =
  | {
      type: 'load'
      /** 모델 바이트(전송 후 메인 쪽 버퍼는 비워진다) */
      model: ArrayBuffer
      wasmBaseUrl: string
    }
  | {
      type: 'detect'
      id: number
      /** 감지할 이미지(원본 해상도, 전송 후 메인 쪽은 비워진다) */
      bitmap: ImageBitmap
      threshold: number
      /** 번호판: 작은 이미지에서 2배 확대 단계를 더한다 */
      upscale?: boolean
    }

export type DetectionWorkerResponse =
  | { type: 'ready'; createMs: number }
  | { type: 'load-error'; message: string }
  | { type: 'progress'; id: number; done: number; total: number }
  | { type: 'result'; id: number; boxes: FaceBox[]; ms: number; tiles: number }
  | { type: 'detect-error'; id: number; message: string }
