/**
 * 인식 보정(P4-3) — 순수 함수(DOM 없음).
 * 배경 제거가 더 잘 되도록 **AI 입력(1024²로 줄인 이미지)에만** 색을 조정한다. 결과·저장 이미지는 원본 색 그대로다.
 * 효과를 측정해 마스크를 바꾸는 효과가 있었던 대비·하이라이트·채도만 둔다(docs/TOOLBOX_background-editor_handoff.md §6 P4-3).
 * 밝기·노출은 전처리의 최댓값 나누기로 대부분 상쇄되고, 흑백·색조 회전은 전경을 잃게 해서 뺐다.
 */

export interface RecognitionSettings {
  /** 대비 −100~100 */
  contrast: number
  /** 하이라이트 −100~100 (음수 = 밝은 부분 어둡게) */
  highlights: number
  /** 채도 −100~100 */
  saturation: number
}

export const DEFAULT_RECOGNITION: RecognitionSettings = { contrast: 0, highlights: 0, saturation: 0 }

export const RECOGNITION_MIN = -100
export const RECOGNITION_MAX = 100

export function isDefaultRecognition(s: RecognitionSettings): boolean {
  return s.contrast === 0 && s.highlights === 0 && s.saturation === 0
}

export function sameRecognition(a: RecognitionSettings, b: RecognitionSettings): boolean {
  return a.contrast === b.contrast && a.highlights === b.highlights && a.saturation === b.saturation
}

/**
 * RGBA를 제자리에서 조정한다(알파는 그대로). 순서: 채도 → 하이라이트 → 대비(측정 때와 같은 계산).
 * - 채도: 밝기(Rec.601 가중치)를 기준으로 색 차이를 (1 + s) 배
 * - 하이라이트: 밝기 l(0~1)의 l² 가중치로 최대 ±128
 * - 대비: 128 기준으로 (1 + c) 배
 */
export function adjustForRecognition(rgba: Uint8ClampedArray, settings: RecognitionSettings): void {
  if (isDefaultRecognition(settings)) return
  const sat = 1 + settings.saturation / 100
  const hl = settings.highlights / 100
  const ct = 1 + settings.contrast / 100
  for (let i = 0; i < rgba.length; i += 4) {
    let r = rgba[i]
    let g = rgba[i + 1]
    let b = rgba[i + 2]
    if (sat !== 1) {
      const y = 0.299 * r + 0.587 * g + 0.114 * b
      r = y + (r - y) * sat
      g = y + (g - y) * sat
      b = y + (b - y) * sat
    }
    if (hl !== 0) {
      const l = Math.min(1, Math.max(0, (0.299 * r + 0.587 * g + 0.114 * b) / 255))
      const delta = hl * l * l * 128
      r += delta
      g += delta
      b += delta
    }
    if (ct !== 1) {
      r = (r - 128) * ct + 128
      g = (g - 128) * ct + 128
      b = (b - 128) * ct + 128
    }
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
  }
}
