/**
 * 이미지 모자이크 — 영역(Region) 모델과 설정 상수.
 * 영역은 원본 이미지 px 좌표의 정수 사각형이며, 영역마다 패턴·모양·강도를 따로 가진다.
 * 명세: docs/TOOLBOX_mosaic_handoff.md §2·§3
 */

/** 패턴 — pixel: 거친 픽셀(셀 평균색) / blur: 부드러운 블러(가우시안 근사) */
export type Pattern = 'pixel' | 'blur'

/** 영역 모양 — rect: 사각형 / ellipse: 타원·원(영역의 외접 사각형 안에 꽉 차는 타원) */
export type Shape = 'rect' | 'ellipse'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface RegionSettings {
  pattern: Pattern
  shape: Shape
  /** 모자이크 강도 1~100 */
  strength: number
}

export interface Region extends Rect, RegionSettings {
  id: string
  /** 「이미지 전체」 모드의 영역 — 이미지 전체 크기 영역 하나뿐이고 윤곽·편집 없이 설정만 바꾼다 */
  whole?: boolean
}

/** 영역 최소 한 변(px). 이미지가 더 작으면 이미지 크기가 상한 */
export const MIN_REGION_PX = 8

export const STRENGTH_MIN = 1
export const STRENGTH_MAX = 100
export const DEFAULT_STRENGTH = 22

/** 셀 한 변 최소(px) */
export const MIN_CELL_PX = 2

/** 새 영역의 기본 설정(선택된 영역이 없을 때 패널이 바꾸는 값) */
export const DEFAULT_REGION_SETTINGS: RegionSettings = {
  pattern: 'pixel',
  shape: 'rect',
  strength: DEFAULT_STRENGTH,
}

export const PATTERN_OPTIONS: { value: Pattern; label: string; available: boolean }[] = [
  { value: 'pixel', label: '거친 픽셀', available: true },
  { value: 'blur', label: '부드러운 블러', available: true },
]

export const SHAPE_OPTIONS: { value: Shape; label: string; available: boolean }[] = [
  { value: 'rect', label: '사각형', available: true },
  { value: 'ellipse', label: '타원/원', available: true },
]

export const clampStrength = (strength: number) =>
  Math.min(STRENGTH_MAX, Math.max(STRENGTH_MIN, Math.round(Number.isFinite(strength) ? strength : DEFAULT_STRENGTH)))

/**
 * 강도 → 셀 한 변(px). 이미지 짧은 변 × 강도 / 1000, 최소 2px.
 * 예) 짧은 변 800px에서 강도 22 → 18px, 4096px에서 100 → 410px.
 */
export function cellSizeFor(strength: number, width: number, height: number): number {
  const shortSide = Math.max(1, Math.min(width, height))
  return Math.max(MIN_CELL_PX, Math.round((shortSide * clampStrength(strength)) / 1000))
}

/**
 * 부드러운 블러의 반경(px, 원본 이미지 기준) = 같은 강도의 거친 픽셀 셀 크기의 절반, 최소 1px.
 * 상자 흐림을 3번 겹치므로 실제로 번지는 거리는 이 반경의 약 3배다.
 */
export function blurRadiusFor(strength: number, width: number, height: number): number {
  return Math.max(1, Math.round(cellSizeFor(strength, width, height) / 2))
}
