import type { Size } from '@/lib/toolbox/common/canvas'
import { MIN_REGION_PX, type Rect, type Region, type RegionSettings } from './types'

export interface Point {
  x: number
  y: number
}

/** 크기 조절 핸들 — 8방향 */
export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export type RectField = 'x' | 'y' | 'width' | 'height'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** 영역 한 변의 최소 크기 — 이미지가 8px보다 작으면 이미지 크기 */
export const minRegionSize = (size: Size): Size => ({
  width: Math.min(MIN_REGION_PX, size.width),
  height: Math.min(MIN_REGION_PX, size.height),
})

/** 이미지 전체 크기의 영역 사각형 */
export const fullRect = (size: Size): Rect => ({ x: 0, y: 0, width: size.width, height: size.height })

/** 이미지 안으로 제한 + 정수 반올림 + 최소 크기 보장 */
export function normalizeRect(rect: Rect, size: Size): Rect {
  const min = minRegionSize(size)
  const width = clamp(Math.round(rect.width), min.width, size.width)
  const height = clamp(Math.round(rect.height), min.height, size.height)
  return {
    x: clamp(Math.round(rect.x), 0, size.width - width),
    y: clamp(Math.round(rect.y), 0, size.height - height),
    width,
    height,
  }
}

/**
 * 좌표 입력창에서 한 칸을 바꿀 때: 위치(x·y)는 크기를 유지한 채 이미지 안에서만,
 * 크기(너비·높이)는 위치를 유지한 채 이미지 가장자리까지만 바뀐다.
 */
export function setRectField(rect: Rect, field: RectField, value: number, size: Size): Rect {
  if (!Number.isFinite(value)) return rect
  const min = minRegionSize(size)
  const v = Math.round(value)
  switch (field) {
    case 'x':
      return { ...rect, x: clamp(v, 0, size.width - rect.width) }
    case 'y':
      return { ...rect, y: clamp(v, 0, size.height - rect.height) }
    case 'width':
      return { ...rect, width: clamp(v, min.width, size.width - rect.x) }
    case 'height':
      return { ...rect, height: clamp(v, min.height, size.height - rect.y) }
  }
}

/** 끌어서 이동 — 왼쪽 위 모서리를 topLeft로(크기 유지, 이미지 안으로 제한) */
export function moveRect(origin: Rect, topLeft: Point, size: Size): Rect {
  return {
    ...origin,
    x: clamp(Math.round(topLeft.x), 0, size.width - origin.width),
    y: clamp(Math.round(topLeft.y), 0, size.height - origin.height),
  }
}

/** 핸들의 현재 위치(이미지 좌표) — 잡은 지점과의 거리 유지(grab offset) 계산용 */
export function handlePoint(rect: Rect, handle: Handle): Point {
  const left = rect.x
  const right = rect.x + rect.width
  const top = rect.y
  const bottom = rect.y + rect.height
  return {
    x: handle.includes('w') ? left : handle.includes('e') ? right : (left + right) / 2,
    y: handle.includes('n') ? top : handle.includes('s') ? bottom : (top + bottom) / 2,
  }
}

/**
 * 핸들을 끌어 크기 조절 — point = 핸들이 놓일 이미지 좌표.
 * 반대편 가장자리는 고정하고, 최소 크기·이미지 경계를 넘지 않으며 뒤집히지 않는다.
 */
export function resizeRect(origin: Rect, handle: Handle, point: Point, size: Size): Rect {
  const min = minRegionSize(size)
  let left = origin.x
  let top = origin.y
  let right = origin.x + origin.width
  let bottom = origin.y + origin.height
  const px = Math.round(point.x)
  const py = Math.round(point.y)
  if (handle.includes('w')) left = clamp(px, 0, right - min.width)
  if (handle.includes('e')) right = clamp(px, left + min.width, size.width)
  if (handle.includes('n')) top = clamp(py, 0, bottom - min.height)
  if (handle.includes('s')) bottom = clamp(py, top + min.height, size.height)
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/** 새 영역 그리기 — 시작점 a와 현재점 b로 만든 사각형(이미지 안으로 제한, 정수) */
export function rectFromDrag(a: Point, b: Point, size: Size): Rect {
  const ax = clamp(Math.round(a.x), 0, size.width)
  const ay = clamp(Math.round(a.y), 0, size.height)
  const bx = clamp(Math.round(b.x), 0, size.width)
  const by = clamp(Math.round(b.y), 0, size.height)
  return { x: Math.min(ax, bx), y: Math.min(ay, by), width: Math.abs(ax - bx), height: Math.abs(ay - by) }
}

/**
 * Shift로 그릴 때(정사각형·정원) — 시작점 a에서 b 방향으로 긴 쪽 변에 맞춘 정사각형.
 * 이미지 경계를 넘지 않도록 한 변을 제한한다.
 */
export function squareFromDrag(a: Point, b: Point, size: Size): Rect {
  const ax = clamp(Math.round(a.x), 0, size.width)
  const ay = clamp(Math.round(a.y), 0, size.height)
  const dx = Math.round(b.x) - ax
  const dy = Math.round(b.y) - ay
  const signX = dx < 0 ? -1 : 1
  const signY = dy < 0 ? -1 : 1
  // 그 방향으로 남은 공간
  const room = Math.min(signX > 0 ? size.width - ax : ax, signY > 0 ? size.height - ay : ay)
  const side = Math.min(Math.max(Math.abs(dx), Math.abs(dy)), room)
  return { x: signX > 0 ? ax : ax - side, y: signY > 0 ? ay : ay - side, width: side, height: side }
}

/** 방향키 이동 — 현재 위치에서 (dx, dy)만큼(크기 유지, 이미지 안으로 제한) */
export function nudgeRect(rect: Rect, dx: number, dy: number, size: Size): Rect {
  return moveRect(rect, { x: rect.x + dx, y: rect.y + dy }, size)
}

/** 그린 사각형이 영역으로 쓸 만한지(최소 크기 이상) */
export function isUsableRect(rect: Rect, size: Size): boolean {
  const min = minRegionSize(size)
  return rect.width >= min.width && rect.height >= min.height
}

export const sameRect = (a: Rect, b: Rect) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

let regionSeq = 0

export function createRegion(rect: Rect, settings: RegionSettings, whole = false): Region {
  regionSeq += 1
  return { id: `region-${regionSeq}`, ...rect, ...settings, ...(whole ? { whole: true } : {}) }
}
