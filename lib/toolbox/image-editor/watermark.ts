import type { TextFont } from './annotations'

/**
 * 워터마크 설정·배치 계산(순수 로직). 렌더링(화면·내보내기 공용)은 `watermark-render.ts`.
 *
 * - 워터마크는 히스토리(EditorDoc)에 넣지 않는 **설정값 기반 레이어**다 — 실행취소 대상 아님.
 * - 회전·자르기 등으로 문서 크기가 바뀌어도 flatten하지 않고, 항상 **현재 크기에 맞춰 맨 마지막에 합성**한다.
 * - 크기·여백·간격은 모두 **이미지 짧은 변 대비 %** — 이미지 크기가 달라도 비율·위치가 일관된다.
 */

export type WatermarkKind = 'text' | 'image'
export type WatermarkLayout = 'single' | 'tile'
export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/** 3×3 격자 순서(좌상 → 우하) — 패널 버튼 배치와 동일 */
export const WATERMARK_POSITIONS: WatermarkPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

export const WATERMARK_POSITION_LABELS: Record<WatermarkPosition, string> = {
  'top-left': '왼쪽 위',
  'top-center': '가운데 위',
  'top-right': '오른쪽 위',
  'middle-left': '왼쪽 가운데',
  center: '가운데',
  'middle-right': '오른쪽 가운데',
  'bottom-left': '왼쪽 아래',
  'bottom-center': '가운데 아래',
  'bottom-right': '오른쪽 아래',
}

export interface WatermarkSettings {
  enabled: boolean
  kind: WatermarkKind
  text: string
  font: TextFont
  color: string
  bold: boolean
  /** 텍스트 가장자리에 옅은 어두운 테두리 — 밝은 배경에서도 보이도록 */
  outline: boolean
  /** 텍스트 크기(글자 높이) — 짧은 변 대비 % */
  textSize: number
  /** 로고 크기(로고 너비) — 짧은 변 대비 % */
  logoSize: number
  /** 0~1 */
  opacity: number
  /** 도(-180~180) */
  rotation: number
  layout: WatermarkLayout
  position: WatermarkPosition
  /** 단일 배치 여백 — 짧은 변 대비 % */
  margin: number
  /** 타일 간격 — 짧은 변 대비 % */
  gap: number
}

/** 로고(이미지 워터마크) — 페이지 상태로만 보관(localStorage 저장 안 함) */
export interface WatermarkLogo {
  canvas: HTMLCanvasElement
  width: number
  height: number
  name: string
  /** 패널 썸네일용 (불러올 때 한 번만 생성) */
  previewUrl: string
}

export const DEFAULT_WATERMARK_TEXT = '© Penta Security'

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
  enabled: false,
  kind: 'text',
  text: DEFAULT_WATERMARK_TEXT,
  font: 'gothic',
  color: '#ffffff',
  bold: true,
  outline: true,
  textSize: 6,
  logoSize: 20,
  opacity: 0.6,
  rotation: 0,
  layout: 'single',
  position: 'bottom-right',
  margin: 3,
  gap: 10,
}

/** 슬라이더 범위 — 패널과 저장값 검증에 공용 */
export const WATERMARK_LIMITS = {
  textSize: { min: 1, max: 40, step: 0.5 },
  logoSize: { min: 2, max: 80, step: 1 },
  opacity: { min: 0.05, max: 1, step: 0.05 },
  rotation: { min: -180, max: 180, step: 1 },
  margin: { min: 0, max: 20, step: 0.5 },
  gap: { min: 0, max: 50, step: 1 },
} as const

/** 타일 개수 상한(화면·내보내기 성능 보호). 넘으면 간격을 균일하게 넓혀 개수를 맞춘다 */
export const MAX_TILES = 2500

/** 워터마크 항목 1개의 크기(px, 회전 전) */
export interface ItemSize {
  width: number
  height: number
}

/** 항목 중심 좌표(px) — 회전은 설정의 rotation을 각 항목 중심 기준으로 적용 */
export interface Placement {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

/** 워터마크가 실제로 그려지는 상태인지 (켜짐 + 내용 있음) */
export function isWatermarkActive(settings: WatermarkSettings, logo: WatermarkLogo | null): boolean {
  if (!settings.enabled) return false
  return settings.kind === 'text' ? settings.text.trim() !== '' : logo !== null
}

const shortSide = (size: Size) => Math.min(size.width, size.height)

/** 텍스트 워터마크 글자 크기(px) */
export const watermarkFontSize = (doc: Size, settings: WatermarkSettings) =>
  Math.max(1, (shortSide(doc) * settings.textSize) / 100)

/** 로고 워터마크 표시 크기(px) — 너비 = 짧은 변 × %, 높이는 로고 비율 유지 */
export function logoItemSize(doc: Size, settings: WatermarkSettings, logo: { width: number; height: number }): ItemSize {
  const width = Math.max(1, (shortSide(doc) * settings.logoSize) / 100)
  return { width, height: (width * logo.height) / logo.width }
}

/** w×h 상자를 deg만큼 회전했을 때의 bounding box (실수, 반올림 없음) */
export function rotatedExtent(width: number, height: number, deg: number): Size {
  const rad = (deg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  return { width: width * cos + height * sin, height: width * sin + height * cos }
}

const COLUMN: Record<WatermarkPosition, 0 | 1 | 2> = {
  'top-left': 0,
  'middle-left': 0,
  'bottom-left': 0,
  'top-center': 1,
  center: 1,
  'bottom-center': 1,
  'top-right': 2,
  'middle-right': 2,
  'bottom-right': 2,
}
const ROW: Record<WatermarkPosition, 0 | 1 | 2> = {
  'top-left': 0,
  'top-center': 0,
  'top-right': 0,
  'middle-left': 1,
  center: 1,
  'middle-right': 1,
  'bottom-left': 2,
  'bottom-center': 2,
  'bottom-right': 2,
}

const alongAxis = (index: 0 | 1 | 2, length: number, extent: number, margin: number) =>
  index === 0 ? margin + extent / 2 : index === 1 ? length / 2 : length - margin - extent / 2

/**
 * 워터마크 항목 배치 계산.
 * - 단일: 회전 후 bounding box가 지정 모서리에서 여백만큼 떨어지도록 중심 배치
 * - 타일: 이미지 중심을 원점으로 (항목+간격) 격자를 회전해 깔고, 홀수 줄은 반 칸 밀어(벽돌 배치) 반복감을 줄인다.
 *   회전된 이미지 범위를 모두 덮도록 격자를 넉넉히 만들고, 이미지와 겹치지 않는 항목은 제외한다.
 */
export function layoutWatermark(doc: Size, item: ItemSize, settings: WatermarkSettings): Placement[] {
  if (doc.width <= 0 || doc.height <= 0 || item.width <= 0 || item.height <= 0) return []
  const unit = shortSide(doc) / 100
  const bounds = rotatedExtent(item.width, item.height, settings.rotation)

  if (settings.layout === 'single') {
    const margin = settings.margin * unit
    const { position } = settings
    return [
      {
        x: alongAxis(COLUMN[position], doc.width, bounds.width, margin),
        y: alongAxis(ROW[position], doc.height, bounds.height, margin),
      },
    ]
  }

  const gap = settings.gap * unit
  let stepX = item.width + gap
  let stepY = item.height + gap
  // 격자 좌표계(회전된 축)에서 본 이미지 범위
  const area = rotatedExtent(doc.width, doc.height, settings.rotation)
  const estimate = (area.width / stepX + 3) * (area.height / stepY + 3)
  if (estimate > MAX_TILES) {
    const factor = Math.sqrt(estimate / MAX_TILES)
    stepX *= factor
    stepY *= factor
  }

  const nx = Math.ceil(area.width / 2 / stepX) + 1
  const ny = Math.ceil(area.height / 2 / stepY) + 1
  const rad = (settings.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = doc.width / 2
  const cy = doc.height / 2
  const halfW = bounds.width / 2
  const halfH = bounds.height / 2

  const placements: Placement[] = []
  for (let j = -ny; j <= ny; j++) {
    const offset = Math.abs(j) % 2 === 1 ? stepX / 2 : 0
    for (let i = -nx; i <= nx; i++) {
      const lx = i * stepX + offset
      const ly = j * stepY
      const x = cx + lx * cos - ly * sin
      const y = cy + lx * sin + ly * cos
      // 이미지와 겹치지 않는 항목 제외
      if (x + halfW < 0 || x - halfW > doc.width || y + halfH < 0 || y - halfH > doc.height) continue
      placements.push({ x, y })
    }
  }
  return placements
}

// ---------- localStorage (텍스트 설정만 저장 — 로고·켜짐 상태는 저장하지 않음) ----------

export const WATERMARK_STORAGE_KEY = 'toolbox:image-editor:watermark:v1'

type StoredSettings = Omit<WatermarkSettings, 'enabled'>

const clampNumber = (value: unknown, limit: { min: number; max: number }, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(limit.max, Math.max(limit.min, value)) : fallback

const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : fallback

const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)

/** 저장값 검증 — 알 수 없는 값·범위를 벗어난 값은 기본값/경계값으로. enabled는 항상 false로 시작 */
export function parseStoredWatermark(raw: string | null): WatermarkSettings {
  const d = DEFAULT_WATERMARK_SETTINGS
  if (!raw) return d
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return d
    data = parsed as Record<string, unknown>
  } catch {
    return d
  }
  const L = WATERMARK_LIMITS
  return {
    enabled: false,
    kind: oneOf(data.kind, ['text', 'image'] as const, d.kind),
    text: typeof data.text === 'string' ? data.text.slice(0, 200) : d.text,
    font: oneOf(data.font, ['gothic', 'myeongjo', 'gulim', 'gungseo'] as const, d.font),
    color: isHexColor(data.color) ? data.color : d.color,
    bold: typeof data.bold === 'boolean' ? data.bold : d.bold,
    outline: typeof data.outline === 'boolean' ? data.outline : d.outline,
    textSize: clampNumber(data.textSize, L.textSize, d.textSize),
    logoSize: clampNumber(data.logoSize, L.logoSize, d.logoSize),
    opacity: clampNumber(data.opacity, L.opacity, d.opacity),
    rotation: clampNumber(data.rotation, L.rotation, d.rotation),
    layout: oneOf(data.layout, ['single', 'tile'] as const, d.layout),
    position: oneOf(data.position, WATERMARK_POSITIONS, d.position),
    margin: clampNumber(data.margin, L.margin, d.margin),
    gap: clampNumber(data.gap, L.gap, d.gap),
  }
}

export function serializeWatermark(settings: WatermarkSettings): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { enabled, ...stored } = settings
  return JSON.stringify(stored satisfies StoredSettings)
}

/** 브라우저 저장소가 막힌 환경(시크릿 모드 등)에서도 동작하도록 예외를 삼킨다 */
export function loadWatermarkSettings(): WatermarkSettings {
  try {
    return parseStoredWatermark(window.localStorage.getItem(WATERMARK_STORAGE_KEY))
  } catch {
    return DEFAULT_WATERMARK_SETTINGS
  }
}

export function saveWatermarkSettings(settings: WatermarkSettings): void {
  try {
    window.localStorage.setItem(WATERMARK_STORAGE_KEY, serializeWatermark(settings))
  } catch {
    // 저장 실패는 무시(편의 기능)
  }
}
