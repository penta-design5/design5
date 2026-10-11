import type { Size } from '@/lib/toolbox/common/canvas'
import { FACE_INPUT_SIZE, clipFaceBox, suppressBoxes, tileOffsets, type FaceBox, type FaceLevel } from './face'

/**
 * 번호판 자동 감지(YOLOv9-t 640) — 순수 로직. 추론은 `plate.worker.ts`(브라우저 Worker), 모델·PoC: docs/TOOLBOX_mosaic_handoff.md §4 P7.
 *
 * 얼굴 감지와 같은 구조다 — 입력이 640×640 고정이라 큰 이미지는 **원본 해상도 타일**(작은 번호판)과 **축소 피라미드**(큰 번호판)로 나눠 훑고,
 * 작은 이미지는 **확대 단계**를 더해 먼 번호판도 찾는다. 타일 분할·좌표 복원·상자 정리는 얼굴 감지 모듈(`face.ts`)을 그대로 쓴다.
 */

export const PLATE_MODEL = {
  /** 같은 출처(public/) — 외부 CDN에 의존하지 않는다. 출처·라이선스: public/tool-models/plate/README.md */
  url: '/tool-models/plate/yolo-v9-t-640-license-plates-end2end.onnx',
  sha256: 'c3c1026ca7d0585dd88084d68182dd897113712fa734ae1557ca70174440c076',
  bytes: 7_835_770,
} as const

/** 모델 입력 한 변(px) — [1, 3, 640, 640], RGB, 0~1 */
export const PLATE_INPUT_SIZE = FACE_INPUT_SIZE
/** 모델 출력 한 행: [배치, x1, y1, x2, y2, 클래스, 점수] */
export const PLATE_OUTPUT_STRIDE = 7
/** 타일이 640보다 작을 때 나머지를 채우는 값(YOLO 레터박스 회색 114/255) */
export const PLATE_PAD_VALUE = 114 / 255

/**
 * 감지 점수 하한 — 놓치는 것보다 오탐이 낫다(개인정보 가림이 목적).
 * 샘플 6장(번호판 11개)에서 진짜 번호판은 0.35~0.91, 오탐은 0.3 부근 이하였다.
 */
export const PLATE_SCORE_THRESHOLD = 0.3
/** 한 번 감지에서 실행할 타일 수 상한 — 번호판 모델은 얼굴보다 4~6배 느려(WASM 한 스레드 타일당 약 0.2초) 얼굴(220)보다 낮다 */
export const PLATE_MAX_TILES = 100
/** 확대(2배) 단계를 더하는 이미지의 긴 변 상한(px) — 그보다 크면 원본 해상도에서도 번호판이 충분히 커서 필요 없고 타일 수만 는다 */
export const PLATE_UPSCALE_MAX_SIDE = 1280

export const PLATE_MARGIN_DEFAULT = 10

/** 모델 출력 상자 최소 크기(px, 타일 기준) — 이보다 작은 점 같은 상자는 버린다 */
export const PLATE_MIN_BOX = 6

/** 단계 하나(배율 → 줄이거나 키운 이미지 크기 + 타일). 얼굴과 같은 모양이라 `FaceLevel`을 공유한다 */
export type PlateLevel = FaceLevel

function levelFor(size: Size, scale: number): PlateLevel {
  const width = Math.max(1, Math.round(size.width * scale))
  const height = Math.max(1, Math.round(size.height * scale))
  const tiles: PlateLevel['tiles'] = []
  for (const y of tileOffsets(height)) {
    for (const x of tileOffsets(width)) {
      tiles.push({ x, y, width: Math.min(PLATE_INPUT_SIZE, width), height: Math.min(PLATE_INPUT_SIZE, height) })
    }
  }
  return { scale, width, height, tiles }
}

/**
 * 감지 계획 — 우선순위: 원본(배율 1) → 절반씩 줄인 단계(큰 번호판, 한 변이 640 이하가 되면 끝) → 확대(2배, `upscale`이고 작은 이미지만).
 * 타일 합이 상한을 넘으면 그 단계는 건너뛴다(아주 큰 이미지는 원본 단계가 빠져 작은 번호판을 놓칠 수 있다). 반환은 실행 순서(확대 → 원본 → 축소)다.
 */
export function planPlateLevels(size: Size, options: { upscale?: boolean; maxTiles?: number } = {}): PlateLevel[] {
  const maxTiles = options.maxTiles ?? PLATE_MAX_TILES
  const longSide = Math.max(size.width, size.height)

  const candidates: PlateLevel[] = [levelFor(size, 1)]
  let scale = 1
  for (let guard = 0; guard < 8 && longSide * scale > PLATE_INPUT_SIZE; guard++) {
    scale /= 2
    candidates.push(levelFor(size, scale))
  }
  if (options.upscale && longSide <= PLATE_UPSCALE_MAX_SIDE) candidates.push(levelFor(size, 2))

  const kept: PlateLevel[] = []
  let total = 0
  for (const level of candidates) {
    if (total + level.tiles.length > maxTiles) continue
    kept.push(level)
    total += level.tiles.length
  }
  return kept.sort((a, b) => b.scale - a.scale)
}

export const countPlateTiles = (levels: readonly PlateLevel[]) => levels.reduce((n, l) => n + l.tiles.length, 0)

/**
 * RGBA(타일, 비곱셈) → 모델 입력 텐서 [1,3,640,640] — 채널 순서 **R, G, B**, 값 0~1.
 * 타일이 640보다 작으면 나머지를 회색(114/255)으로 채운다(왼쪽 위에 붙임 — 출력 좌표가 곧 타일 좌표). out을 넘기면 재사용한다.
 */
export function rgbaToRgbTensor(rgba: Uint8ClampedArray, width: number, height: number, out?: Float32Array): Float32Array {
  const plane = PLATE_INPUT_SIZE * PLATE_INPUT_SIZE
  const tensor = out ?? new Float32Array(3 * plane)
  tensor.fill(PLATE_PAD_VALUE)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const o = y * PLATE_INPUT_SIZE + x
      tensor[o] = rgba[i] / 255
      tensor[plane + o] = rgba[i + 1] / 255
      tensor[2 * plane + o] = rgba[i + 2] / 255
    }
  }
  return tensor
}

/**
 * 모델 출력(행마다 [배치, x1, y1, x2, y2, 클래스, 점수], NMS 포함) 해독. 점수가 하한 미만이거나(채움 행은 점수 0) 너무 작은 상자는 버린다.
 * 반환 좌표는 타일(640×640) 기준이다. 타일 경계에 닿은 상자 정리는 `tileBoxesToImage`가 한다.
 */
export function decodePlateOutput(data: ArrayLike<number>, rows: number, threshold = PLATE_SCORE_THRESHOLD): FaceBox[] {
  const boxes: FaceBox[] = []
  for (let r = 0; r < rows; r++) {
    const o = r * PLATE_OUTPUT_STRIDE
    const score = data[o + 6]
    if (!(score >= threshold)) continue
    const x1 = Math.min(data[o + 1], data[o + 3])
    const x2 = Math.max(data[o + 1], data[o + 3])
    const y1 = Math.min(data[o + 2], data[o + 4])
    const y2 = Math.max(data[o + 2], data[o + 4])
    if (x2 - x1 < PLATE_MIN_BOX || y2 - y1 < PLATE_MIN_BOX) continue
    boxes.push({ x: x1, y: y1, width: x2 - x1, height: y2 - y1, score })
  }
  return boxes
}

/** 최종 상자의 최소 너비(px, 원본 이미지 기준) — 점 같은 오탐(예: 먼 차의 미등)을 거른다. 먼 번호판(25×7)은 남는다 */
export const PLATE_MIN_WIDTH = 10

/** 모든 타일·단계에서 모은 상자(이미지 좌표)를 정리한다 — 겹침 정리 → 이미지 안으로 자르기 → 너무 작은 상자 제거 */
export function finalizePlateBoxes(found: readonly FaceBox[], size: Size): FaceBox[] {
  return suppressBoxes(found)
    .map((b) => clipFaceBox(b, size))
    .filter((b): b is FaceBox => b !== null && b.width >= PLATE_MIN_WIDTH)
}

// ---------- 설정 저장(번호판 여백·정밀 감지) ----------

export interface PlateSettings {
  /** 번호판 여백(%) */
  margin: number
  /** 작은 이미지에서 2배 확대 단계를 더해 먼 번호판까지 찾는다(3~4배 느리고 오탐이 늘 수 있음). 기본은 꺼짐 — 빠른 적용 우선(2026-10-12) */
  precise: boolean
}

export const PLATE_MARGIN_MIN = 0
export const PLATE_MARGIN_MAX = 100
export const DEFAULT_PLATE_SETTINGS: PlateSettings = { margin: PLATE_MARGIN_DEFAULT, precise: false }
export const PLATE_SETTINGS_KEY = 'toolbox:mosaic:plate:v1'

export function parsePlateSettings(raw: string | null): PlateSettings {
  if (!raw) return DEFAULT_PLATE_SETTINGS
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    const margin = typeof data.margin === 'number' && Number.isFinite(data.margin) ? data.margin : DEFAULT_PLATE_SETTINGS.margin
    return {
      margin: Math.min(PLATE_MARGIN_MAX, Math.max(PLATE_MARGIN_MIN, Math.round(margin))),
      precise: data.precise === true,
    }
  } catch {
    return DEFAULT_PLATE_SETTINGS
  }
}
