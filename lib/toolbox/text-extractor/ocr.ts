/**
 * PaddleOCR(감지 DB + 인식 CTC) 전처리·후처리 — 순수 함수(Worker·테스트 공용).
 * 모델 입출력 형식: public/tool-models/ocr/README.md
 */

/** 감지 입력 긴 변 상한(px) — PoC에서 2,400px로 키워도 품질 차이가 거의 없었다 */
export const DET_LIMIT_SIDE = 1600
const DET_MEAN = [0.485, 0.456, 0.406] as const
const DET_STD = [0.229, 0.224, 0.225] as const
/** 확률 맵에서 글자로 보는 값 */
export const DET_THRESHOLD = 0.3
/** 상자 안 평균 확률이 이 값 미만이면 버린다 */
export const DET_BOX_THRESHOLD = 0.5
/** 감지된 영역을 넓히는 비율(DB 알고리즘의 unclip) */
export const DET_UNCLIP_RATIO = 1.6
/** 인식 입력 높이(px) — PP-OCRv5 */
export const REC_HEIGHT = 48
/** 인식 입력 폭 상한(px) — 아주 긴 줄의 메모리 상한 */
export const REC_MAX_WIDTH = 3200
/** 인식 신뢰도가 이 값 미만인 줄은 버린다(잡음·그림 속 글자) */
export const REC_MIN_CONFIDENCE = 0.5

export interface Size {
  width: number
  height: number
}

export interface DetectedBox {
  x0: number
  y0: number
  x1: number
  y1: number
  /** 상자 안 평균 글자 확률 */
  score: number
}

/** 감지 입력 크기 — 긴 변을 상한 이하로 줄이고(키우지 않음) 32의 배수로 맞춘다 */
export function detInputSize({ width, height }: Size, limit = DET_LIMIT_SIDE): Size {
  const ratio = Math.min(1, limit / Math.max(width, height))
  const fit = (v: number) => Math.max(32, Math.round((v * ratio) / 32) * 32)
  return { width: fit(width), height: fit(height) }
}

/** 감지 입력 텐서(1×3×H×W, BGR, ImageNet 정규화) — RGBA 픽셀에서 만든다. 투명 부분은 흰색으로 본다 */
export function fillDetTensor(rgba: Uint8ClampedArray, width: number, height: number, out = new Float32Array(3 * width * height)) {
  const plane = width * height
  for (let i = 0; i < plane; i++) {
    const a = rgba[i * 4 + 3] / 255
    for (let c = 0; c < 3; c++) {
      // c=0 → B, 1 → G, 2 → R
      const v = (rgba[i * 4 + (2 - c)] * a + 255 * (1 - a)) / 255
      out[c * plane + i] = (v - DET_MEAN[c]) / DET_STD[c]
    }
  }
  return out
}

/**
 * 확률 맵에서 글자 상자를 찾는다(연결 성분 → 축 정렬 상자 → 넓히기 → 원본 좌표).
 * 기울어진 줄도 축 정렬 상자로 감싼다(PoC 샘플은 이 방식으로 충분했다).
 */
export function findTextBoxes(prob: ArrayLike<number>, map: Size, image: Size): DetectedBox[] {
  const { width: w, height: h } = map
  const seen = new Uint8Array(w * h)
  const stack: number[] = []
  const sx = image.width / w
  const sy = image.height / h
  const boxes: DetectedBox[] = []
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || prob[start] <= DET_THRESHOLD) continue
    let minX = w, minY = h, maxX = -1, maxY = -1, count = 0, sum = 0
    seen[start] = 1
    stack.push(start)
    while (stack.length) {
      const p = stack.pop()!
      const x = p % w
      const y = (p - x) / w
      count++
      sum += prob[p]
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      const neighbors = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]
      for (const q of neighbors) {
        if (q < 0 || seen[q] || prob[q] <= DET_THRESHOLD) continue
        seen[q] = 1
        stack.push(q)
      }
    }
    const bw = maxX - minX + 1
    const bh = maxY - minY + 1
    const score = sum / count
    if (Math.min(bw, bh) < 3 || score < DET_BOX_THRESHOLD) continue
    // 넓이 × 비율 / 둘레만큼 사방으로 넓힌다
    const d = (bw * bh * DET_UNCLIP_RATIO) / (2 * (bw + bh))
    boxes.push({
      x0: Math.max(0, (minX - d) * sx),
      y0: Math.max(0, (minY - d) * sy),
      x1: Math.min(image.width, (maxX + 1 + d) * sx),
      y1: Math.min(image.height, (maxY + 1 + d) * sy),
      score,
    })
  }
  return boxes
}

/** 인식 입력 폭 — 높이를 48px로 맞춘 비율대로(최소 8, 최대 3,200) */
export function recInputWidth(cropWidth: number, cropHeight: number): number {
  return Math.max(8, Math.min(REC_MAX_WIDTH, Math.ceil((REC_HEIGHT * cropWidth) / Math.max(1, cropHeight))))
}

/** 인식 입력 텐서(1×3×48×W, BGR, (v/255 − 0.5)/0.5) */
export function fillRecTensor(rgba: Uint8ClampedArray, width: number, height = REC_HEIGHT, out = new Float32Array(3 * width * height)) {
  const plane = width * height
  for (let i = 0; i < plane; i++) {
    const a = rgba[i * 4 + 3] / 255
    for (let c = 0; c < 3; c++) {
      const v = (rgba[i * 4 + (2 - c)] * a + 255 * (1 - a)) / 255
      out[c * plane + i] = (v - 0.5) / 0.5
    }
  }
  return out
}

/** 사전 텍스트 → 인식 출력 번호별 글자(0번 빈칸, 마지막 띄어쓰기) */
export function buildCharset(dictText: string): string[] {
  const lines = dictText.replace(/\r\n/g, '\n').split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return ['', ...lines, ' ']
}

/** CTC 디코딩 — 시점마다 가장 높은 글자를 고르고, 빈칸·연속 중복을 뺀다. 신뢰도는 고른 글자 확률 평균 */
export function ctcDecode(data: ArrayLike<number>, steps: number, classes: number, charset: string[]): { text: string; confidence: number } {
  let text = ''
  let prev = -1
  let sum = 0
  let count = 0
  for (let t = 0; t < steps; t++) {
    let best = 0
    let bestValue = -Infinity
    const base = t * classes
    for (let c = 0; c < classes; c++) {
      if (data[base + c] > bestValue) {
        bestValue = data[base + c]
        best = c
      }
    }
    if (best !== 0 && best !== prev) {
      text += charset[best] ?? ''
      sum += bestValue
      count++
    }
    prev = best
  }
  return { text, confidence: count ? sum / count : 0 }
}
