import { MAX_ZOOM, MIN_ZOOM } from './constants'

export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

/** 화면 맞춤 배율 — 뷰포트 안에 여백을 두고 들어가는 최대 배율(원본보다 키우지 않음) */
export function fitZoom(
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
  padding = 24
): number {
  if (imageWidth <= 0 || imageHeight <= 0) return 1
  const availableWidth = Math.max(1, viewWidth - padding * 2)
  const availableHeight = Math.max(1, viewHeight - padding * 2)
  return clampZoom(Math.min(availableWidth / imageWidth, availableHeight / imageHeight, 1))
}

export interface Point {
  x: number
  y: number
}

/** 이미지를 뷰포트 가운데 두는 위치 */
export function centerPosition(
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
  zoom: number
): Point {
  return {
    x: (viewWidth - imageWidth * zoom) / 2,
    y: (viewHeight - imageHeight * zoom) / 2,
  }
}

/** 화면상의 한 점(anchor)을 고정한 채 배율을 바꿀 때의 새 위치 */
export function zoomAroundPoint(position: Point, zoom: number, nextZoom: number, anchor: Point): Point {
  const ratio = nextZoom / zoom
  return {
    x: anchor.x - (anchor.x - position.x) * ratio,
    y: anchor.y - (anchor.y - position.y) * ratio,
  }
}
