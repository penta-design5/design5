'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Trash2,
  Type,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { CardTemplateConfig, CardTextElement, CardLogoArea } from '@/lib/card-schemas'

interface CardElementEditorProps {
  config: CardTemplateConfig
  width: number
  height: number
  firstBackgroundUrl: string | null
  onAddTextElement: () => void
  onRemoveTextElement: (elementId: string) => void
  onUpdateTextElement: (elementId: string, updates: Partial<CardTextElement>) => void
  onUpdateLogoArea: (updates: Partial<CardLogoArea> | null) => void
}

function getImageSrc(url: string | null) {
  if (!url) return ''
  if (url.startsWith('blob:')) return url
  if (url.startsWith('http') && url.includes('backblazeb2.com')) {
    return `/api/posts/images?url=${encodeURIComponent(url)}`
  }
  return url
}

function getFontWeight(weight: string): number {
  const map: Record<string, number> = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
  return map[weight] || 400
}

function getTransformByAlign(textAlign: string, verticalAlign: string = 'middle'): string {
  const x = textAlign === 'left' ? '0' : textAlign === 'right' ? '-100%' : '-50%'
  const y = verticalAlign === 'top' ? '0' : verticalAlign === 'bottom' ? '-100%' : '-50%'
  return `translate(${x}, ${y})`
}

function getGreetingEdges(element: CardTextElement): { leftEdge: number; rightEdge: number } {
  const w = element.width ?? 90
  const align = element.textAlign ?? 'left'
  if (align === 'left') return { leftEdge: element.x, rightEdge: element.x + w }
  if (align === 'right') return { leftEdge: element.x - w, rightEdge: element.x }
  return { leftEdge: element.x - w / 2, rightEdge: element.x + w / 2 }
}

export function CardElementEditor({
  config,
  width,
  height,
  firstBackgroundUrl,
  onAddTextElement,
  onRemoveTextElement,
  onUpdateTextElement,
  onUpdateLogoArea,
}: CardElementEditorProps) {
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [elementStartPositions, setElementStartPositions] = useState<
    Record<string, { x: number; y: number; element?: CardTextElement }>
  >({})
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false)
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 })
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 })
  const [justFinishedMarquee, setJustFinishedMarquee] = useState(false)
  const [zoom, setZoom] = useState(0.5)

  const previewRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const dragSnapshotRef = useRef<Record<string, { x: number; y: number; element?: CardTextElement }>>({})
  const [resizingEdge, setResizingEdge] = useState<'left' | 'right' | null>(null)
  const resizeStartRef = useRef<{
    elementId: string
    elementLeft: number
    elementRight: number
    elementX: number
    elementWidth: number
    textAlign: string
  } | null>(null)

  const isValidHex = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color)

  const selectedTextElements = useMemo(
    () => config.textElements.filter((el) => selectedElementIds.includes(el.id)),
    [config.textElements, selectedElementIds]
  )
  const isLogoSelected = selectedElementIds.includes('logo')
  const commonProperties = useMemo(() => {
    if (selectedTextElements.length <= 1) return selectedTextElements[0] ?? null
    const first = selectedTextElements[0]
    return {
      fontSize: selectedTextElements.every((el) => el.fontSize === first.fontSize) ? first.fontSize : null,
      fontWeight: selectedTextElements.every((el) => el.fontWeight === first.fontWeight) ? first.fontWeight : null,
      color: selectedTextElements.every((el) => el.color === first.color) ? first.color : null,
      textAlign: selectedTextElements.every((el) => el.textAlign === first.textAlign) ? first.textAlign : null,
    }
  }, [selectedTextElements])

  const handleElementSelect = useCallback((elementId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.shiftKey) return
    if (!selectedElementIds.includes(elementId)) setSelectedElementIds([elementId])
  }, [selectedElementIds])

  const handleDragStart = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation()
      if (!previewRef.current) return
      let currentSelection = selectedElementIds
      if (e.shiftKey) {
        if (selectedElementIds.includes(elementId)) {
          currentSelection = selectedElementIds.filter((id) => id !== elementId)
        } else {
          currentSelection = [...selectedElementIds, elementId]
        }
        setSelectedElementIds(currentSelection)
        return
      }
      if (!selectedElementIds.includes(elementId)) {
        currentSelection = [elementId]
        setSelectedElementIds(currentSelection)
      }
      const rect = previewRef.current.getBoundingClientRect()
      const startPositions: Record<string, { x: number; y: number; element?: CardTextElement }> = {}
      currentSelection.forEach((id) => {
        if (id === 'logo' && config.logoArea) {
          startPositions[id] = { x: config.logoArea.x, y: config.logoArea.y }
        } else {
          const el = config.textElements.find((x) => x.id === id)
          if (el) startPositions[id] = { x: el.x, y: el.y, element: { ...el } }
        }
      })
      dragSnapshotRef.current = startPositions
      setElementStartPositions(startPositions)
      setDragStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setIsDragging(true)
    },
    [selectedElementIds, config.textElements, config.logoArea]
  )

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !previewRef.current) return
      const rect = previewRef.current.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      const deltaXPercent = ((currentX - dragStartPos.x) / rect.width) * 100
      const deltaYPercent = ((currentY - dragStartPos.y) / rect.height) * 100
      const snapshot = dragSnapshotRef.current
      Object.entries(snapshot).forEach(([id, startPos]) => {
        const newX = Math.max(0, Math.min(100, startPos.x + deltaXPercent))
        const newY = Math.max(0, Math.min(100, startPos.y + deltaYPercent))
        if (id === 'logo') {
          onUpdateLogoArea({ x: Math.round(newX), y: Math.round(newY) })
        } else {
          onUpdateTextElement(id, { x: Math.round(newX), y: Math.round(newY) })
        }
      })
    },
    [isDragging, dragStartPos, onUpdateTextElement, onUpdateLogoArea]
  )

  const handleMarqueeStart = useCallback((e: React.MouseEvent) => {
    if (!previewRef.current) return
    const target = e.target as HTMLElement
    if (target.closest('[data-element-id]')) return
    const rect = previewRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMarqueeStart({ x, y })
    setMarqueeEnd({ x, y })
    setIsMarqueeSelecting(true)
    if (!e.shiftKey) setSelectedElementIds([])
  }, [])

  const handleMarqueeMove = useCallback((e: MouseEvent) => {
    if (!isMarqueeSelecting || !previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    setMarqueeEnd({
      x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
    })
  }, [isMarqueeSelecting])

  const handleMarqueeEnd = useCallback(() => {
    if (!isMarqueeSelecting || !previewRef.current) {
      setIsMarqueeSelecting(false)
      return
    }
    const rect = previewRef.current.getBoundingClientRect()
    const minX = (Math.min(marqueeStart.x, marqueeEnd.x) / rect.width) * 100
    const maxX = (Math.max(marqueeStart.x, marqueeEnd.x) / rect.width) * 100
    const minY = (Math.min(marqueeStart.y, marqueeEnd.y) / rect.height) * 100
    const maxY = (Math.max(marqueeStart.y, marqueeEnd.y) / rect.height) * 100
    const elementsInMarquee: string[] = []
    config.textElements.forEach((el) => {
      if (el.x >= minX && el.x <= maxX && el.y >= minY && el.y <= maxY) elementsInMarquee.push(el.id)
    })
    if (config.logoArea && config.logoArea.x >= minX && config.logoArea.x <= maxX && config.logoArea.y >= minY && config.logoArea.y <= maxY) {
      elementsInMarquee.push('logo')
    }
    setSelectedElementIds((prev) => [...new Set([...prev, ...elementsInMarquee])])
    setIsMarqueeSelecting(false)
    setJustFinishedMarquee(true)
    setTimeout(() => setJustFinishedMarquee(false), 0)
  }, [isMarqueeSelecting, marqueeStart, marqueeEnd, config.textElements, config.logoArea])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setElementStartPositions({})
    dragSnapshotRef.current = {}
  }, [])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, edge: 'left' | 'right', element: CardTextElement) => {
      e.stopPropagation()
      const { leftEdge, rightEdge } = getGreetingEdges(element)
      setResizingEdge(edge)
      resizeStartRef.current = {
        elementId: element.id,
        elementLeft: leftEdge,
        elementRight: rightEdge,
        elementX: element.x,
        elementWidth: element.width ?? 90,
        textAlign: element.textAlign ?? 'left',
      }
    },
    []
  )

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      const start = resizeStartRef.current
      if (!resizingEdge || !start || !previewRef.current) return
      const rect = previewRef.current.getBoundingClientRect()
      const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100
      const MIN_WIDTH = 20
      const align = start.textAlign
      let newX: number
      let newWidth: number
      if (resizingEdge === 'left') {
        const newLeft = Math.max(0, Math.min(start.elementRight - MIN_WIDTH, mouseXPercent))
        newWidth = start.elementRight - newLeft
        newWidth = Math.max(MIN_WIDTH, Math.min(100, newWidth))
        const actualLeft = start.elementRight - newWidth
        newX = align === 'left' ? actualLeft : align === 'right' ? start.elementRight : actualLeft + newWidth / 2
      } else {
        const newRight = Math.min(100, Math.max(start.elementLeft + MIN_WIDTH, mouseXPercent))
        newWidth = newRight - start.elementLeft
        newWidth = Math.max(MIN_WIDTH, Math.min(100, newWidth))
        const actualRight = start.elementLeft + newWidth
        newX = align === 'left' ? start.elementLeft : align === 'right' ? actualRight : start.elementLeft + newWidth / 2
      }
      onUpdateTextElement(start.elementId, { x: Math.round(newX), width: Math.round(newWidth) })
    },
    [resizingEdge, onUpdateTextElement]
  )

  const handleResizeEnd = useCallback(() => {
    setResizingEdge(null)
    resizeStartRef.current = null
  }, [])

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (justFinishedMarquee) return
    const target = e.target as HTMLElement
    if (target.closest('[data-resize-handle]')) return
    if (!target.closest('[data-element-id]')) setSelectedElementIds([])
  }, [justFinishedMarquee])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingEdge) handleResizeMove(e)
      else if (isDragging) handleDragMove(e)
      else if (isMarqueeSelecting) handleMarqueeMove(e)
    }
    const handleMouseUp = () => {
      if (resizingEdge) handleResizeEnd()
      if (isDragging) handleDragEnd()
      if (isMarqueeSelecting) handleMarqueeEnd()
    }
    if (resizingEdge || isDragging || isMarqueeSelecting) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizingEdge, isDragging, isMarqueeSelecting, handleResizeMove, handleResizeEnd, handleDragMove, handleMarqueeMove, handleDragEnd, handleMarqueeEnd])

  const handleZoomIn = useCallback(() => setZoom((p) => Math.min(1, p + 0.1)), [])
  const handleZoomOut = useCallback(() => setZoom((p) => Math.max(0.1, p - 0.1)), [])
  const handleZoomReset = useCallback(() => setZoom(1), [])

  const alignLeft = useCallback(() => {
    if (selectedElementIds.length < 1) return
    if (selectedElementIds.length === 1) {
      const id = selectedElementIds[0]
      if (id === 'logo' && config.logoArea) {
        const logoW = (config.logoArea.width / width) * 100
        onUpdateLogoArea({ x: logoW / 2 })
      } else {
        onUpdateTextElement(id, { x: 0, textAlign: 'left' })
      }
      return
    }
    let minX = Infinity
    selectedElementIds.forEach((id) => {
      if (id === 'logo' && config.logoArea) minX = Math.min(minX, config.logoArea.x)
      else {
        const el = config.textElements.find((x) => x.id === id)
        if (el) minX = Math.min(minX, el.x)
      }
    })
    selectedElementIds.forEach((id) => {
      if (id === 'logo') onUpdateLogoArea({ x: Math.round(minX) })
      else onUpdateTextElement(id, { x: Math.round(minX), textAlign: 'left' })
    })
  }, [selectedElementIds, config, width, onUpdateLogoArea, onUpdateTextElement])

  const alignRight = useCallback(() => {
    if (selectedElementIds.length < 1) return
    if (selectedElementIds.length === 1) {
      const id = selectedElementIds[0]
      if (id === 'logo' && config.logoArea) {
        const logoW = (config.logoArea.width / width) * 100
        onUpdateLogoArea({ x: 100 - logoW / 2 })
      } else {
        onUpdateTextElement(id, { x: 100, textAlign: 'right' })
      }
      return
    }
    let maxX = -Infinity
    selectedElementIds.forEach((id) => {
      if (id === 'logo' && config.logoArea) maxX = Math.max(maxX, config.logoArea.x)
      else {
        const el = config.textElements.find((x) => x.id === id)
        if (el) maxX = Math.max(maxX, el.x)
      }
    })
    selectedElementIds.forEach((id) => {
      if (id === 'logo') onUpdateLogoArea({ x: Math.round(maxX) })
      else onUpdateTextElement(id, { x: Math.round(maxX), textAlign: 'right' })
    })
  }, [selectedElementIds, config, width, onUpdateLogoArea, onUpdateTextElement])

  const alignTop = useCallback(() => {
    if (selectedElementIds.length < 1) return
    if (selectedElementIds.length === 1) {
      const id = selectedElementIds[0]
      if (id === 'logo' && config.logoArea) {
        const logoH = (config.logoArea.height / height) * 100
        onUpdateLogoArea({ y: logoH / 2 })
      } else {
        onUpdateTextElement(id, { y: 0, verticalAlign: 'top' })
      }
      return
    }
    let minY = Infinity
    selectedElementIds.forEach((id) => {
      if (id === 'logo' && config.logoArea) minY = Math.min(minY, config.logoArea.y)
      else {
        const el = config.textElements.find((x) => x.id === id)
        if (el) minY = Math.min(minY, el.y)
      }
    })
    selectedElementIds.forEach((id) => {
      if (id === 'logo') onUpdateLogoArea({ y: Math.round(minY) })
      else onUpdateTextElement(id, { y: Math.round(minY), verticalAlign: 'top' })
    })
  }, [selectedElementIds, config, height, onUpdateLogoArea, onUpdateTextElement])

  const alignBottom = useCallback(() => {
    if (selectedElementIds.length < 1) return
    if (selectedElementIds.length === 1) {
      const id = selectedElementIds[0]
      if (id === 'logo' && config.logoArea) {
        const logoH = (config.logoArea.height / height) * 100
        onUpdateLogoArea({ y: 100 - logoH / 2 })
      } else {
        onUpdateTextElement(id, { y: 100, verticalAlign: 'bottom' })
      }
      return
    }
    let maxY = -Infinity
    selectedElementIds.forEach((id) => {
      if (id === 'logo' && config.logoArea) maxY = Math.max(maxY, config.logoArea.y)
      else {
        const el = config.textElements.find((x) => x.id === id)
        if (el) maxY = Math.max(maxY, el.y)
      }
    })
    selectedElementIds.forEach((id) => {
      if (id === 'logo') onUpdateLogoArea({ y: Math.round(maxY) })
      else onUpdateTextElement(id, { y: Math.round(maxY), verticalAlign: 'bottom' })
    })
  }, [selectedElementIds, config, height, onUpdateLogoArea, onUpdateTextElement])

  const alignCenterH = useCallback(() => {
    if (selectedElementIds.length < 1) return
    if (selectedElementIds.length === 1) {
      const id = selectedElementIds[0]
      if (id === 'logo') onUpdateLogoArea({ x: 50 })
      else onUpdateTextElement(id, { x: 50, textAlign: 'center' })
      return
    }
    let sumX = 0
    let count = 0
    selectedElementIds.forEach((id) => {
      if (id === 'logo' && config.logoArea) {
        sumX += config.logoArea.x
        count++
      } else {
        const el = config.textElements.find((x) => x.id === id)
        if (el) {
          sumX += el.x
          count++
        }
      }
    })
    const avgX = sumX / count
    selectedElementIds.forEach((id) => {
      if (id === 'logo') onUpdateLogoArea({ x: Math.round(avgX) })
      else onUpdateTextElement(id, { x: Math.round(avgX), textAlign: 'center' })
    })
  }, [selectedElementIds, config.logoArea, config.textElements, onUpdateLogoArea, onUpdateTextElement])

  const alignCenterV = useCallback(() => {
    if (selectedElementIds.length < 1) return
    if (selectedElementIds.length === 1) {
      const id = selectedElementIds[0]
      if (id === 'logo') onUpdateLogoArea({ y: 50 })
      else onUpdateTextElement(id, { y: 50, verticalAlign: 'middle' })
      return
    }
    let sumY = 0
    let count = 0
    selectedElementIds.forEach((id) => {
      if (id === 'logo' && config.logoArea) {
        sumY += config.logoArea.y
        count++
      } else {
        const el = config.textElements.find((x) => x.id === id)
        if (el) {
          sumY += el.y
          count++
        }
      }
    })
    const avgY = sumY / count
    selectedElementIds.forEach((id) => {
      if (id === 'logo') onUpdateLogoArea({ y: Math.round(avgY) })
      else onUpdateTextElement(id, { y: Math.round(avgY), verticalAlign: 'middle' })
    })
  }, [selectedElementIds, config.logoArea, config.textElements, onUpdateLogoArea, onUpdateTextElement])

  const handleBatchUpdate = useCallback(
    (updates: Partial<CardTextElement>) => {
      selectedTextElements.forEach((el) => onUpdateTextElement(el.id, updates))
    },
    [selectedTextElements, onUpdateTextElement]
  )

  const handleDeleteSelected = useCallback(() => {
    selectedElementIds.forEach((id) => {
      if (id === 'logo') onUpdateLogoArea(null)
      else onRemoveTextElement(id)
    })
    setSelectedElementIds([])
  }, [selectedElementIds, onRemoveTextElement, onUpdateLogoArea])

  return (
    <div className="h-full w-full flex overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>축소</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleZoomReset}>
                    {Math.round(zoom * 100)}%
                  </Button>
                </TooltipTrigger>
                <TooltipContent>원본 크기</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>확대</TooltipContent>
              </Tooltip>
              <div className="w-px h-6 bg-border mx-2" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={alignLeft} disabled={selectedElementIds.length < 1}>
                    <AlignHorizontalJustifyStart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>좌측 정렬</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={alignCenterH} disabled={selectedElementIds.length < 1}>
                    <AlignHorizontalJustifyCenter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>수평 중앙 정렬</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={alignRight} disabled={selectedElementIds.length < 1}>
                    <AlignHorizontalJustifyEnd className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>우측 정렬</TooltipContent>
              </Tooltip>
              <div className="w-px h-6 bg-border mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={alignTop} disabled={selectedElementIds.length < 1}>
                    <AlignVerticalJustifyStart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>상단 정렬</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={alignCenterV} disabled={selectedElementIds.length < 1}>
                    <AlignVerticalJustifyCenter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>수직 중앙 정렬</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={alignBottom} disabled={selectedElementIds.length < 1}>
                    <AlignVerticalJustifyEnd className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>하단 정렬</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <div className="text-sm text-muted-foreground">
            {selectedElementIds.length > 0 && <span>{selectedElementIds.length}개 선택됨</span>}
          </div>
        </div>

        <div ref={previewContainerRef} className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="w-full h-full overflow-auto flex items-start justify-center">
            <div
              ref={previewRef}
              className="relative bg-muted rounded-lg overflow-hidden border shadow-lg select-none cursor-crosshair flex-shrink-0"
              style={{
                width: `${width * zoom}px`,
                height: `${height * zoom}px`,
                backgroundImage: firstBackgroundUrl ? `url(${getImageSrc(firstBackgroundUrl)})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              onClick={handleBackgroundClick}
              onMouseDown={handleMarqueeStart}
            >
              {!firstBackgroundUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  배경 이미지를 업로드하세요
                </div>
              )}

              {firstBackgroundUrl &&
                config.textElements.map((element) => {
                  const isSelected = selectedElementIds.includes(element.id)
                  return (
                    <div
                      key={element.id}
                      data-element-id={element.id}
                      className={`absolute cursor-move transition-shadow ${
                        isSelected ? 'ring-2 ring-penta-blue shadow-lg' : 'hover:ring-2 hover:ring-penta-blue/50'
                      }`}
                      style={{
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        transform: getTransformByAlign(element.textAlign, element.verticalAlign || 'middle'),
                        fontSize: `${element.fontSize * zoom}px`,
                        fontWeight: getFontWeight(element.fontWeight),
                        fontFamily: 'Pretendard, sans-serif',
                        color: element.color,
                        textAlign: element.textAlign,
                        ...(element.id === 'greeting'
                          ? { width: `${element.width ?? 90}%`, maxWidth: `${element.width ?? 90}%` }
                          : { maxWidth: element.width ? `${element.width}%` : 'auto' }),
                        whiteSpace: element.multiline ? 'pre-wrap' : 'nowrap',
                        padding: `${4 * zoom}px ${8 * zoom}px`,
                        borderRadius: '4px',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.9)' : 'transparent',
                      }}
                      onMouseDown={(e) => handleDragStart(e, element.id)}
                      onClick={(e) => handleElementSelect(element.id, e)}
                    >
                      {element.defaultValue}
                      {element.id === 'greeting' && isSelected && (
                        <>
                          <div
                            data-resize-handle="left"
                            role="presentation"
                            className="absolute left-0 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 bg-penta-blue border-2 border-white rounded shadow cursor-ew-resize hover:bg-penta-blue/90"
                            style={{
                              width: `${Math.max(6, 8 * zoom)}px`,
                              height: `${Math.max(20, 24 * zoom)}px`,
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'left', element)}
                          />
                          <div
                            data-resize-handle="right"
                            role="presentation"
                            className="absolute right-0 top-1/2 z-20 translate-x-1/2 -translate-y-1/2 bg-penta-blue border-2 border-white rounded shadow cursor-ew-resize hover:bg-penta-blue/90"
                            style={{
                              width: `${Math.max(6, 8 * zoom)}px`,
                              height: `${Math.max(20, 24 * zoom)}px`,
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'right', element)}
                          />
                        </>
                      )}
                    </div>
                  )
                })}

              {firstBackgroundUrl && config.logoArea && (
                <div
                  data-element-id="logo"
                  className={`absolute border-2 border-dashed cursor-move transition-all ${
                    isLogoSelected
                      ? 'border-penta-blue bg-penta-blue/20 shadow-lg'
                      : 'border-gray-400 bg-white/30 hover:border-penta-blue/50'
                  }`}
                  style={{
                    left: `${config.logoArea.x}%`,
                    top: `${config.logoArea.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${config.logoArea.width * zoom}px`,
                    height: `${config.logoArea.height * zoom}px`,
                    minWidth: `${60 * zoom}px`,
                    minHeight: `${30 * zoom}px`,
                  }}
                  onMouseDown={(e) => handleDragStart(e, 'logo')}
                  onClick={(e) => handleElementSelect('logo', e)}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600 font-medium">
                    <span className="px-2 text-center">{config.logoArea.placeholder || '로고 또는 서명'}</span>
                  </div>
                </div>
              )}

              {isMarqueeSelecting && (
                <div
                  className="absolute border-2 border-penta-blue bg-penta-blue/10 pointer-events-none"
                  style={{
                    left: Math.min(marqueeStart.x, marqueeEnd.x),
                    top: Math.min(marqueeStart.y, marqueeEnd.y),
                    width: Math.abs(marqueeEnd.x - marqueeStart.x),
                    height: Math.abs(marqueeEnd.y - marqueeStart.y),
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-80 flex-shrink-0 border-l flex flex-col h-full bg-card overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">요소 속성</h3>
              <Button variant="outline" size="sm" onClick={onAddTextElement}>
                텍스트 추가
              </Button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">요소 목록</Label>
              <div className="space-y-1 max-h-[180px] overflow-y-auto border rounded-md p-2">
                {config.textElements.map((element) => (
                  <div
                    key={element.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      selectedElementIds.includes(element.id) ? 'bg-penta-blue/10 text-penta-blue' : 'hover:bg-muted'
                    }`}
                    onClick={(e) => handleElementSelect(element.id, e)}
                  >
                    <Type className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{element.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveTextElement(element.id)
                        setSelectedElementIds((prev) => prev.filter((id) => id !== element.id))
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {config.logoArea && (
                  <div
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      isLogoSelected ? 'bg-penta-blue/10 text-penta-blue' : 'hover:bg-muted'
                    }`}
                    onClick={(e) => handleElementSelect('logo', e)}
                  >
                    <ImageIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate flex-1">로고 영역</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateLogoArea(null)
                        setSelectedElementIds((prev) => prev.filter((id) => id !== 'logo'))
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {!config.logoArea && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      onUpdateLogoArea({
                        x: 50,
                        y: 78,
                        width: 200,
                        height: 80,
                        placeholder: '로고 또는 서명',
                        align: 'center',
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    로고 영역 추가
                  </Button>
                )}
              </div>
            </div>

            {/* 단일 텍스트 요소 선택 */}
            {selectedTextElements.length === 1 && !isLogoSelected && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-medium">텍스트 속성</Label>
                <div className="space-y-1">
                  <Label className="text-xs">레이블</Label>
                  <Input
                    value={selectedTextElements[0].label}
                    onChange={(e) => onUpdateTextElement(selectedTextElements[0].id, { label: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="요소 이름"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">기본 텍스트</Label>
                  {selectedTextElements[0].multiline ? (
                    <Textarea
                      value={selectedTextElements[0].defaultValue}
                      onChange={(e) => onUpdateTextElement(selectedTextElements[0].id, { defaultValue: e.target.value })}
                      className="min-h-[80px] text-sm"
                    />
                  ) : (
                    <Input
                      value={selectedTextElements[0].defaultValue}
                      onChange={(e) => onUpdateTextElement(selectedTextElements[0].id, { defaultValue: e.target.value })}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">X: {selectedTextElements[0].x}%</Label>
                    <Slider
                      value={[selectedTextElements[0].x]}
                      onValueChange={([v]) => onUpdateTextElement(selectedTextElements[0].id, { x: v })}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y: {selectedTextElements[0].y}%</Label>
                    <Slider
                      value={[selectedTextElements[0].y]}
                      onValueChange={([v]) => onUpdateTextElement(selectedTextElements[0].id, { y: v })}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">폰트 크기: {selectedTextElements[0].fontSize}px</Label>
                  <Slider
                    value={[selectedTextElements[0].fontSize]}
                    onValueChange={([v]) => onUpdateTextElement(selectedTextElements[0].id, { fontSize: v })}
                    min={8}
                    max={200}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">폰트 두께</Label>
                  <Select
                    value={selectedTextElements[0].fontWeight}
                    onValueChange={(v) => onUpdateTextElement(selectedTextElements[0].id, { fontWeight: v as CardTextElement['fontWeight'] })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (400)</SelectItem>
                      <SelectItem value="medium">Medium (500)</SelectItem>
                      <SelectItem value="semibold">Semibold (600)</SelectItem>
                      <SelectItem value="bold">Bold (700)</SelectItem>
                      <SelectItem value="extrabold">ExtraBold (800)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">정렬</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={selectedTextElements[0].textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => onUpdateTextElement(selectedTextElements[0].id, { textAlign: 'left' })}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedTextElements[0].textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => onUpdateTextElement(selectedTextElements[0].id, { textAlign: 'center' })}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedTextElements[0].textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => onUpdateTextElement(selectedTextElements[0].id, { textAlign: 'right' })}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">색상</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedTextElements[0].color}
                      onChange={(e) => onUpdateTextElement(selectedTextElements[0].id, { color: e.target.value })}
                      className="h-8 w-12 p-0 border-0 cursor-pointer"
                    />
                    <Input
                      value={selectedTextElements[0].color}
                      onChange={(e) => {
                        const v = e.target.value
                        if (isValidHex(v) || v.length < 7) onUpdateTextElement(selectedTextElements[0].id, { color: v })
                      }}
                      className="h-8 text-sm flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={`editable-${selectedTextElements[0].id}`}
                    checked={selectedTextElements[0].editable ?? true}
                    onCheckedChange={(c) => onUpdateTextElement(selectedTextElements[0].id, { editable: c === true })}
                  />
                  <Label htmlFor={`editable-${selectedTextElements[0].id}`} className="text-xs font-normal cursor-pointer">
                    사용자 편집 가능
                  </Label>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onRemoveTextElement(selectedTextElements[0].id)
                    setSelectedElementIds([])
                  }}
                >
                  요소 삭제
                </Button>
              </div>
            )}

            {/* 다중 텍스트 선택 */}
            {selectedTextElements.length > 1 && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-medium">공통 속성 ({selectedTextElements.length}개 선택)</Label>
                <div className="space-y-1">
                  <Label className="text-xs">폰트 크기: {commonProperties?.fontSize != null ? `${commonProperties.fontSize}px` : '다양함'}</Label>
                  <Slider
                    value={[commonProperties?.fontSize ?? 24]}
                    onValueChange={([v]) => handleBatchUpdate({ fontSize: v })}
                    min={8}
                    max={200}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">폰트 두께</Label>
                  <Select
                    value={commonProperties?.fontWeight ?? ''}
                    onValueChange={(v) => handleBatchUpdate({ fontWeight: v as CardTextElement['fontWeight'] })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="다양함" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (400)</SelectItem>
                      <SelectItem value="medium">Medium (500)</SelectItem>
                      <SelectItem value="semibold">Semibold (600)</SelectItem>
                      <SelectItem value="bold">Bold (700)</SelectItem>
                      <SelectItem value="extrabold">ExtraBold (800)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">정렬</Label>
                  <div className="flex gap-1">
                    <Button variant={commonProperties?.textAlign === 'left' ? 'default' : 'outline'} size="sm" className="flex-1 h-8" onClick={() => handleBatchUpdate({ textAlign: 'left' })}>
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button variant={commonProperties?.textAlign === 'center' ? 'default' : 'outline'} size="sm" className="flex-1 h-8" onClick={() => handleBatchUpdate({ textAlign: 'center' })}>
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button variant={commonProperties?.textAlign === 'right' ? 'default' : 'outline'} size="sm" className="flex-1 h-8" onClick={() => handleBatchUpdate({ textAlign: 'right' })}>
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">색상</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={commonProperties?.color ?? '#000000'}
                      onChange={(e) => handleBatchUpdate({ color: e.target.value })}
                      className="h-8 w-12 p-0 border-0 cursor-pointer"
                    />
                    <Input
                      value={commonProperties?.color ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (isValidHex(v) || v.length < 7) handleBatchUpdate({ color: v })
                      }}
                      className="h-8 text-sm flex-1"
                      placeholder="다양함"
                    />
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteSelected}>
                  선택된 요소 삭제
                </Button>
              </div>
            )}

            {/* 로고 영역만 선택 (웰컴보드처럼 플레이스홀더 텍스트만) */}
            {isLogoSelected && selectedTextElements.length === 0 && config.logoArea && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-medium">로고 영역 속성</Label>

                <div className="space-y-1">
                  <Label className="text-xs">플레이스홀더 텍스트</Label>
                  <Input
                    value={config.logoArea.placeholder}
                    onChange={(e) => onUpdateLogoArea({ placeholder: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="예: 로고 또는 서명"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">X: {config.logoArea.x}%</Label>
                    <Slider value={[config.logoArea.x]} onValueChange={([v]) => onUpdateLogoArea({ x: v })} min={0} max={100} step={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y: {config.logoArea.y}%</Label>
                    <Slider value={[config.logoArea.y]} onValueChange={([v]) => onUpdateLogoArea({ y: v })} min={0} max={100} step={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">너비 (px)</Label>
                    <Input type="number" value={config.logoArea.width} onChange={(e) => onUpdateLogoArea({ width: Number(e.target.value) })} className="h-8 text-sm" min={50} max={500} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">높이 (px)</Label>
                    <Input type="number" value={config.logoArea.height} onChange={(e) => onUpdateLogoArea({ height: Number(e.target.value) })} className="h-8 text-sm" min={50} max={500} />
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onUpdateLogoArea(null)
                    setSelectedElementIds([])
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  로고 영역 삭제
                </Button>
              </div>
            )}

            {/* 혼합 선택 */}
            {isLogoSelected && selectedTextElements.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-medium">혼합 선택 ({selectedElementIds.length}개)</Label>
                <p className="text-xs text-muted-foreground">위치 정렬은 상단 툴바를 사용하세요.</p>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteSelected}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  선택된 요소 삭제
                </Button>
              </div>
            )}

            {selectedElementIds.length === 0 && (
              <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                <p>미리보기 영역에서 요소를 클릭하여 선택하세요.</p>
                <p className="mt-2 text-xs">
                  <strong>Shift+클릭</strong>: 다중 선택<br />
                  <strong>드래그</strong>: 영역 선택
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
