import { blurRadiusFor, type Rect, type Region } from './types'
import { BLUR_PASSES, blurScaleFor } from './effects'

/**
 * 영역을 끌어 옮기거나 크기를 조절할 때 결과 캔버스에서 **다시 그려야 하는 부분**만 계산한다(순수 로직).
 *
 * 핵심: 효과(거친 픽셀·부드러운 블러)는 원본·패턴·강도만으로 정해지는 **위치 불변 함수**다(격자는 이미지 왼쪽 위 기준 고정).
 * 그래서 사각형 영역의 위치·크기만 바뀌면 두 사각형이 겹치는 부분의 픽셀은 그대로이고, 차이 부분만 바뀐다.
 */

export const intersectRect = (a: Rect, b: Rect): Rect | null => {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)
  return x2 > x1 && y2 > y1 ? { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } : null
}

const bounds = (r: Rect): Rect => ({ x: r.x, y: r.y, width: r.width, height: r.height })

/** a에서 b와 겹치는 부분을 뺀 나머지 — 서로 겹치지 않는 사각형 최대 4개(위·아래·왼쪽·오른쪽 띠) */
export function rectDifference(a: Rect, b: Rect): Rect[] {
  const inter = intersectRect(a, b)
  if (!inter) return [bounds(a)]
  const out: Rect[] = []
  const aRight = a.x + a.width
  const aBottom = a.y + a.height
  const iRight = inter.x + inter.width
  const iBottom = inter.y + inter.height
  if (inter.y > a.y) out.push({ x: a.x, y: a.y, width: a.width, height: inter.y - a.y }) // 위
  if (iBottom < aBottom) out.push({ x: a.x, y: iBottom, width: a.width, height: aBottom - iBottom }) // 아래
  if (inter.x > a.x) out.push({ x: a.x, y: inter.y, width: inter.x - a.x, height: inter.height }) // 왼쪽(가운데 띠)
  if (iRight < aRight) out.push({ x: iRight, y: inter.y, width: aRight - iRight, height: inter.height }) // 오른쪽(가운데 띠)
  return out
}

const sameGeometry = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
const sameLook = (a: Region, b: Region) => a.pattern === b.pattern && a.shape === b.shape && a.strength === b.strength

/** 블러가 줄인 해상도로 계산되는 영역인지(작업 넓이가 큼) — 그런 영역은 부분 계산이 전체 계산과 달라질 수 있어 부분 갱신을 쓰지 않는다 */
export function blurUsesLowRes(region: Region, size: { width: number; height: number }): boolean {
  if (region.pattern !== 'blur') return false
  const radius = blurRadiusFor(region.strength, size.width, size.height)
  const margin = BLUR_PASSES * radius
  const w = Math.min(size.width, region.x + region.width + margin) - Math.max(0, region.x - margin)
  const h = Math.min(size.height, region.y + region.height + margin) - Math.max(0, region.y - margin)
  return blurScaleFor(radius, w, h) > 1
}

/** 부분 갱신 계획 — null이면 부분 갱신을 쓰지 않고 전체를 다시 그려야 한다 */
export const MAX_DIRTY_RECTS = 24

export function planDirtyRects(prev: readonly Region[], next: readonly Region[], size: { width: number; height: number }): Rect[] | null {
  if (prev === next) return []
  const prevById = new Map(prev.map((r) => [r.id, r]))
  const nextById = new Map(next.map((r) => [r.id, r]))
  // 남은 영역의 상대 순서가 바뀌었으면(겹침 순서가 달라짐) 전체를 다시 그린다
  const commonPrev = prev.filter((r) => nextById.has(r.id)).map((r) => r.id)
  const commonNext = next.filter((r) => prevById.has(r.id)).map((r) => r.id)
  if (commonPrev.length !== commonNext.length || commonPrev.some((id, i) => id !== commonNext[i])) return null

  const dirty: Rect[] = []
  for (const r of prev) {
    const n = nextById.get(r.id)
    if (!n) {
      dirty.push(bounds(r))
    } else if (!sameGeometry(r, n) || !sameLook(r, n)) {
      if (r.shape === 'rect' && n.shape === 'rect' && sameLook(r, n)) {
        // 위치·크기만 바뀐 사각형 — 겹치는 부분은 그대로, 차이 부분만 다시 그린다
        dirty.push(...rectDifference(r, n), ...rectDifference(n, r))
      } else {
        dirty.push(bounds(r), bounds(n))
      }
    }
  }
  for (const n of next) if (!prevById.has(n.id)) dirty.push(bounds(n))
  if (dirty.length > MAX_DIRTY_RECTS) return null
  // 다시 그릴 부분과 겹치는 블러 영역이 줄인 해상도로 계산되면 전체를 다시 그린다
  const lowRes = next.some((r) => blurUsesLowRes(r, size) && dirty.some((d) => intersectRect(r, d)))
  const lowResPrev = prev.some((r) => blurUsesLowRes(r, size) && dirty.some((d) => intersectRect(r, d)))
  return lowRes || lowResPrev ? null : dirty
}
