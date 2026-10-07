import type { FaceBox } from './face'

/** 얼굴 감지 Worker ↔ 메인 스레드 메시지 */

export type FaceWorkerRequest =
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
    }

export type FaceWorkerResponse =
  | { type: 'ready'; createMs: number }
  | { type: 'load-error'; message: string }
  | { type: 'progress'; id: number; done: number; total: number }
  | { type: 'result'; id: number; boxes: FaceBox[]; ms: number; tiles: number }
  | { type: 'detect-error'; id: number; message: string }
