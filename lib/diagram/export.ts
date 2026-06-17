/**
 * 다이어그램 포맷 내보내기 (SVG / PPTX)
 *
 * exportToSVG는 순수 문자열 생성, exportToPPTX는 pptxgenjs 의존.
 * 도형 기하 계산은 ./shapes에서 가져온다.
 */

import pptxgen from 'pptxgenjs'
import {
  type Shape,
  getShapeBounds,
  getCalloutRectPathData,
  getCalloutOvalPathData,
  getBlockArrowPoints,
  CALLOUT_OVAL_BASE_WIDTH,
  CALLOUT_OVAL_BASE_HEIGHT,
} from './shapes'

/**
 * XML 이스케이프
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function polygonPoints(cx: number, cy: number, radius: number, sides: number, rotationDeg: number): string {
  const rot = (rotationDeg * Math.PI) / 180
  const pts: string[] = []
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * 2 * Math.PI) / sides - Math.PI / 2
    pts.push(`${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`)
  }
  return pts.join(' ')
}

function starPoints(cx: number, cy: number, numPoints: number, outerR: number, innerR: number, rotationDeg: number): string {
  const rot = (rotationDeg * Math.PI) / 180
  const pts: string[] = []
  const n = numPoints * 2
  for (let i = 0; i < n; i++) {
    const a = rot + (i * Math.PI) / numPoints - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
  }
  return pts.join(' ')
}

/**
 * SVG로 내보내기 (도형 경계에 맞게 자동 크기 조정)
 */
export function exportToSVG(shapes: Shape[], width: number, height: number): string {
  if (shapes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`
  }

  // 모든 도형의 경계 계산
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  shapes.forEach((shape) => {
    const b = getShapeBounds(shape)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  })

  // 여백 추가
  const padding = 20
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding

  const svgWidth = Math.max(100, maxX - minX)
  const svgHeight = Math.max(100, maxY - minY)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="${minX} ${minY} ${svgWidth} ${svgHeight}">\n`

  shapes.forEach((shape) => {
    const fill = shape.fill || '#000000'
    const stroke = shape.stroke || 'none'
    const strokeWidth = shape.strokeWidth || 0

    if (shape.type === 'rect' && shape.width && shape.height) {
      svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />\n`
    } else if (shape.type === 'circle' && shape.radius) {
      svg += `  <circle cx="${shape.x + shape.radius}" cy="${shape.y + shape.radius}" r="${shape.radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />\n`
    } else if (shape.type === 'text') {
      const fontSize = shape.fontSize || 16
      const fontFamily = shape.fontFamily || 'Arial'
      const align = shape.align || 'left'
      const textAnchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
      svg += `  <text x="${shape.x}" y="${shape.y + fontSize}" text-anchor="${textAnchor}" font-size="${fontSize}" font-family="${fontFamily}" fill="${fill}">${escapeXml(shape.text || '')}</text>\n`
    } else if (shape.type === 'arrow' && shape.points && shape.points.length >= 4) {
      const [x1, y1, x2, y2] = shape.points
      const absX1 = shape.x + x1
      const absY1 = shape.y + y1
      const absX2 = shape.x + x2
      const absY2 = shape.y + y2
      svg += `  <line x1="${absX1}" y1="${absY1}" x2="${absX2}" y2="${absY2}" stroke="${fill}" stroke-width="${strokeWidth || 2}" />\n`
      const angle = Math.atan2(absY2 - absY1, absX2 - absX1)
      const headLength = shape.pointerLength || 10
      const headWidth = shape.pointerWidth || 10
      const arrowPoint1X = absX2 - headLength * Math.cos(angle - Math.PI / 6)
      const arrowPoint1Y = absY2 - headLength * Math.sin(angle - Math.PI / 6)
      const arrowPoint2X = absX2 - headLength * Math.cos(angle + Math.PI / 6)
      const arrowPoint2Y = absY2 - headLength * Math.sin(angle + Math.PI / 6)
      svg += `  <polygon points="${absX2},${absY2} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}" fill="${fill}" />\n`
    } else if (shape.type === 'roundedRect' && shape.width && shape.height) {
      const r = shape.cornerRadius ?? 10
      svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${r}" ry="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="rotate(${shape.rotation ?? 0} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})" />\n`
    } else if ((shape.type === 'triangle' || shape.type === 'pentagon' || shape.type === 'hexagon' || shape.type === 'octagon') && shape.sides && shape.radius) {
      const pts = polygonPoints(shape.x, shape.y, shape.radius, shape.sides, shape.rotation ?? 0)
      svg += `  <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />\n`
    } else if (shape.type === 'diamond' && shape.radius) {
      const pts = polygonPoints(shape.x, shape.y, shape.radius, 4, shape.rotation ?? 0)
      svg += `  <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />\n`
    } else if (shape.type === 'star' && (shape.outerRadius ?? shape.radius)) {
      const outer = shape.outerRadius ?? shape.radius ?? 50
      const inner = shape.innerRadius ?? outer * 0.4
      const pts = starPoints(shape.x, shape.y, shape.numPoints ?? 5, outer, inner, shape.rotation ?? 0)
      svg += `  <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />\n`
    } else if ((shape.type === 'parallelogram' || shape.type === 'rectCut') && shape.points && shape.points.length >= 6) {
      const abs = shape.points.map((p, i) => (i % 2 === 0 ? shape.x + p : shape.y + p))
      const pairs: string[] = []
      for (let i = 0; i < abs.length; i += 2) pairs.push(`${abs[i]},${abs[i + 1]}`)
      const rot = shape.rotation ?? 0
      const cx = shape.x + (shape.width ?? 100) / 2
      const cy = shape.y + (shape.height ?? 60) / 2
      svg += `  <polygon points="${pairs.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="rotate(${rot} ${cx} ${cy})" />\n`
    } else if ((shape.type === 'blockArrowRight' || shape.type === 'blockArrowLeft' || shape.type === 'blockArrowUp' || shape.type === 'blockArrowDown') && shape.width != null && shape.height != null) {
      const headLen = shape.pointerLength ?? 20
      const headW = shape.pointerWidth ?? 40
      const isHorz = shape.type === 'blockArrowRight' || shape.type === 'blockArrowLeft'
      const shaft = Math.max(1, isHorz ? shape.width - headLen : shape.height - headLen)
      const pts = getBlockArrowPoints(shape.type, shaft, headLen, headW)
      const abs = pts.map((p, i) => (i % 2 === 0 ? shape.x + p : shape.y + p))
      const pairs: string[] = []
      for (let i = 0; i < abs.length; i += 2) pairs.push(`${abs[i]},${abs[i + 1]}`)
      const rot = shape.rotation ?? 0
      const cx = shape.x + shape.width / 2
      const cy = shape.y + shape.height / 2
      svg += `  <polygon points="${pairs.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="rotate(${rot} ${cx} ${cy})" />\n`
    } else if ((shape.type === 'cylinder' || shape.type === 'document' || shape.type === 'calloutCloud') && shape.pathData) {
      svg += `  <path d="${shape.pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="translate(${shape.x},${shape.y})${shape.rotation ? ` rotate(${shape.rotation} ${(shape.width ?? 100) / 2} ${(shape.height ?? 80) / 2})` : ''}" />\n`
    } else if (shape.type === 'calloutRect' && shape.width && shape.height) {
      const pathD = getCalloutRectPathData(shape)
      const rot = shape.rotation ?? 0
      svg += `  <path d="${pathD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="translate(${shape.x},${shape.y})${rot ? ` rotate(${rot} ${shape.width / 2} ${shape.height / 2})` : ''}" />\n`
    } else if (shape.type === 'calloutOval' && shape.width && shape.height) {
      const pathD = getCalloutOvalPathData(shape)
      const w = shape.width
      const h = shape.height
      const rot = shape.rotation ?? 0
      if (shape.pathData) {
        // 템플릿 path (231x156): 위치·스케일·회전
        const scaleX = w / CALLOUT_OVAL_BASE_WIDTH
        const scaleY = h / CALLOUT_OVAL_BASE_HEIGHT
        const cx = 115.5
        const cy = 78
        svg += `  <path d="${pathD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="translate(${shape.x - w / 2},${shape.y - h / 2}) scale(${scaleX},${scaleY})${rot ? ` rotate(${rot} ${cx} ${cy})` : ''}" />\n`
      } else {
        svg += `  <path d="${pathD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="translate(${shape.x - w / 2},${shape.y - h / 2})${rot ? ` rotate(${rot} ${w / 2} ${h / 2})` : ''}" />\n`
      }
    }
  })

  svg += `</svg>`
  return svg
}

/**
 * PPTX로 내보내기
 */
export async function exportToPPTX(
  shapes: Shape[],
  title: string,
  canvasWidth: number,
  canvasHeight: number
): Promise<Blob> {
  const pptx = new pptxgen()

  // 슬라이드 크기 설정 (16:9 비율, 10 x 5.625 inches)
  pptx.layout = 'LAYOUT_16x9'

  const slide = pptx.addSlide()

  const scale = 10 / canvasWidth
  const fc = (c: string) => c.replace('#', '')
  const lineOpt = (s: Shape) =>
    (s.strokeWidth ?? 0) > 0
      ? { color: (s.stroke || '#000').replace('#', ''), width: s.strokeWidth ?? 0 }
      : undefined

  shapes.forEach((shape) => {
    const fill = shape.fill || '#000000'
    const stroke = shape.stroke || 'none'
    const strokeWidth = shape.strokeWidth || 0
    const rotation = shape.rotation || 0
    const b = getShapeBounds(shape)
    const xInch = b.x * scale
    const yInch = b.y * scale
    const wInch = b.width * scale
    const hInch = b.height * scale

    try {
      if (shape.type === 'rect' && shape.width && shape.height) {
        slide.addShape(pptx.ShapeType.rect, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'circle' && shape.radius) {
        const d = shape.radius * 2 * scale
        slide.addShape(pptx.ShapeType.ellipse, {
          x: xInch,
          y: yInch,
          w: d,
          h: d,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'text') {
        slide.addText(shape.text ?? '', {
          x: xInch,
          y: yInch,
          fontSize: shape.fontSize || 16,
          color: fc(fill),
          fontFace: shape.fontFamily || 'Arial',
          rotate: rotation,
        })
      } else if (shape.type === 'arrow' && shape.points && shape.points.length >= 4) {
        const [x1, y1, x2, y2] = shape.points
        const absX1 = shape.x + x1
        const absY1 = shape.y + y1
        const absX2 = shape.x + x2
        const absY2 = shape.y + y2
        slide.addShape(pptx.ShapeType.line, {
          x: absX1 * scale,
          y: absY1 * scale,
          w: (absX2 - absX1) * scale,
          h: (absY2 - absY1) * scale,
          line: {
            color: fc(fill),
            width: strokeWidth || 2,
            endArrowType: 'arrow',
          },
          rotate: rotation,
        })
      } else if (shape.type === 'roundedRect' && shape.width && shape.height) {
        const r = Math.min(0.5, ((shape.cornerRadius ?? 10) * 2) / Math.min(shape.width, shape.height))
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rectRadius: r,
          rotate: rotation,
        })
      } else if (shape.type === 'triangle' && shape.radius) {
        slide.addShape(pptx.ShapeType.triangle, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'pentagon' && shape.radius) {
        slide.addShape(pptx.ShapeType.pentagon, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'hexagon' && shape.radius) {
        slide.addShape(pptx.ShapeType.hexagon, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'octagon' && shape.radius) {
        slide.addShape(pptx.ShapeType.octagon, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'diamond' && shape.radius) {
        slide.addShape(pptx.ShapeType.diamond, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'star') {
        slide.addShape(pptx.ShapeType.ellipse, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'blockArrowRight') {
        slide.addShape(pptx.ShapeType.rightArrow, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'blockArrowLeft') {
        slide.addShape(pptx.ShapeType.leftArrow, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'blockArrowUp') {
        slide.addShape(pptx.ShapeType.upArrow, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'blockArrowDown') {
        slide.addShape(pptx.ShapeType.downArrow, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'parallelogram') {
        slide.addShape(pptx.ShapeType.flowChartInputOutput, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'cylinder') {
        slide.addShape(pptx.ShapeType.can, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'document') {
        slide.addShape(pptx.ShapeType.flowChartDocument, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'calloutRect' && shape.width && shape.height) {
        const r = Math.min(0.5, ((shape.cornerRadius ?? 8) * 2) / Math.min(shape.width, shape.height))
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rectRadius: r,
          rotate: rotation,
        })
      } else if (shape.type === 'calloutOval' && shape.width && shape.height) {
        slide.addShape(pptx.ShapeType.ellipse, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'calloutCloud') {
        slide.addShape(pptx.ShapeType.cloudCallout, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      } else if (shape.type === 'rectCut' && shape.width && shape.height) {
        slide.addShape(pptx.ShapeType.rect, {
          x: xInch,
          y: yInch,
          w: wInch,
          h: hInch,
          fill: { color: fc(fill) },
          line: lineOpt(shape),
          rotate: rotation,
        })
      }
    } catch (error) {
      console.error('Error adding shape to PPTX:', shape.type, error)
    }
  })

  const blob = (await pptx.write({ outputType: 'blob' })) as Blob
  return blob
}
