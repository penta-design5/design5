import { TEXT_FONT_STACKS } from './annotation-render'
import {
  isWatermarkActive,
  layoutWatermark,
  logoItemSize,
  watermarkFontSize,
  type ItemSize,
  type WatermarkLogo,
  type WatermarkSettings,
} from './watermark'

/**
 * 워터마크 그리기 — 화면(Konva `Shape` sceneFunc)과 내보내기(오프스크린 캔버스)가 **같은 함수**를 쓴다.
 * ctx는 원본 이미지 좌표계여야 한다(화면은 Konva가 줌·이동 변환을 미리 걸어 줌).
 * 브라우저 전용 — 클라이언트 컴포넌트에서만 import.
 */

/** 텍스트 줄 높이 배수 — 항목 크기(배치 계산)에 사용 */
const TEXT_LINE_HEIGHT = 1.2
/** 텍스트 테두리 굵기 = 글자 크기 × 이 값 (선 굵기는 변환에 비례하므로 화면·저장 결과 동일) */
const OUTLINE_FACTOR = 0.06

const textFont = (settings: WatermarkSettings, fontSize: number) =>
  `${settings.bold ? 'bold ' : ''}${fontSize}px ${TEXT_FONT_STACKS[settings.font]}`

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  doc: { width: number; height: number },
  settings: WatermarkSettings,
  logo: WatermarkLogo | null
): void {
  if (!isWatermarkActive(settings, logo)) return

  ctx.save()
  try {
    let item: ItemSize
    let drawItem: () => void
    if (settings.kind === 'text') {
      const text = settings.text.trim()
      const fontSize = watermarkFontSize(doc, settings)
      ctx.font = textFont(settings, fontSize)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = settings.color
      ctx.lineJoin = 'round'
      ctx.lineWidth = fontSize * OUTLINE_FACTOR
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
      item = { width: ctx.measureText(text).width, height: fontSize * TEXT_LINE_HEIGHT }
      drawItem = () => {
        if (settings.outline) ctx.strokeText(text, 0, 0)
        ctx.fillText(text, 0, 0)
      }
    } else {
      const source = logo as WatermarkLogo
      item = logoItemSize(doc, settings, source)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      drawItem = () => ctx.drawImage(source.canvas, -item.width / 2, -item.height / 2, item.width, item.height)
    }

    // 항목끼리 겹치지 않으므로 항목별 알파 = 전체 알파 (Konva shape 불투명도와 곱함)
    ctx.globalAlpha *= settings.opacity
    const rad = (settings.rotation * Math.PI) / 180
    for (const { x, y } of layoutWatermark(doc, item, settings)) {
      ctx.save()
      ctx.translate(x, y)
      if (rad) ctx.rotate(rad)
      drawItem()
      ctx.restore()
    }
  } finally {
    ctx.restore()
  }
}

/**
 * 합성이 끝난 캔버스(베이스+주석) 위에 워터마크를 원본 해상도로 합성한 새 캔버스를 반환.
 * 워터마크가 꺼져 있으면 입력을 그대로 반환한다(불변 취급).
 */
export function renderWatermarked(
  source: HTMLCanvasElement,
  settings: WatermarkSettings,
  logo: WatermarkLogo | null
): HTMLCanvasElement {
  if (!isWatermarkActive(settings, logo)) return source
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('브라우저에서 캔버스를 사용할 수 없습니다.')
  ctx.drawImage(source, 0, 0)
  drawWatermark(ctx, canvas, settings, logo)
  return canvas
}
