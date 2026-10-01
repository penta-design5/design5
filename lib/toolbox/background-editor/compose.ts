import { createCanvas, type Size } from '@/lib/toolbox/common/canvas'

/**
 * 배경 교체 — 배경을 제거한 결과(투명 캔버스) 뒤에 새 배경을 깐다. 결과 크기는 항상 원본과 같다.
 */

export type BackgroundKind = 'transparent' | 'color' | 'image'

/** 배경 이미지 배치 — 꽉 채우기(넘치는 부분 잘림) / 맞추기(남는 부분 투명) */
export type BackgroundFit = 'cover' | 'contain'

export const BACKGROUND_FITS: { value: BackgroundFit; label: string; hint: string }[] = [
  { value: 'cover', label: '꽉 채우기', hint: '배경 이미지가 전체를 덮도록 키우고, 넘치는 부분은 잘라 냅니다.' },
  { value: 'contain', label: '맞추기', hint: '배경 이미지 전체가 보이도록 줄이고, 남는 부분은 투명하게 둡니다.' },
]

/** 단색 프리셋 — 흰색·밝은 회색·검정 + 이미지 편집과 같은 기본 색 */
export const BG_COLOR_PRESETS = ['#ffffff', '#f3f4f6', '#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6']

export const DEFAULT_BG_COLOR = '#ffffff'

export interface BackgroundSettings {
  kind: BackgroundKind
  color: string
  /** 사용자가 불러온 배경 이미지(EXIF 보정 후) */
  image: HTMLCanvasElement | null
  imageName: string
  fit: BackgroundFit
}

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  kind: 'transparent',
  color: DEFAULT_BG_COLOR,
  image: null,
  imageName: '',
  fit: 'cover',
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** 배경 이미지(source)를 대상(target) 가운데에 맞춰 그릴 위치·크기(비율 유지) */
export function fitRect(source: Size, target: Size, fit: BackgroundFit): Rect {
  const scale =
    fit === 'cover'
      ? Math.max(target.width / source.width, target.height / source.height)
      : Math.min(target.width / source.width, target.height / source.height)
  const width = source.width * scale
  const height = source.height * scale
  return { x: (target.width - width) / 2, y: (target.height - height) / 2, width, height }
}

/** 실제로 배경을 깔아야 하는지 — 투명이거나 이미지를 아직 고르지 않았으면 결과를 그대로 쓴다 */
export function hasBackground(bg: BackgroundSettings): boolean {
  return bg.kind === 'color' || (bg.kind === 'image' && bg.image !== null)
}

/** 결과(투명 배경) + 새 배경 → 새 캔버스. 배경이 없으면 cutout을 그대로 돌려준다 */
export function composeBackground(cutout: HTMLCanvasElement, bg: BackgroundSettings): HTMLCanvasElement {
  if (!hasBackground(bg)) return cutout
  const { canvas, ctx } = createCanvas(cutout.width, cutout.height)
  if (bg.kind === 'color') {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else if (bg.image) {
    const r = fitRect(bg.image, canvas, bg.fit)
    ctx.drawImage(bg.image, r.x, r.y, r.width, r.height)
  }
  ctx.drawImage(cutout, 0, 0)
  return canvas
}
