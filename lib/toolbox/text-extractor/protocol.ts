/** OCR Worker ↔ 메인 스레드 메시지 */

export interface RecognizedLine {
  x0: number
  y0: number
  x1: number
  y1: number
  text: string
  confidence: number
}

export type OcrWorkerRequest =
  | {
      type: 'load'
      /** 모델 바이트(전송 후 메인 쪽 버퍼는 비워진다) */
      det: ArrayBuffer
      rec: ArrayBuffer
      dict: string
      wasmBaseUrl: string
    }
  | {
      type: 'recognize'
      id: number
      /** 인식할 이미지(원본 해상도, 전송 후 메인 쪽은 비워진다) */
      bitmap: ImageBitmap
    }

/** 인식 단계 — detect: 글자 영역 찾기, recognize: 줄마다 글자 읽기(done/total 줄) */
export type OcrStage = { stage: 'detect' } | { stage: 'recognize'; done: number; total: number }

export type OcrWorkerResponse =
  | { type: 'ready'; createMs: number; threads: number }
  | { type: 'load-error'; message: string }
  | ({ type: 'progress'; id: number } & OcrStage)
  | { type: 'result'; id: number; text: string; lines: RecognizedLine[]; ms: { detect: number; recognize: number } }
  | { type: 'recognize-error'; id: number; message: string }
