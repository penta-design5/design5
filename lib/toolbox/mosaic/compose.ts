import { intersectRect, planDirtyRects } from './dirty'
import { BLUR_PASSES, alignedExtent, blurScaleFor, boxBlurRGBA, pixelateData } from './effects'
import { blurRadiusFor, cellSizeFor, type Rect, type Region } from './types'

function context2d(canvas: HTMLCanvasElement, readFrequently = false): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', readFrequently ? { willReadFrequently: true } : undefined)
  if (!ctx) throw new Error('브라우저에서 캔버스를 사용할 수 없습니다.')
  return ctx
}

/** 거친 픽셀 — 셀 평균색(영역 크기의 ImageData) */
function renderPixelEffect(original: HTMLCanvasElement, region: Region): ImageData {
  const size = { width: original.width, height: original.height }
  const cell = cellSizeFor(region.strength, size.width, size.height)
  const extent: Rect = alignedExtent(region, cell, size)
  const source = context2d(original).getImageData(extent.x, extent.y, extent.width, extent.height)
  const data = pixelateData(
    { data: source.data, width: extent.width, height: extent.height, originX: extent.x, originY: extent.y },
    region,
    cell
  )
  return new ImageData(data, region.width, region.height)
}

/**
 * 부드러운 블러 — 영역 + 번지는 거리(반경 × 3)만 원본에서 읽어 흐린 뒤 영역 크기로 잘라 돌려준다.
 * 영역 바깥 색도 섞여 들어오므로 경계가 자연스럽다. 작업 넓이가 크면 줄인 해상도에서 흐린 뒤 다시 키운다(blurScaleFor).
 */
function renderBlurEffect(original: HTMLCanvasElement, region: Region): ImageData {
  const size = { width: original.width, height: original.height }
  const radius = blurRadiusFor(region.strength, size.width, size.height)
  const margin = BLUR_PASSES * radius
  const ax = Math.max(0, region.x - margin)
  const ay = Math.max(0, region.y - margin)
  const aw = Math.min(size.width, region.x + region.width + margin) - ax
  const ah = Math.min(size.height, region.y + region.height + margin) - ay
  const scale = blurScaleFor(radius, aw, ah)

  if (scale === 1) {
    const img = context2d(original).getImageData(ax, ay, aw, ah)
    boxBlurRGBA(img.data, aw, ah, radius)
    const out = new ImageData(region.width, region.height)
    for (let y = 0; y < region.height; y++) {
      const start = ((y + region.y - ay) * aw + (region.x - ax)) * 4
      out.data.set(img.data.subarray(start, start + region.width * 4), y * region.width * 4)
    }
    return out
  }

  // 줄인 해상도: 영역+여백을 1/scale로 줄여 흐린 뒤 영역만 원래 크기로 되돌린다
  const sw = Math.max(1, Math.round(aw / scale))
  const sh = Math.max(1, Math.round(ah / scale))
  const small = document.createElement('canvas')
  small.width = sw
  small.height = sh
  const sctx = context2d(small, true)
  sctx.imageSmoothingQuality = 'high'
  sctx.drawImage(original, ax, ay, aw, ah, 0, 0, sw, sh)
  const img = sctx.getImageData(0, 0, sw, sh)
  boxBlurRGBA(img.data, sw, sh, Math.max(1, Math.round(radius / scale)))
  sctx.putImageData(img, 0, 0)
  const big = document.createElement('canvas')
  big.width = region.width
  big.height = region.height
  const bctx = context2d(big, true)
  bctx.imageSmoothingQuality = 'high'
  bctx.drawImage(
    small,
    ((region.x - ax) * sw) / aw,
    ((region.y - ay) * sh) / ah,
    (region.width * sw) / aw,
    (region.height * sh) / ah,
    0,
    0,
    region.width,
    region.height
  )
  return bctx.getImageData(0, 0, region.width, region.height)
}

/** 영역 하나의 효과를 영역 크기의 ImageData로 만든다(원본에서 계산 — 겹쳐도 효과가 누적되지 않음) */
function renderRegionEffect(original: HTMLCanvasElement, region: Region): ImageData {
  return region.pattern === 'blur' ? renderBlurEffect(original, region) : renderPixelEffect(original, region)
}

/**
 * 영역 하나(또는 그 일부 area)를 결과 캔버스에 그린다. 효과는 위치 불변이라 일부만 계산해도 전체 계산과 같은 값이다.
 * 사각형은 putImageData로 효과 픽셀을 그대로 넣고, 타원은 효과 조각을 영역 전체 모양으로 잘라 얹는다.
 */
function paintRegion(ctx: CanvasRenderingContext2D, original: HTMLCanvasElement, region: Region, area?: Rect) {
  const rect = area ? intersectRect(region, area) : region
  if (!rect) return
  const effect = renderRegionEffect(original, { ...region, x: rect.x, y: rect.y, width: rect.width, height: rect.height })
  if (region.shape === 'rect') {
    ctx.putImageData(effect, rect.x, rect.y)
    return
  }
  const piece = document.createElement('canvas')
  piece.width = rect.width
  piece.height = rect.height
  context2d(piece).putImageData(effect, 0, 0)
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(region.x + region.width / 2, region.y + region.height / 2, region.width / 2, region.height / 2, 0, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(piece, rect.x, rect.y)
  ctx.restore()
}

/**
 * 결과 = 원본 위에 영역을 생성 순서대로 얹은 것. target은 original과 같은 크기의 캔버스를 재사용한다.
 * 영역 밖 픽셀은 원본 그대로이고(copy로 덮어씀), 사각형 영역은 효과 픽셀을 그대로 넣는다.
 */
export function renderMosaicInto(target: HTMLCanvasElement, original: HTMLCanvasElement, regions: readonly Region[]) {
  const ctx = context2d(target)
  ctx.save()
  ctx.globalCompositeOperation = 'copy'
  ctx.drawImage(original, 0, 0)
  ctx.restore()
  for (const region of regions) paintRegion(ctx, original, region)
}

/**
 * 영역이 바뀐 부분만 다시 그린다(prev → next). target에는 prev의 결과가 그려져 있어야 한다.
 * 바뀐 부분을 원본으로 되돌린 뒤, 그 부분과 겹치는 영역들을 생성 순서대로 다시 얹는다 — 결과는 전체를 다시 그린 것과 같다.
 * 부분 갱신을 쓸 수 없는 경우(영역 순서 변경·블러 줄인 해상도·바뀐 부분이 너무 많음)에는 false를 돌려주고 아무것도 바꾸지 않는다.
 */
export function updateMosaicInto(
  target: HTMLCanvasElement,
  original: HTMLCanvasElement,
  prev: readonly Region[],
  next: readonly Region[]
): boolean {
  const dirty = planDirtyRects(prev, next, { width: original.width, height: original.height })
  if (!dirty) return false
  if (dirty.length === 0) return true
  const ctx = context2d(target)
  const source = context2d(original)
  for (const area of dirty) {
    ctx.putImageData(source.getImageData(area.x, area.y, area.width, area.height), area.x, area.y)
    for (const region of next) paintRegion(ctx, original, region, area)
  }
  return true
}
