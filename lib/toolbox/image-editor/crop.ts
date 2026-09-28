import type { Size } from './transform'

/** 자르기 영역 (원본 이미지 px 좌표, 정수) */
export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export type AspectKey = 'free' | 'original' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16'

export const ASPECT_PRESETS: { key: AspectKey; label: string }[] = [
  { key: 'free', label: '자유' },
  { key: 'original', label: '원본 비율' },
  { key: '1:1', label: '1:1' },
  { key: '4:3', label: '4:3' },
  { key: '3:4', label: '3:4' },
  { key: '16:9', label: '16:9' },
  { key: '9:16', label: '9:16' },
]

/** 비율(가로/세로). 자유 비율이면 null */
export function aspectRatioOf(key: AspectKey, size: Size): number | null {
  if (key === 'free') return null
  if (key === 'original') return size.width / size.height
  const [w, h] = key.split(':').map(Number)
  return w / h
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const fullCropRect = (size: Size): CropRect => ({ x: 0, y: 0, width: size.width, height: size.height })

/** 정수로 반올림하고 이미지 안(최소 1px)으로 제한 — 크기를 먼저 줄이고 위치를 밀어 넣는다 */
export function clampCropRect(rect: CropRect, size: Size): CropRect {
  const width = clamp(Math.round(rect.width), 1, size.width)
  const height = clamp(Math.round(rect.height), 1, size.height)
  return {
    x: clamp(Math.round(rect.x), 0, size.width - width),
    y: clamp(Math.round(rect.y), 0, size.height - height),
    width,
    height,
  }
}

/** 비율에 맞는 가장 큰 영역을 현재 영역의 중심에 맞춰 배치 (이미지 밖으로 나가지 않음) */
export function fitAspect(rect: CropRect, ratio: number | null, size: Size): CropRect {
  if (ratio === null) return clampCropRect(rect, size)
  let width = size.width
  let height = width / ratio
  if (height > size.height) {
    height = size.height
    width = height * ratio
  }
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  return clampCropRect({ x: cx - width / 2, y: cy - height / 2, width, height }, size)
}

/**
 * 숫자 입력 한 칸 변경. 비율이 고정이면 다른 변도 함께 바꾸고, 이미지를 넘으면 비율을 지키며 줄인다.
 * X·Y는 입력한 위치를 유지하고, 넘치는 만큼 크기를 줄인다(패널의 X→Y→너비→높이 순서 입력 대응).
 * (마우스로 상자를 옮길 때는 크기를 유지한 채 이미지 안으로 밀어 넣는다 — `clampCropRect`)
 */
export function setCropField(
  rect: CropRect,
  field: keyof CropRect,
  value: number,
  ratio: number | null,
  size: Size
): CropRect {
  if (!Number.isFinite(value)) return rect
  if (field === 'x' || field === 'y') {
    const isX = field === 'x'
    const limit = isX ? size.width : size.height
    const position = clamp(Math.round(value), 0, limit - 1)
    const moved = { ...rect, [field]: position }
    const span = isX ? rect.width : rect.height
    if (position + span <= limit) return clampCropRect(moved, size)
    // 넘치는 변을 줄이고, 비율이 고정이면 다른 변도 함께 줄인다
    const shrunk = limit - position
    if (ratio === null) return clampCropRect(isX ? { ...moved, width: shrunk } : { ...moved, height: shrunk }, size)
    return clampCropRect(
      isX ? { ...moved, width: shrunk, height: shrunk / ratio } : { ...moved, height: shrunk, width: shrunk * ratio },
      size
    )
  }

  let width = field === 'width' ? clamp(value, 1, size.width) : rect.width
  let height = field === 'height' ? clamp(value, 1, size.height) : rect.height
  if (ratio !== null) {
    if (field === 'width') height = width / ratio
    else width = height * ratio
    if (height > size.height) {
      height = size.height
      width = height * ratio
    }
    if (width > size.width) {
      width = size.width
      height = width / ratio
    }
  }
  return clampCropRect({ ...rect, width, height }, size)
}

export const isFullCrop = (rect: CropRect, size: Size) =>
  rect.x === 0 && rect.y === 0 && rect.width === size.width && rect.height === size.height
