import type { Size } from '@/lib/toolbox/common/canvas'
import { normalizeRect } from './regions'
import type { Rect } from './types'

/**
 * 얼굴 자동 감지(YuNet) — 순수 로직. 추론은 `face.worker.ts`(브라우저 Worker), 모델·PoC: docs/TOOLBOX_mosaic_handoff.md §4 P5.
 *
 * 모델 입력은 640×640 고정이라, 큰 이미지는 **원본 해상도 타일**(작은 얼굴)과 **축소 피라미드**(큰 얼굴)로 나눠 모두 훑고
 * 결과를 이미지 좌표로 합쳐 겹치는 상자를 정리한다.
 */

export const FACE_MODEL = {
  /** 같은 출처(public/) — 외부 CDN에 의존하지 않는다. 출처·라이선스: public/tool-models/yunet/README.md */
  url: '/tool-models/yunet/face_detection_yunet_2023mar.onnx',
  sha256: '8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4',
  bytes: 232_589,
} as const

/** 모델 입력 한 변(px) — [1, 3, 640, 640] */
export const FACE_INPUT_SIZE = 640
export const FACE_STRIDES = [8, 16, 32] as const

/**
 * 감지 점수 하한 — 놓치는 것보다 오탐이 낫다(오탐은 지우면 되지만 놓친 얼굴은 가려지지 않는다).
 * 샘플 3장(얼굴 15개)에서 진짜 얼굴의 최저 점수는 0.70, 얼굴 옆을 잘못 잡은 중복 상자는 0.51이라 0.6으로 정했다.
 */
export const FACE_SCORE_THRESHOLD = 0.6
/** 겹치는 상자 정리(NMS) IoU */
export const FACE_NMS_IOU = 0.3
/** 작은 상자가 큰 상자 안에 80% 이상 들어 있으면 낮은 점수 쪽을 버린다 */
export const FACE_CONTAIN_RATIO = 0.8
/** 타일 한 변 안쪽의 이 폭 안에 닿는 상자는 타일 경계에 잘린 얼굴로 보고 버린다(다른 타일·축소 단계가 온전히 잡는다) */
export const FACE_EDGE_MARGIN = 4
/** 타일이 겹치는 최소 폭의 상한 — 이웃 타일 간격은 (입력 − 이 값) 이하 */
export const FACE_TILE_OVERLAP = 160
/** 한 번 감지에서 실행할 타일 수 상한(과도한 계산 방지) */
export const FACE_MAX_TILES = 220

export const FACE_MARGIN_MIN = 0
export const FACE_MARGIN_MAX = 100
export const FACE_MARGIN_DEFAULT = 30

export interface FaceBox extends Rect {
  score: number
}

export interface FaceTile {
  /** 타일 왼쪽 위(축소된 이미지 좌표) */
  x: number
  y: number
  /** 타일 크기(축소된 이미지가 640보다 작으면 그 크기) */
  width: number
  height: number
}

export interface FaceLevel {
  scale: number
  /** 이 배율로 줄인 이미지 크기 */
  width: number
  height: number
  tiles: FaceTile[]
}

/** 한 변을 640 타일로 덮는 시작 위치들 — 가장자리까지 덮고 타일 간격을 고르게 한다 */
export function tileOffsets(length: number): number[] {
  if (length <= FACE_INPUT_SIZE) return [0]
  const maxStep = FACE_INPUT_SIZE - FACE_TILE_OVERLAP
  const count = Math.ceil((length - FACE_INPUT_SIZE) / maxStep) + 1
  const span = length - FACE_INPUT_SIZE
  return Array.from({ length: count }, (_, i) => Math.round((span * i) / (count - 1)))
}

/**
 * 감지 계획 — 배율 1(원본)부터 절반씩 줄여 가며 모든 단계를 타일로 나눈다. 한 변이 640 이하가 되는 단계에서 끝낸다.
 * 단계 k는 원본 기준 약 (10~300) / 배율 px 크기의 얼굴을 담당한다.
 */
export function planFaceLevels(size: Size): FaceLevel[] {
  const levels: FaceLevel[] = []
  let scale = 1
  for (let guard = 0; guard < 8; guard++) {
    const width = Math.max(1, Math.round(size.width * scale))
    const height = Math.max(1, Math.round(size.height * scale))
    const tiles: FaceTile[] = []
    for (const y of tileOffsets(height)) {
      for (const x of tileOffsets(width)) {
        tiles.push({ x, y, width: Math.min(FACE_INPUT_SIZE, width), height: Math.min(FACE_INPUT_SIZE, height) })
      }
    }
    levels.push({ scale, width, height, tiles })
    if (Math.max(width, height) <= FACE_INPUT_SIZE) break
    scale /= 2
  }
  // 타일이 너무 많으면 가장 큰 단계(원본 해상도)부터 제외한다 — 큰 얼굴은 축소 단계가 계속 담당
  while (levels.length > 1 && levels.reduce((n, l) => n + l.tiles.length, 0) > FACE_MAX_TILES) levels.shift()
  return levels
}

export const countFaceTiles = (levels: readonly FaceLevel[]) => levels.reduce((n, l) => n + l.tiles.length, 0)

/**
 * RGBA(640×640 타일, 비곱셈) → 모델 입력 텐서 [1,3,640,640] — 채널 순서 **B, G, R**, 값 0~255(정규화 없음).
 * 타일이 640보다 작으면 나머지는 0으로 채운다. out을 넘기면 재사용한다.
 */
export function rgbaToBgrTensor(rgba: Uint8ClampedArray, width: number, height: number, out?: Float32Array): Float32Array {
  const plane = FACE_INPUT_SIZE * FACE_INPUT_SIZE
  const tensor = out ?? new Float32Array(3 * plane)
  tensor.fill(0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const o = y * FACE_INPUT_SIZE + x
      tensor[o] = rgba[i + 2]
      tensor[plane + o] = rgba[i + 1]
      tensor[2 * plane + o] = rgba[i]
    }
  }
  return tensor
}

/** 모델 출력(스트라이드별 cls·obj·bbox) */
export interface YunetOutputs {
  cls: Record<number, Float32Array>
  obj: Record<number, Float32Array>
  bbox: Record<number, Float32Array>
}

/**
 * YuNet 출력 해독(OpenCV FaceDetectorYN과 같은 식) — 점수 = √(cls × obj), 중심 = (격자 + 오프셋) × 스트라이드, 크기 = exp(값) × 스트라이드.
 * 반환 좌표는 타일(640×640) 기준이다. NMS는 하지 않는다.
 */
export function decodeYunet(outputs: YunetOutputs, threshold = FACE_SCORE_THRESHOLD): FaceBox[] {
  const boxes: FaceBox[] = []
  for (const stride of FACE_STRIDES) {
    const cls = outputs.cls[stride]
    const obj = outputs.obj[stride]
    const bbox = outputs.bbox[stride]
    const cells = FACE_INPUT_SIZE / stride
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const i = r * cells + c
        const score = Math.sqrt(Math.min(1, Math.max(0, cls[i])) * Math.min(1, Math.max(0, obj[i])))
        if (score < threshold) continue
        const cx = (c + bbox[i * 4]) * stride
        const cy = (r + bbox[i * 4 + 1]) * stride
        const w = Math.exp(bbox[i * 4 + 2]) * stride
        const h = Math.exp(bbox[i * 4 + 3]) * stride
        boxes.push({ x: cx - w / 2, y: cy - h / 2, width: w, height: h, score })
      }
    }
  }
  return boxes
}

export function iou(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const union = a.width * a.height + b.width * b.height - inter
  return union > 0 ? inter / union : 0
}

/** a 중 b 안에 들어 있는 넓이 비율 */
function containedRatio(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const area = a.width * a.height
  return area > 0 ? inter / area : 0
}

/** 점수 순으로 겹치는 상자를 정리한다(IoU + 포함 비율) */
export function suppressBoxes(boxes: readonly FaceBox[], iouThreshold = FACE_NMS_IOU, containRatio = FACE_CONTAIN_RATIO): FaceBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score)
  const kept: FaceBox[] = []
  for (const box of sorted) {
    const redundant = kept.some((k) => iou(k, box) >= iouThreshold || containedRatio(box, k) >= containRatio)
    if (!redundant) kept.push(box)
  }
  return kept
}

/**
 * 타일 좌표의 상자들을 이미지 좌표로 바꾼다. 타일 경계(이미지 가장자리가 아닌 쪽)에 닿은 상자는 잘린 얼굴일 수 있어 버린다.
 */
export function tileBoxesToImage(boxes: readonly FaceBox[], tile: FaceTile, level: Pick<FaceLevel, 'scale' | 'width' | 'height'>): FaceBox[] {
  const touchLeft = tile.x > 0
  const touchTop = tile.y > 0
  const touchRight = tile.x + tile.width < level.width
  const touchBottom = tile.y + tile.height < level.height
  const out: FaceBox[] = []
  for (const b of boxes) {
    if (touchLeft && b.x < FACE_EDGE_MARGIN) continue
    if (touchTop && b.y < FACE_EDGE_MARGIN) continue
    if (touchRight && b.x + b.width > tile.width - FACE_EDGE_MARGIN) continue
    if (touchBottom && b.y + b.height > tile.height - FACE_EDGE_MARGIN) continue
    out.push({
      x: (b.x + tile.x) / level.scale,
      y: (b.y + tile.y) / level.scale,
      width: b.width / level.scale,
      height: b.height / level.scale,
      score: b.score,
    })
  }
  return out
}

/** 이미지 안으로 제한한 정수 상자(점수 유지) — 이미지 밖으로 나간 부분을 잘라 낸다 */
export function clipFaceBox(box: FaceBox, size: Size): FaceBox | null {
  const x1 = Math.max(0, box.x)
  const y1 = Math.max(0, box.y)
  const x2 = Math.min(size.width, box.x + box.width)
  const y2 = Math.min(size.height, box.y + box.height)
  if (x2 - x1 < 1 || y2 - y1 < 1) return null
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, score: box.score }
}

/**
 * 얼굴 여백 — 상자의 너비·높이를 (1 + 여백%)배로, 중심은 그대로 키운다(기본 30 → 사방으로 상자 크기의 15%씩).
 * 결과는 이미지 안으로 제한한 영역용 정수 사각형이다(최소 크기 보장).
 */
export function faceRegionRect(box: Rect, marginPercent: number, size: Size): Rect {
  const grow = 1 + Math.min(FACE_MARGIN_MAX, Math.max(FACE_MARGIN_MIN, marginPercent)) / 100
  const width = box.width * grow
  const height = box.height * grow
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  // 가장자리에서 잘리면 그 쪽으로 밀어 넣지 않고 이미지 안으로 자른다(normalizeRect는 크기를 유지하며 안쪽으로 민다)
  const x1 = Math.max(0, cx - width / 2)
  const y1 = Math.max(0, cy - height / 2)
  const x2 = Math.min(size.width, cx + width / 2)
  const y2 = Math.min(size.height, cy + height / 2)
  return normalizeRect({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 }, size)
}

/** 이미 있는 영역과 많이 겹치는(IoU 0.5 이상) 영역은 건너뛴다 — 같은 이미지를 다시 감지해도 영역이 쌓이지 않게 */
export function dropOverlapping(rects: readonly Rect[], existing: readonly Rect[], threshold = 0.5): Rect[] {
  return rects.filter((r) => !existing.some((e) => iou(r, e) >= threshold))
}

// ---------- 설정 저장(자동 적용·얼굴 여백) ----------

export interface FaceSettings {
  /** 이미지를 불러올 때 자동으로 감지해 영역으로 추가 */
  auto: boolean
  /** 얼굴 여백(%) */
  margin: number
}

export const DEFAULT_FACE_SETTINGS: FaceSettings = { auto: false, margin: FACE_MARGIN_DEFAULT }
export const FACE_SETTINGS_KEY = 'toolbox:mosaic:face:v1'

export function parseFaceSettings(raw: string | null): FaceSettings {
  if (!raw) return DEFAULT_FACE_SETTINGS
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    const margin = typeof data.margin === 'number' && Number.isFinite(data.margin) ? data.margin : DEFAULT_FACE_SETTINGS.margin
    return {
      auto: data.auto === true,
      margin: Math.min(FACE_MARGIN_MAX, Math.max(FACE_MARGIN_MIN, Math.round(margin))),
    }
  } catch {
    return DEFAULT_FACE_SETTINGS
  }
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
