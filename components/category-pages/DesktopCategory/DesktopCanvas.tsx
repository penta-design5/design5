'use client'

import { forwardRef, useCallback, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type {
  DesktopEditorData,
  DesktopElement,
  SelectedBackground,
  CalendarThemeKey,
} from '@/lib/desktop-schemas'
import { getCalendarNaturalSize, toCalendarRgba } from '@/lib/desktop-schemas'
import type { DesktopWallpaperPost } from '@/lib/desktop-schemas'
import { DesktopCalendar } from '@/components/category-pages/DesktopCategory/DesktopCalendar'

const getImageSrc = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http') && url.includes('backblazeb2.com')) {
    return `/api/posts/images?url=${encodeURIComponent(url)}`
  }
  return url
}

interface DesktopCanvasProps {
  wallpaper: DesktopWallpaperPost
  editorData: DesktopEditorData
  scale?: number
  activeElementId?: string | null
  selectedIds?: string[]
  onElementClick?: (id: string, addToSelection?: boolean) => void
  onElementDrag?: (id: string, x: number, y: number) => void
  onElementUpdate?: (id: string, updates: Partial<DesktopElement>) => void
  onCanvasClick?: () => void
}

export const DesktopCanvas = forwardRef<HTMLDivElement, DesktopCanvasProps>(
  function DesktopCanvas(
    {
      wallpaper,
      editorData,
      scale = 1,
      activeElementId,
      selectedIds = [],
      onElementClick,
      onElementDrag,
      onElementUpdate,
      onCanvasClick,
    },
    ref
  ) {
    const bg: SelectedBackground = editorData.selectedBackground
    const bgUrl =
      bg === 'windows'
        ? wallpaper.backgroundUrlWindows || wallpaper.backgroundUrlMac
        : wallpaper.backgroundUrlMac || wallpaper.backgroundUrlWindows
    const width = bg === 'windows' ? wallpaper.widthWindows : wallpaper.widthMac
    const height = bg === 'windows' ? wallpaper.heightWindows : wallpaper.heightMac

    const [draggingId, setDraggingId] = useState<string | null>(null)
    const dragStartRef = useRef<{ x: number; y: number; elX: number; elY: number } | null>(null)
    const [resizingId, setResizingId] = useState<string | null>(null)
    const resizeStartRef = useRef<
      | { type: 'text'; side: 'left' | 'right'; startX: number; elX: number; elWidth: number }
      | {
          type: 'calendar'
          elX: number
          elY: number
          elWidth: number
          elHeight: number
          elFontSize: number
        }
      | null
    >(null)

    const handlePointerDown = useCallback(
      (e: React.PointerEvent, id: string) => {
        e.stopPropagation()
        if (!onElementDrag) return
        const el = editorData.elements.find((x) => x.id === id)
        if (!el) return
        setDraggingId(id)
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          elX: el.x,
          elY: el.y,
        }
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      },
      [editorData.elements, onElementDrag]
    )

    const handlePointerMove = useCallback(
      (e: React.PointerEvent, id: string) => {
        if (draggingId !== id || !dragStartRef.current || !onElementDrag) return
        const dx = (e.clientX - dragStartRef.current.x) / scale
        const dy = (e.clientY - dragStartRef.current.y) / scale
        onElementDrag(id, dragStartRef.current.elX + dx, dragStartRef.current.elY + dy)
      },
      [draggingId, scale, onElementDrag]
    )

    const handlePointerUp = useCallback(
      (e: React.PointerEvent, id: string) => {
        if (draggingId === id) {
          setDraggingId(null)
          dragStartRef.current = null
          ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
        }
      },
      [draggingId]
    )

    const handleElementClick = useCallback(
      (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        onElementClick?.(id, e.shiftKey)
      },
      [onElementClick]
    )

    const handleResizeStart = useCallback(
      (e: React.PointerEvent, id: string, side: 'left' | 'right') => {
        e.stopPropagation()
        const el = editorData.elements.find((x) => x.id === id)
        if (!el || !onElementUpdate || (el.type !== 'title' && el.type !== 'description')) return
        const w = el.width ?? 400
        setResizingId(id)
        resizeStartRef.current = { type: 'text', side, startX: e.clientX, elX: el.x, elWidth: w }
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      },
      [editorData.elements, onElementUpdate]
    )

    const handleCalendarResizeStart = useCallback(
      (e: React.PointerEvent, id: string) => {
        e.stopPropagation()
        const el = editorData.elements.find((x) => x.id === id)
        if (!el || !onElementUpdate || el.type !== 'calendar') return
        const w = el.width ?? 220
        const h = el.height ?? 200
        const cs = el.calendarStyle as { fontSize?: number } | undefined
        const fs = cs?.fontSize ?? 14
        setResizingId(id)
        resizeStartRef.current = {
          type: 'calendar',
          elX: el.x,
          elY: el.y,
          elWidth: w,
          elHeight: h,
          elFontSize: fs,
        }
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      },
      [editorData.elements, onElementUpdate]
    )

    const handleResizeMove = useCallback(
      (e: React.PointerEvent, id: string) => {
        if (resizingId !== id || !resizeStartRef.current || !onElementUpdate) return
        const canvasEl = ref && typeof ref !== 'function' ? ref.current : null
        if (!canvasEl) return
        const rect = canvasEl.getBoundingClientRect()
        const logicalX = (e.clientX - rect.left) / scale
        const logicalY = (e.clientY - rect.top) / scale
        const data = resizeStartRef.current

        if (data.type === 'text') {
          const { side, elX, elWidth } = data
          const rightEdge = elX + elWidth
          const minW = 60
          if (side === 'right') {
            const newWidth = Math.max(minW, logicalX - elX)
            onElementUpdate(id, { width: newWidth })
          } else {
            const newLeft = Math.max(0, Math.min(logicalX, rightEdge - minW))
            const newWidth = rightEdge - newLeft
            onElementUpdate(id, { x: newLeft, width: newWidth })
          }
        } else if (data.type === 'calendar') {
          const { elX, elY, elWidth, elHeight, elFontSize } = data
          const minSize = 80
          const aspectRatio = elWidth / elHeight
          const rawW = logicalX - elX
          const rawH = logicalY - elY
          let newWidth: number
          let newHeight: number
          if (rawW <= 0 && rawH <= 0) {
            newWidth = elWidth
            newHeight = elHeight
          } else if (rawW <= 0) {
            newHeight = Math.max(minSize, rawH)
            newWidth = newHeight * aspectRatio
          } else if (rawH <= 0) {
            newWidth = Math.max(minSize, rawW)
            newHeight = newWidth / aspectRatio
          } else if (rawW / rawH > aspectRatio) {
            newWidth = Math.max(minSize, rawW)
            newHeight = newWidth / aspectRatio
          } else {
            newHeight = Math.max(minSize, rawH)
            newWidth = newHeight * aspectRatio
          }
          if (newWidth < minSize) {
            newWidth = minSize
            newHeight = minSize / aspectRatio
          }
          if (newHeight < minSize) {
            newHeight = minSize
            newWidth = minSize * aspectRatio
          }
          const scaleFactor = Math.min(newWidth / elWidth, newHeight / elHeight)
          const newFontSize = Math.round(
            Math.max(8, Math.min(48, elFontSize * scaleFactor))
          )
          const el = editorData.elements.find((x) => x.id === id)
          const cs =
            (el?.type === 'calendar' ? el.calendarStyle : undefined) as
              | { year?: number; month?: number; color?: string; backgroundColor?: string; backgroundOpacity?: number; theme?: string; sundayColor?: string; holidayColor?: string; saturdayColor?: string; todayCircleColor?: string }
              | undefined
          onElementUpdate(id, {
            width: newWidth,
            height: newHeight,
            calendarStyle: {
              year: cs?.year ?? new Date().getFullYear(),
              month: cs?.month ?? new Date().getMonth() + 1,
              fontSize: newFontSize,
              color: cs?.color ?? '#333',
              backgroundColor: cs?.backgroundColor ?? '#ffffff',
              backgroundOpacity: cs?.backgroundOpacity ?? 0.9,
              theme: (cs?.theme as CalendarThemeKey) ?? 'classic',
              sundayColor: cs?.sundayColor ?? '#ec5851',
              holidayColor: cs?.holidayColor ?? '#ec5851',
              saturdayColor: cs?.saturdayColor ?? '#8196f7',
              todayCircleColor: cs?.todayCircleColor ?? '#8196f7',
            },
          })
        }
      },
      [resizingId, scale, onElementUpdate, ref, editorData.elements]
    )

    const handleResizeEnd = useCallback(
      (e: React.PointerEvent, id: string) => {
        if (resizingId === id) {
          setResizingId(null)
          resizeStartRef.current = null
          ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
        }
      },
      [resizingId]
    )

    if (!bgUrl) {
      return (
        <div
          ref={ref}
          className="flex items-center justify-center bg-muted rounded-lg"
          style={{ width: width * scale, height: height * scale }}
        >
          <span className="text-muted-foreground">배경 이미지를 선택해주세요</span>
        </div>
      )
    }

    return (
      <div
        className="rounded-lg overflow-hidden"
        style={{ width: width * scale, height: height * scale }}
      >
        <div
          ref={ref}
          id="desktop-canvas"
          className="relative overflow-hidden origin-top-left"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
          }}
          onClick={onCanvasClick}
        >
        <div className="absolute inset-0 z-0">
          <Image
            src={getImageSrc(bgUrl)}
            alt="배경"
            fill
            sizes={`${width}px`}
            className="object-cover"
            priority
            crossOrigin="anonymous"
            unoptimized
          />
        </div>

        {editorData.elements.map((el) => {
          const isActive = activeElementId === el.id || selectedIds.includes(el.id)
          const isTextElement = el.type === 'title' || el.type === 'description'
          const isCalendarElement = el.type === 'calendar'
          const textWidth = isTextElement ? (el.width ?? 400) : undefined
          const calendarSize =
            isCalendarElement
              ? { width: el.width ?? 220, height: el.height ?? 200 }
              : undefined
          return (
            <div
              key={el.id}
              className={cn(
                'absolute z-10 select-none',
                onElementDrag && !resizingId && 'cursor-move',
                isActive && 'ring-2 ring-penta-blue'
              )}
              style={{
                left: el.x,
                top: el.y,
                width: textWidth ?? calendarSize?.width,
                height: calendarSize?.height,
              }}
              onClick={(e) => handleElementClick(e, el.id)}
              onPointerDown={(e) => onElementDrag && !resizingId && handlePointerDown(e, el.id)}
              onPointerMove={(e) => {
                handlePointerMove(e, el.id)
                if (resizingId === el.id) handleResizeMove(e, el.id)
              }}
              onPointerUp={(e) => {
                handlePointerUp(e, el.id)
                handleResizeEnd(e, el.id)
              }}
              onPointerLeave={(e) => {
                handlePointerUp(e, el.id)
                handleResizeEnd(e, el.id)
              }}
            >
              {isTextElement && isActive && onElementUpdate && (
                <>
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-penta-blue/30 z-20"
                    onPointerDown={(e) => handleResizeStart(e, el.id, 'left')}
                    onPointerMove={(e) => resizingId === el.id && handleResizeMove(e, el.id)}
                    onPointerUp={(e) => handleResizeEnd(e, el.id)}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-penta-blue/30 z-20"
                    onPointerDown={(e) => handleResizeStart(e, el.id, 'right')}
                    onPointerMove={(e) => resizingId === el.id && handleResizeMove(e, el.id)}
                    onPointerUp={(e) => handleResizeEnd(e, el.id)}
                  />
                </>
              )}
              {isCalendarElement && isActive && onElementUpdate && (
                <div
                  className="absolute right-0 bottom-0 w-5 h-5 cursor-nwse-resize hover:bg-penta-blue/40 z-20 rounded-tl border-l-2 border-t-2 border-penta-blue/60"
                  style={{ margin: -3 }}
                  onPointerDown={(e) => handleCalendarResizeStart(e, el.id)}
                  onPointerMove={(e) => resizingId === el.id && handleResizeMove(e, el.id)}
                  onPointerUp={(e) => handleResizeEnd(e, el.id)}
                />
              )}
              <DesktopElementRender element={el} />
            </div>
          )
        })}
        </div>
      </div>
    )
  }
)

function DesktopElementRender({ element }: { element: DesktopElement }) {
  if (element.type === 'title' || element.type === 'description') {
    const style = (element.textStyle || {}) as { fontFamily?: string; fontSize?: number; color?: string; fontWeight?: string }
    const w = element.width ?? 400
    return (
      <div
        className="min-w-0 overflow-hidden"
        style={{
          fontFamily: style.fontFamily || 'Pretendard, sans-serif',
          fontSize: style.fontSize || 24,
          color: style.color || '#333',
          fontWeight: style.fontWeight || 'normal',
          whiteSpace: element.type === 'description' ? 'pre-wrap' : 'nowrap',
          width: w,
        }}
      >
        {element.value || (element.type === 'title' ? '제목' : '설명')}
      </div>
    )
  }
  if (element.type === 'calendar') {
    const style = (element.calendarStyle || {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      fontSize: 14,
      color: '#333',
      backgroundColor: '#ffffff',
      backgroundOpacity: 0.9,
      theme: 'classic' as CalendarThemeKey,
      sundayColor: '#ec5851',
      holidayColor: '#ec5851',
      saturdayColor: '#8196f7',
      todayCircleColor: '#8196f7',
    }) as { year: number; month: number; fontSize: number; color: string; backgroundColor: string; backgroundOpacity?: number; theme: CalendarThemeKey; sundayColor?: string; holidayColor?: string; saturdayColor?: string; todayCircleColor?: string }
    const w = element.width ?? 220
    const h = element.height ?? 200
    const fs = style.fontSize ?? 14
    const { width: naturalW, height: naturalH } = getCalendarNaturalSize(style.year, style.month, fs)
    const fitScale = Math.min(w / naturalW, h / naturalH)

    return (
      <div className="w-full h-full overflow-hidden flex items-start">
        <div
          style={{
            transform: `scale(${fitScale})`,
            transformOrigin: 'top left',
            width: naturalW,
            height: naturalH,
          }}
        >
          <DesktopCalendar
            year={style.year}
            month={style.month}
            fontSize={fs}
            color={style.color}
            backgroundColor={toCalendarRgba(style.backgroundColor, style.backgroundOpacity)}
            theme={style.theme}
            scale={1}
            sundayColor={style.sundayColor}
            holidayColor={style.holidayColor}
            saturdayColor={style.saturdayColor}
            todayCircleColor={style.todayCircleColor}
          />
        </div>
      </div>
    )
  }
  return null
}
