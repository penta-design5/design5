'use client'

import { useState, useCallback, useMemo, RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { CardTemplate, CardUserEditData, CardTemplateConfig, ExportFormat } from '@/lib/card-schemas'
import { generateCardFileName } from '@/lib/card-schemas'
import { getB2ImageSrc } from '@/lib/b2-client-url'

interface CardExportProps {
  template: CardTemplate
  userEditData: CardUserEditData
  canvasRef: RefObject<HTMLDivElement | null>
}

function getImageSrc(url: string) {
  if (!url) return ''
  return getB2ImageSrc(url)
}

function getFontWeight(w: string): number {
  const map: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 }
  return map[w] || 400
}

function getTransformByAlign(textAlign: string, verticalAlign: string = 'middle'): string {
  const x = textAlign === 'left' ? '0' : textAlign === 'right' ? '-100%' : '-50%'
  const y = verticalAlign === 'top' ? '0' : verticalAlign === 'bottom' ? '-100%' : '-50%'
  return `translate(${x}, ${y})`
}

export function CardExport({ template, userEditData, canvasRef }: CardExportProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [highResolution, setHighResolution] = useState(true)
  const config = template.config as CardTemplateConfig
  const images = Array.isArray(template.backgroundImages) ? template.backgroundImages : []
  const idx = Math.min(Math.max(0, userEditData.selectedBackgroundIndex ?? 0), Math.max(0, images.length - 1))
  const bgItem = images[idx]
  const exportWidth = bgItem ? bgItem.width : template.width
  const exportHeight = bgItem ? bgItem.height : template.height
  const bgUrl = bgItem ? bgItem.url : ''

  const textValues = useMemo(() => {
    const values: Record<string, string> = {}
    config.textElements.forEach((el) => {
      values[el.id] = userEditData.textValues[el.id] ?? el.defaultValue
    })
    return values
  }, [config.textElements, userEditData.textValues])

  const captureCanvas = useCallback(
    async (format: ExportFormat): Promise<HTMLCanvasElement | null> => {
      await document.fonts.ready

      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.zIndex = '-1'
      document.body.appendChild(container)

      const exportDiv = document.createElement('div')
      exportDiv.id = 'card-canvas-export'
      exportDiv.style.position = 'relative'
      exportDiv.style.overflow = 'hidden'
      exportDiv.style.width = `${exportWidth}px`
      exportDiv.style.height = `${exportHeight}px`

      if (bgUrl) {
        const bgImg = document.createElement('img')
        bgImg.src = getImageSrc(bgUrl)
        bgImg.crossOrigin = 'anonymous'
        bgImg.style.position = 'absolute'
        bgImg.style.inset = '0'
        bgImg.style.width = '100%'
        bgImg.style.height = '100%'
        bgImg.style.objectFit = 'cover'
        exportDiv.appendChild(bgImg)
      }

      config.textElements.forEach((element) => {
        const textDiv = document.createElement('div')
        textDiv.style.position = 'absolute'
        textDiv.style.left = `${element.x}%`
        textDiv.style.top = `${element.y}%`
        textDiv.style.transform = getTransformByAlign(element.textAlign, element.verticalAlign || 'middle')
        textDiv.style.width = element.id === 'greeting' ? `${element.width ?? 90}%` : element.width ? `${element.width}%` : 'auto'
        textDiv.style.fontSize = `${element.fontSize}px`
        textDiv.style.fontWeight = String(getFontWeight(element.fontWeight))
        textDiv.style.fontFamily = 'Pretendard, sans-serif'
        textDiv.style.color = element.color
        textDiv.style.textAlign = element.textAlign
        textDiv.style.whiteSpace = element.multiline ? 'pre-wrap' : 'nowrap'
        textDiv.style.wordBreak = 'keep-all'
        textDiv.style.zIndex = '10'
        textDiv.textContent = textValues[element.id]
        exportDiv.appendChild(textDiv)
      })

      if (config.logoArea && userEditData.logoUrl) {
        const logoContainer = document.createElement('div')
        logoContainer.style.position = 'absolute'
        logoContainer.style.left = `${config.logoArea.x}%`
        logoContainer.style.top = `${config.logoArea.y}%`
        logoContainer.style.transform = 'translate(-50%, -50%)'
        logoContainer.style.width = `${config.logoArea.width}px`
        logoContainer.style.height = `${config.logoArea.height}px`
        logoContainer.style.display = 'flex'
        logoContainer.style.alignItems = 'center'
        logoContainer.style.justifyContent =
          (userEditData.logoAlign ?? 'center') === 'left'
            ? 'flex-start'
            : (userEditData.logoAlign ?? 'center') === 'right'
              ? 'flex-end'
              : 'center'
        logoContainer.style.zIndex = '10'
        const logoImg = document.createElement('img')
        logoImg.src = userEditData.logoUrl
        logoImg.crossOrigin = 'anonymous'
        logoImg.style.maxWidth = '100%'
        logoImg.style.maxHeight = '100%'
        logoImg.style.objectFit = 'contain'
        logoImg.style.objectPosition =
          (userEditData.logoAlign ?? 'center') === 'left'
            ? 'left'
            : (userEditData.logoAlign ?? 'center') === 'right'
              ? 'right'
              : 'center'
        logoContainer.appendChild(logoImg)
        exportDiv.appendChild(logoContainer)
      }

      container.appendChild(exportDiv)

      const imgs = container.querySelectorAll('img')
      await Promise.all(
        Array.from(imgs).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve()
              else {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              }
            })
        )
      )
      await new Promise((r) => setTimeout(r, 100))

      const scale = highResolution ? 2 : 1
      try {
        const canvas = await html2canvas(exportDiv, {
          useCORS: true,
          allowTaint: false,
          scale,
          backgroundColor: format === 'jpg' ? '#FFFFFF' : null,
          logging: false,
        })
        return canvas
      } catch (e) {
        console.error(e)
        return null
      } finally {
        document.body.removeChild(container)
      }
    },
    [config, textValues, userEditData, exportWidth, exportHeight, bgUrl, highResolution]
  )

  const downloadPNG = useCallback(async () => {
    setExporting('png')
    try {
      const canvas = await captureCanvas('png')
      if (!canvas) throw new Error('캡처에 실패했습니다.')
      const link = document.createElement('a')
      link.download = generateCardFileName(template.name, 'png')
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error(e)
      toast.error('PNG 다운로드 중 오류가 발생했습니다.')
    } finally {
      setExporting(null)
    }
  }, [captureCanvas, template.name])

  const downloadJPG = useCallback(async () => {
    setExporting('jpg')
    try {
      const canvas = await captureCanvas('jpg')
      if (!canvas) throw new Error('캡처에 실패했습니다.')
      const link = document.createElement('a')
      link.download = generateCardFileName(template.name, 'jpg')
      link.href = canvas.toDataURL('image/jpeg', 0.92)
      link.click()
    } catch (e) {
      console.error(e)
      toast.error('JPG 다운로드 중 오류가 발생했습니다.')
    } finally {
      setExporting(null)
    }
  }, [captureCanvas, template.name])

  const downloadPDF = useCallback(async () => {
    setExporting('pdf')
    try {
      const canvas = await captureCanvas('pdf')
      if (!canvas) throw new Error('캡처에 실패했습니다.')
      const isLandscape = exportWidth > exportHeight
      const pxToMm = (px: number) => px * 0.264583
      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', [pxToMm(exportWidth), pxToMm(exportHeight)])
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pxToMm(exportWidth), pxToMm(exportHeight))
      pdf.save(generateCardFileName(template.name, 'pdf'))
    } catch (e) {
      console.error(e)
      toast.error('PDF 다운로드 중 오류가 발생했습니다.')
    } finally {
      setExporting(null)
    }
  }, [captureCanvas, template.name, exportWidth, exportHeight])

  const isExporting = exporting !== null

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">내보내기</h3>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="card-high-res"
            checked={highResolution}
            onCheckedChange={(c: boolean) => setHighResolution(c)}
          />
          <Label htmlFor="card-high-res" className="text-xs">
            고해상도 (2x)
          </Label>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button onClick={downloadPNG} disabled={isExporting} className="flex-col h-auto py-3">
          {exporting === 'png' ? <Loader2 className="h-6 w-6 animate-spin mb-1" /> : null}
          <span className="text-xs">PNG</span>
        </Button>
        <Button onClick={downloadJPG} disabled={isExporting} className="flex-col h-auto py-3">
          {exporting === 'jpg' ? <Loader2 className="h-6 w-6 animate-spin mb-1" /> : null}
          <span className="text-xs">JPG</span>
        </Button>
        <Button onClick={downloadPDF} disabled={isExporting} className="flex-col h-auto py-3">
          {exporting === 'pdf' ? <Loader2 className="h-6 w-6 animate-spin mb-1" /> : null}
          <span className="text-xs">PDF</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        선택한 배경 크기 {exportWidth} × {exportHeight}px
        {highResolution ? ` (고해상도: ${exportWidth * 2} × ${exportHeight * 2}px)` : ''}로 내보냅니다.
      </p>
    </div>
  )
}
