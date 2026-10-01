import { createCanvas } from '@/lib/toolbox/common/canvas'
import { pickColorMask, sampleColor, type PickRange, type RGB } from './picker'
import type { RecognitionSettings } from './recognition'

/**
 * 수동 보정(P4) — AI 결과 위의 「사용자 수정 레이어」. 원본·AI 마스크는 그대로 두는 비파괴 방식이다.
 *
 * 레이어는 원본 해상도 캔버스 2장이다(알파 채널만 쓴다).
 * - coverage: 사용자가 손댄 정도 W(0~1)
 * - restore: 되살릴 알파 T×W (T = 목표 알파, 지우기 0 · 복원 1)
 * 최종 알파 = 경계 다듬기 결과 × (1 − W) + T × W — 나중에 칠한 것이 이긴다(지운 곳에 복원을 칠하면 되살아난다).
 *
 * 브러시 한 획은 「경로까지의 거리 → 농도(brushAlpha)」를 **최댓값으로** 모은 획 마스크로 그린다.
 * 도장을 겹쳐 더하면 흐린 가장자리까지 진해져 부드러움이 사라지므로, 한 획 안에서는 겹쳐도 진해지지 않게 한다.
 * (다른 획끼리는 쌓인다 — 같은 곳을 두 번 칠하면 더 지워진다.) 획을 끝내면 마스크를 레이어에 한 번 합친다.
 * 최댓값은 몇 번 겹쳐 그려도 같으므로 칠하는 중(조금씩)과 다시 그리기(한 번에)의 결과가 같다.
 *
 * 실행 취소는 레이어 스냅샷 대신 작업 기록(EditOp[])을 저장하고, 되돌릴 때 빈 레이어에 다시 그린다(메모리 절약).
 */

export interface Point {
  x: number
  y: number
}

/** 브러시 획 — 좌표·반경은 원본 px */
export interface StrokeOp {
  kind: 'stroke'
  mode: 'erase' | 'restore'
  /** 브러시 반경(원본 px) */
  radius: number
  /** 부드러움 0~100(%) — 가장자리가 흐려지는 폭(반경 대비) */
  softness: number
  points: Point[]
}

/** 사각형 영역 — keep: 영역 안쪽만 남기기(바깥 지움) · erase: 영역 지우기 */
export interface RectOp {
  kind: 'rect'
  mode: 'keep' | 'erase'
  x: number
  y: number
  width: number
  height: number
}

/** 스포이드 색 제거(P4-2) — 클릭 위치(원본 px)·기준색·범위·허용 범위만 기록하고, 그릴 때 원본에서 다시 계산한다 */
export interface PickOp {
  kind: 'pick'
  x: number
  y: number
  color: RGB
  range: PickRange
  tolerance: number
}

/**
 * 인식 보정으로 다시 제거한 AI 결과(P4-3) — 레이어에는 그리지 않는다.
 * 작업 기록에 넣어 실행 취소로 이전 AI 결과로 돌아갈 수 있게 한다(현재 AI 마스크 = 기록의 마지막 AiOp, 없으면 처음 결과).
 */
export interface AiOp {
  kind: 'ai'
  /** 모델 해상도(MODEL.inputSize²) 전경 알파 */
  mask: Uint8ClampedArray
  recognition: RecognitionSettings
}

export type EditOp = StrokeOp | RectOp | PickOp | AiOp

/** 작업 기록에서 마지막 AI 결과(없으면 null) */
export function lastAiOp(ops: readonly EditOp[]): AiOp | null {
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i]
    if (op.kind === 'ai') return op
  }
  return null
}

export type RectMode = RectOp['mode']

/** 정수 px 영역 */
export interface PixelRect {
  x: number
  y: number
  width: number
  height: number
}

/** 브러시 크기(지름, 화면 px) — 확대해도 화면에서 같은 크기로 보인다 */
export const BRUSH_SIZE_MIN = 4
export const BRUSH_SIZE_MAX = 300
export const DEFAULT_BRUSH_SIZE = 40
export const DEFAULT_SOFTNESS = 50

/** 브러시 크기 단축키([ ])의 한 단계 배율 */
export const BRUSH_SIZE_STEP = 1.2

export function clampBrushSize(size: number): number {
  return Math.round(Math.min(BRUSH_SIZE_MAX, Math.max(BRUSH_SIZE_MIN, size)))
}

/** 화면 지름(px) → 원본 반경(px). 원본 기준 0.5px 미만으로는 작아지지 않는다 */
export function brushRadiusInImage(screenSize: number, zoom: number): number {
  return Math.max(0.5, screenSize / 2 / Math.max(1e-6, zoom))
}

/**
 * 브러시 중심에서 거리 d일 때 농도(0~1).
 * - 안쪽(반경 × (1 − 부드러움)) 까지는 1, 그 바깥은 코사인 S자 곡선으로 반경에서 0이 된다(직선보다 자연스럽게 녹아든다).
 * - 부드러움 100% = 가운데부터 바로 흐려지기 시작한다. 반경 경계는 1px 안티에일리어싱.
 */
export function brushAlpha(d: number, radius: number, softness: number): number {
  const edge = Math.min(1, Math.max(0, radius - d + 0.5))
  if (edge <= 0) return 0
  const inner = radius * (1 - Math.min(100, Math.max(0, softness)) / 100)
  if (d <= inner) return edge
  const u = Math.min(1, (d - inner) / Math.max(1e-6, radius - inner))
  return Math.min(edge, 0.5 * (1 + Math.cos(Math.PI * u)))
}

/** 농도 표 간격(px) — 거리 1px을 4칸으로 나눠 미리 계산한다(픽셀마다 cos를 구하지 않도록) */
const PROFILE_STEP = 4

/**
 * 선분 a–b를 브러시로 그린 농도를 RGBA 버퍼의 알파 채널에 **최댓값으로** 기록한다(RGB는 건드리지 않음).
 * 거리는 픽셀 가운데에서 선분까지의 최단 거리다. 바뀔 수 있는 영역(이미지 안으로 자름)을 돌려주며, 이미지 밖이면 null.
 * continued: 앞 구간이 a에서 끝났다 — a 뒤쪽 반원(가장 가까운 점이 a인 픽셀)은 앞 구간이 같은 값으로 이미 그렸으므로 건너뛴다.
 */
export function rasterizeSegment(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  a: Point,
  b: Point,
  radius: number,
  softness: number,
  continued = false
): PixelRect | null {
  const reach = radius + 0.5
  const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - reach))
  const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y) - reach))
  const x1 = Math.min(width, Math.ceil(Math.max(a.x, b.x) + reach))
  const y1 = Math.min(height, Math.ceil(Math.max(a.y, b.y) + reach))
  if (x1 <= x0 || y1 <= y0) return null
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  const skipStart = continued && len2 > 0
  const reach2 = reach * reach
  const profile = new Uint8Array(Math.ceil(reach * PROFILE_STEP) + 2)
  for (let k = 0; k < profile.length; k++) profile[k] = Math.round(brushAlpha(k / PROFILE_STEP, radius, softness) * 255)
  for (let y = y0; y < y1; y++) {
    const py = y + 0.5 - a.y
    let i = (y * width + x0) * 4 + 3
    for (let x = x0; x < x1; x++, i += 4) {
      const cur = rgba[i]
      if (cur === 255) continue // 이미 최대
      const px = x + 0.5 - a.x
      let t = len2 > 0 ? (px * dx + py * dy) / len2 : 0
      if (t <= 0) {
        if (skipStart) continue
        t = 0
      } else if (t > 1) t = 1
      const ex = px - t * dx
      const ey = py - t * dy
      const d2 = ex * ex + ey * ey
      if (d2 >= reach2) continue
      const v = profile[Math.round(Math.sqrt(d2) * PROFILE_STEP)]
      if (v > cur) rgba[i] = v
    }
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

/** 두 영역을 감싸는 영역 */
export function unionRect(a: PixelRect | null, b: PixelRect | null): PixelRect | null {
  if (!a) return b
  if (!b) return a
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  }
}

/** 두 점(끌기 시작·끝) → 이미지 안으로 자른 사각형(원본 정수 px). 1px보다 작으면 null */
export function normalizeRect(a: Point, b: Point, width: number, height: number): PixelRect | null {
  const x0 = Math.max(0, Math.min(width, Math.round(Math.min(a.x, b.x))))
  const y0 = Math.max(0, Math.min(height, Math.round(Math.min(a.y, b.y))))
  const x1 = Math.max(0, Math.min(width, Math.round(Math.max(a.x, b.x))))
  const y1 = Math.max(0, Math.min(height, Math.round(Math.max(a.y, b.y))))
  if (x1 - x0 < 1 || y1 - y0 < 1) return null
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

/**
 * 원본 해상도 수정 레이어. 작업 기록을 그리고(replay·칠하는 중 일부만), AI 결과에 적용한다.
 * 결과 캔버스는 적용할 때마다 새로 만든다(미리보기·저장이 캔버스가 바뀐 것을 알아채도록).
 */
export class EditLayers {
  readonly width: number
  readonly height: number
  private readonly source: HTMLCanvasElement
  /** 원본 픽셀(스포이드용) — 처음 쓸 때 읽는다 */
  private sourcePixels: Uint8ClampedArray | null = null
  private coverage: CanvasRenderingContext2D
  private restore: CanvasRenderingContext2D
  /** 합성용 임시 캔버스(재사용) */
  private scratch: CanvasRenderingContext2D
  /** 그리는 중인 획 마스크(알파) — 캔버스와 픽셀 버퍼. 처음 획을 그릴 때 만든다 */
  private stroke: { ctx: CanvasRenderingContext2D; image: ImageData } | null = null
  /** 획 마스크에서 값이 있는 영역 / 캔버스에 아직 옮기지 않은 영역 */
  private strokeArea: PixelRect | null = null
  private strokeDirty: PixelRect | null = null
  private empty = true
  /** 칠하는 중인 획 — 이미 그린 점 수 */
  private live: { op: StrokeOp; drawn: number } | null = null

  constructor(source: HTMLCanvasElement) {
    this.source = source
    const { width, height } = source
    this.width = width
    this.height = height
    this.coverage = createCanvas(width, height).ctx
    this.restore = createCanvas(width, height).ctx
    this.scratch = createCanvas(width, height).ctx
  }

  /** 손댄 곳이 없으면 AI 결과를 그대로 쓴다 */
  get isEmpty(): boolean {
    return this.empty && !this.live
  }

  clear() {
    this.coverage.clearRect(0, 0, this.width, this.height)
    this.restore.clearRect(0, 0, this.width, this.height)
    this.clearStroke()
    this.empty = true
    this.live = null
  }

  /** 작업 기록 전체를 빈 레이어에 다시 그린다(실행 취소·다시 실행) */
  replay(ops: readonly EditOp[]) {
    this.clear()
    for (const op of ops) this.draw(op)
  }

  draw(op: EditOp) {
    if (op.kind === 'ai') return // AI 결과는 레이어가 아니라 마스크 단계에서 쓴다
    if (op.kind === 'rect') {
      this.drawRect(op)
      return
    }
    if (op.kind === 'pick') {
      const { data } = this.ensureStroke().image
      const area = pickColorMask(this.pixels(), data, this.width, this.height, op, op.color, op)
      this.strokeArea = unionRect(this.strokeArea, area)
      this.strokeDirty = unionRect(this.strokeDirty, area)
      this.mergeStroke('erase')
      return
    }
    this.rasterize(op.points, 0, op)
    this.mergeStroke(op.mode)
  }

  private pixels(): Uint8ClampedArray {
    if (!this.sourcePixels) {
      const ctx = this.source.getContext('2d')
      if (!ctx) throw new Error('브라우저에서 캔버스를 사용할 수 없습니다.')
      this.sourcePixels = ctx.getImageData(0, 0, this.width, this.height).data
    }
    return this.sourcePixels
  }

  /** 원본에서 (x, y) 주변 3×3 평균색 — 스포이드 기준색 */
  sampleColor(x: number, y: number): RGB {
    const px = Math.min(this.width - 1, Math.max(0, Math.round(x)))
    const py = Math.min(this.height - 1, Math.max(0, Math.round(y)))
    return sampleColor(this.pixels(), this.width, this.height, px, py)
  }

  /** 칠하는 중 — 획이 늘어날 때마다 호출하면 새로 생긴 구간만 획 마스크에 그린다(레이어에는 끝낼 때 합친다) */
  drawLive(op: StrokeOp) {
    if (this.live?.op !== op) {
      this.clearStroke()
      this.live = { op, drawn: 0 }
    }
    this.rasterize(op.points, this.live.drawn, op)
    this.live.drawn = op.points.length
  }

  /** 칠하던 획을 끝냈다 — 획 마스크를 레이어에 합친다 */
  endLive() {
    if (!this.live) return
    this.mergeStroke(this.live.op.mode)
    this.live = null
  }

  /** 칠하던 획 버리기 */
  cancelLive() {
    this.clearStroke()
    this.live = null
  }

  private ensureStroke() {
    if (!this.stroke) {
      const { ctx } = createCanvas(this.width, this.height)
      this.stroke = { ctx, image: ctx.createImageData(this.width, this.height) }
    }
    return this.stroke
  }

  /** points[from-1]부터 끝까지의 구간을 획 마스크에 그린다(from = 0이면 첫 점부터) */
  private rasterize(points: readonly Point[], from: number, op: StrokeOp) {
    if (points.length === 0 || from >= points.length) return
    const { image } = this.ensureStroke()
    const { data } = image
    let dirty: PixelRect | null = null
    const start = Math.max(0, from - 1)
    if (points.length === 1 || start === points.length - 1) {
      const p = points[points.length - 1]
      dirty = rasterizeSegment(data, this.width, this.height, p, p, op.radius, op.softness)
    }
    for (let i = start + 1; i < points.length; i++) {
      // 첫 구간은 시작점 둘레 전체, 이후 구간은 앞 구간에 이어 그린다
      const continued = i > 1
      dirty = unionRect(
        dirty,
        rasterizeSegment(data, this.width, this.height, points[i - 1], points[i], op.radius, op.softness, continued)
      )
    }
    this.strokeArea = unionRect(this.strokeArea, dirty)
    this.strokeDirty = unionRect(this.strokeDirty, dirty)
  }

  /** 픽셀 버퍼에서 바뀐 부분만 획 캔버스에 옮긴다 */
  private flushStroke() {
    const stroke = this.stroke
    const d = this.strokeDirty
    if (!stroke || !d) return
    stroke.ctx.putImageData(stroke.image, 0, 0, d.x, d.y, d.width, d.height)
    this.strokeDirty = null
  }

  /** 획 마스크(농도 s)를 레이어에 합친다. coverage: W' = W + s(1 − W) · restore: 지우기 T×W(1 − s) / 복원 s + T×W(1 − s) */
  private mergeStroke(mode: StrokeOp['mode']) {
    if (!this.stroke || !this.strokeArea) return
    this.flushStroke()
    const src = this.stroke.ctx.canvas
    this.coverage.drawImage(src, 0, 0)
    this.restore.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over'
    this.restore.drawImage(src, 0, 0)
    this.restore.globalCompositeOperation = 'source-over'
    this.empty = false
    this.clearStroke()
  }

  private clearStroke() {
    const stroke = this.stroke
    const area = this.strokeArea
    if (stroke && area) {
      const { data } = stroke.image
      for (let y = area.y; y < area.y + area.height; y++) {
        const row = (y * this.width + area.x) * 4
        data.fill(0, row, row + area.width * 4)
      }
      stroke.ctx.clearRect(area.x, area.y, area.width, area.height)
    }
    this.strokeArea = null
    this.strokeDirty = null
  }

  private drawRect(op: RectOp) {
    this.empty = false
    const path = new Path2D()
    if (op.mode === 'keep') {
      // 영역 바깥 = 전체 − 영역(evenodd)
      path.rect(0, 0, this.width, this.height)
      path.rect(op.x, op.y, op.width, op.height)
    } else {
      path.rect(op.x, op.y, op.width, op.height)
    }
    // 사각형은 항상 지우기(T = 0): W → 1, T×W → 0
    this.coverage.fillStyle = '#000'
    this.coverage.fill(path, 'evenodd')
    this.restore.globalCompositeOperation = 'destination-out'
    this.restore.fillStyle = '#000'
    this.restore.fill(path, 'evenodd')
    this.restore.globalCompositeOperation = 'source-over'
  }

  /**
   * AI 결과(경계 다듬기 후, 원본 해상도)에 수정 레이어(+ 칠하는 중인 획)를 적용한 새 캔버스.
   * 알파 = 결과 × (1 − W) + T×W, 색 = 결과 색(남은 부분)·원본 색(되살린 부분).
   */
  apply(cutout: HTMLCanvasElement, original: HTMLCanvasElement): HTMLCanvasElement {
    if (this.isEmpty) return cutout
    const liveMode = this.live && this.strokeArea ? this.live.op.mode : null
    if (liveMode) this.flushStroke()
    const strokeCanvas = this.stroke?.ctx.canvas
    const { canvas, ctx } = createCanvas(this.width, this.height)
    ctx.drawImage(cutout, 0, 0)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(this.coverage.canvas, 0, 0)
    // 칠하는 중인 획: 1 − W' = (1 − W)(1 − s)
    if (liveMode && strokeCanvas) ctx.drawImage(strokeCanvas, 0, 0)
    // 되살릴 부분: 원본을 restore 알파로 잘라 더한다(lighter = 미리 곱한 값끼리 더하기 → 알파가 정확히 더해진다)
    const s = this.scratch
    s.globalCompositeOperation = 'copy'
    s.drawImage(this.restore.canvas, 0, 0)
    if (liveMode && strokeCanvas) {
      s.globalCompositeOperation = liveMode === 'erase' ? 'destination-out' : 'source-over'
      s.drawImage(strokeCanvas, 0, 0)
    }
    s.globalCompositeOperation = 'source-in'
    s.drawImage(original, 0, 0)
    s.globalCompositeOperation = 'source-over'
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(s.canvas, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    return canvas
  }

  /** 메모리 즉시 반환 */
  dispose() {
    for (const ctx of [this.coverage, this.restore, this.scratch, this.stroke?.ctx]) if (ctx) ctx.canvas.width = 0
    this.stroke = null
    this.sourcePixels = null
    this.live = null
  }
}
