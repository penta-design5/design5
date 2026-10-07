'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Image as KonvaImage, Rect, Ellipse, Shape as KonvaShape } from 'react-konva'
import type Konva from 'konva'
import { ZOOM_STEP } from '@/lib/toolbox/common/constants'
import { createCheckerPattern } from '@/lib/toolbox/common/canvas'
import { ChevronsLeftRight } from 'lucide-react'
import { centerPosition, clampZoom, fitZoom, zoomAroundPoint } from '@/lib/toolbox/common/view'
import {
  HANDLES,
  handlePoint,
  isUsableRect,
  moveRect,
  rectFromDrag,
  resizeRect,
  squareFromDrag,
  type Handle,
  type Point,
} from '@/lib/toolbox/mosaic/regions'
import type { Rect as RegionRect, Region, Shape } from '@/lib/toolbox/mosaic/types'
import type { WatermarkLogo, WatermarkSettings } from '@/lib/toolbox/common/watermark'
import { drawWatermark } from '@/lib/toolbox/common/watermark-render'
import { ZoomControls } from '@/components/toolbox/common/ZoomControls'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import type { MosaicViewMode } from './MosaicToolbar'

interface MosaicCanvasProps {
  /** 불러온 원본(원본·비교 보기용) */
  original: HTMLCanvasElement
  /** 모자이크가 적용된 결과 캔버스(원본 크기, 재사용 — 내용이 바뀌면 resultStamp가 바뀐다) */
  result: HTMLCanvasElement
  resultStamp: unknown
  width: number
  height: number
  /** 이 값이 바뀌면(새 이미지) 화면 맞춤 */
  fitKey: unknown
  regions: readonly Region[]
  selectedId: string | null
  /** 「이미지 전체」 모드 — 영역 윤곽·편집·그리기 없이 화면 이동만 한다 */
  whole: boolean
  /** 보기 방식 — 영역 윤곽·편집은 「결과」 보기에서만 쓴다(원본·비교에서는 화면 이동만) */
  mode: MosaicViewMode
  /** 영역 윤곽·핸들 표시(저장에는 영향 없음). 끄면 편집도 막는다 */
  showOutlines: boolean
  /** 화면 이동 모드(터치) — 켜면 한 손가락 끌기가 화면 이동이다(Space와 같음) */
  panMode?: boolean
  /** 새 영역 그리기 미리보기의 모양 */
  drawShape: Shape
  /** 켜진 워터마크 — 결과(「결과」·「비교」의 오른쪽)에만 겹쳐 그린다. 저장과 같은 `drawWatermark`를 쓴다 */
  watermark?: { settings: WatermarkSettings; logo: WatermarkLogo | null }
  onSelect: (id: string | null) => void
  /** 이동·크기 조절 중 실시간 변경(프레임당 한 번) */
  onRegionChange: (id: string, rect: RegionRect) => void
  /** 이동·크기 조절 끝(되돌리기 1단계로 묶는 기준) */
  onChangeEnd: () => void
  /** 새 영역 그리기 완료(최소 크기 이상일 때만) */
  onCreate: (rect: RegionRect) => void
}

interface View extends Point {
  zoom: number
}

/** 누르고 있는 동안의 조작. grab/offset = 잡은 지점과 기준점의 거리(이미지 좌표) — 잡은 순간 튀지 않게 유지 */
type Gesture =
  | { kind: 'pan'; start: Point; origin: Point }
  | { kind: 'move'; id: string; grab: Point; origin: RegionRect }
  | { kind: 'resize'; id: string; handle: Handle; offset: Point; origin: RegionRect }
  | { kind: 'draw'; anchor: Point; current: Point; square: boolean }
  | { kind: 'compare' }

interface PinchState {
  distance: number
  imagePoint: Point
  zoom: number
}

const INDIGO = '#4f46e5'
const HANDLE_SIZE = 9
/** 핸들을 잡을 수 있는 폭(화면 px) — 터치 기기는 손가락에 맞게 넓힌다 */
const HANDLE_HIT = 16
const HANDLE_HIT_COARSE = 28
const HANDLE_CURSOR: Record<Handle, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
}

/**
 * 모자이크 미리보기 — 결과 이미지 위에 영역 윤곽·크기 조절 핸들을 겹쳐 표시한다(윤곽은 저장되지 않음).
 * - 영역 편집·이동: 영역 클릭 = 선택, 끌기 = 이동, 핸들 = 크기 조절, 빈 곳 클릭 = 선택 해제, 빈 곳 끌기 = 화면 이동
 * - 새 영역 그리기: 끌어서 영역 생성(놓으면 편집·이동으로 돌아간다 — 페이지에서 처리)
 * - 휠 = 포인터 기준 확대/축소, 두 손가락 = 핀치 줌, 오른쪽 아래 줌 컨트롤(이미지 분할과 동일)
 * 누른 뒤에는 window 포인터 이벤트로 따라가 캔버스 밖으로 나가도 끊기지 않고, 갱신은 프레임당 한 번이다.
 */
export function MosaicCanvas({
  original,
  result,
  resultStamp,
  width,
  height,
  fitKey,
  regions,
  selectedId,
  whole,
  mode,
  showOutlines,
  panMode = false,
  drawShape,
  watermark,
  onSelect,
  onRegionChange,
  onChangeEnd,
  onCreate,
}: MosaicCanvasProps) {
  const coarse = useMediaQuery('(pointer: coarse)')
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<Konva.Image>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 })
  const [checker] = useState(createCheckerPattern)
  const [hoverCursor, setHoverCursor] = useState<string | null>(null)
  const [gesture, setGesture] = useState<Gesture | null>(null)
  /** 비교 경계선 위치(이미지 너비 기준 0~1) */
  const [split, setSplit] = useState(0.5)
  /** Space를 누르고 있는 동안 화면 이동(어느 위치에서 눌러도 이동) */
  const [spaceDown, setSpaceDown] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      setSize({ width: Math.floor(w), height: Math.floor(h) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fit = useCallback(() => {
    if (!size.width || !size.height) return
    const zoom = fitZoom(width, height, size.width, size.height)
    setView({ zoom, ...centerPosition(width, height, size.width, size.height, zoom) })
  }, [width, height, size.width, size.height])

  const zoomTo = useCallback(
    (nextZoomRaw: number, anchor?: Point) => {
      setView((prev) => {
        const zoom = clampZoom(nextZoomRaw)
        const point = anchor ?? { x: size.width / 2, y: size.height / 2 }
        return { zoom, ...zoomAroundPoint(prev, prev.zoom, zoom, point) }
      })
    },
    [size.width, size.height]
  )

  // 새 이미지·작업 영역 크기 변경 → 화면 맞춤
  useLayoutEffect(() => {
    fit()
  }, [fitKey, fit])
  useEffect(() => {
    setSplit(0.5)
  }, [fitKey])

  // 결과 캔버스는 같은 객체를 재사용하므로 내용이 바뀌면 직접 다시 그린다
  useEffect(() => {
    imageRef.current?.getLayer()?.batchDraw()
  }, [resultStamp])

  const { zoom } = view
  const sx = (x: number) => view.x + x * zoom
  const sy = (y: number) => view.y + y * zoom

  // 제스처 중 최신 값을 이벤트 핸들러에서 쓰기 위한 ref
  const latest = useRef({ view, width, height, onRegionChange, onCreate, onChangeEnd, onSelect })
  latest.current = { view, width, height, onRegionChange, onCreate, onChangeEnd, onSelect }

  useEffect(() => {
    if (!gesture) return
    let pending: { x: number; y: number; shift: boolean } | null = null
    let raf = 0

    const toImage = (clientX: number, clientY: number) => {
      const el = containerRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top
      const { view: v } = latest.current
      return { px, py, image: { x: (px - v.x) / v.zoom, y: (py - v.y) / v.zoom } }
    }

    const apply = (clientX: number, clientY: number, shift: boolean) => {
      const p = toImage(clientX, clientY)
      if (!p) return
      const { width: w, height: h, onRegionChange: change } = latest.current
      const imgSize = { width: w, height: h }
      switch (gesture.kind) {
        case 'pan':
          setView((prev) => ({ ...prev, x: gesture.origin.x + p.px - gesture.start.x, y: gesture.origin.y + p.py - gesture.start.y }))
          break
        case 'move':
          change(gesture.id, moveRect(gesture.origin, { x: p.image.x - gesture.grab.x, y: p.image.y - gesture.grab.y }, imgSize))
          break
        case 'resize':
          change(
            gesture.id,
            resizeRect(gesture.origin, gesture.handle, { x: p.image.x - gesture.offset.x, y: p.image.y - gesture.offset.y }, imgSize)
          )
          break
        case 'draw':
          setGesture((g) => (g && g.kind === 'draw' ? { ...g, current: p.image, square: shift } : g))
          break
        case 'compare':
          setSplit(Math.min(1, Math.max(0, p.image.x / w)))
          break
      }
    }

    const flush = () => {
      raf = 0
      if (pending) {
        const { x, y, shift } = pending
        pending = null
        apply(x, y, shift)
      }
    }
    const handleMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY, shift: e.shiftKey }
      if (!raf) raf = requestAnimationFrame(flush)
    }
    const end = (e: PointerEvent) => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      if (e.type === 'pointerup') {
        // 마지막 위치까지 반영하고 끝낸다
        if (gesture.kind === 'draw') {
          const p = toImage(e.clientX, e.clientY)
          const { width: w, height: h, onCreate: create } = latest.current
          if (p) {
            const imgSize = { width: w, height: h }
            const rect = e.shiftKey ? squareFromDrag(gesture.anchor, p.image, imgSize) : rectFromDrag(gesture.anchor, p.image, imgSize)
            if (isUsableRect(rect, imgSize)) create(rect)
            else latest.current.onSelect(null) // 클릭(또는 너무 작은 끌기)은 선택 해제 — 손가락 두 개로 확대/축소를 시작할 때는 선택을 풀지 않는다
          }
        } else {
          apply(e.clientX, e.clientY, e.shiftKey)
        }
      }
      // 이동·크기 조절이 끝났음을 알려 되돌리기 1단계로 묶는다(취소돼도 그때까지의 변경을 확정)
      if (gesture.kind === 'move' || gesture.kind === 'resize') latest.current.onChangeEnd()
      pending = null
      setGesture(null)
    }

    const prevCursor = document.body.style.cursor
    document.body.style.cursor =
      gesture.kind === 'pan'
        ? 'grabbing'
        : gesture.kind === 'move'
          ? 'move'
          : gesture.kind === 'resize'
            ? HANDLE_CURSOR[gesture.handle]
            : gesture.kind === 'compare'
              ? 'col-resize'
              : 'crosshair'
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      document.body.style.cursor = prevCursor
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
    // gesture의 종류·대상이 바뀔 때만 리스너를 다시 단다(그리는 중 current 갱신으로는 다시 달지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesture?.kind, gesture && 'id' in gesture ? gesture.id : null])

  // Space를 누르고 있는 동안 화면 이동 (입력창·버튼·슬라이더 등에 포커스가 있으면 그 컨트롤의 Space 조작을 그대로 둔다)
  useEffect(() => {
    const usesSpace = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        !!target.closest('button, [role=slider], [role=radio], [role=checkbox], [role=combobox], a, [role=dialog], [role=listbox]'))
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || usesSpace(e.target)) return
      e.preventDefault() // 페이지 스크롤 방지
      setSpaceDown(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    const blur = () => setSpaceDown(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  // ---------- 터치: 두 손가락 핀치 줌·이동 (이미지 분할 SplitCanvas와 같은 방식) ----------
  // 한 손가락으로 시작한 조작은 두 번째 손가락이 닿는 순간 취소하고 핀치로 전환한다.
  const pinchRef = useRef<PinchState | null>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = (touches: TouchList) => {
      const rect = el.getBoundingClientRect()
      const [a, b] = [touches[0], touches[1]]
      return {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        center: { x: (a.clientX + b.clientX) / 2 - rect.left, y: (a.clientY + b.clientY) / 2 - rect.top },
      }
    }
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      if (e.cancelable) e.preventDefault()
      setGesture(null)
      const { distance, center } = measure(e.touches)
      const v = latest.current.view
      pinchRef.current = {
        distance: Math.max(1, distance),
        imagePoint: { x: (center.x - v.x) / v.zoom, y: (center.y - v.y) / v.zoom },
        zoom: v.zoom,
      }
    }
    const handleTouchMove = (e: TouchEvent) => {
      const pinch = pinchRef.current
      if (!pinch || e.touches.length !== 2) return
      if (e.cancelable) e.preventDefault()
      const { distance, center } = measure(e.touches)
      const z = clampZoom(pinch.zoom * (distance / pinch.distance))
      setView({ zoom: z, x: center.x - pinch.imagePoint.x * z, y: center.y - pinch.imagePoint.y * z })
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null
    }
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('touchcancel', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [])

  /** Konva는 마우스·터치 이벤트를 pointer 이벤트로 넘겨준다 — 마우스는 왼쪽 버튼만, 핀치 중에는 무시 */
  const acceptPointer = (e: Konva.KonvaEventObject<PointerEvent>) => {
    const evt = e.evt as MouseEvent | TouchEvent
    if ('button' in evt && evt.button !== 0) return false
    if ('touches' in evt && evt.touches.length > 1) return false
    if (pinchRef.current) return false
    evt.preventDefault()
    // preventDefault가 포커스 이동을 막으므로, 패널 컨트롤(셀렉트·슬라이더 등)에 남은 포커스를 직접 풀어 단축키가 계속 동작하게 한다
    const active = document.activeElement
    if (active instanceof HTMLElement && active !== document.body) active.blur()
    return true
  }

  const pointerToImage = (pointer: Point): Point => ({ x: (pointer.x - view.x) / zoom, y: (pointer.y - view.y) / zoom })

  // 영역 윤곽·편집·그리기는 「영역 지정」 모드의 「결과」 보기에서 윤곽을 표시할 때만. 그 밖은 끌어서 화면 이동만 한다
  const editable = !whole && mode === 'result' && showOutlines
  const showRegions = editable

  const panning = spaceDown || panMode
  const startPan = (pointer: Point) => setGesture({ kind: 'pan', start: pointer, origin: { x: view.x, y: view.y } })

  // 빈 곳을 누르면 영역 그리기 시작(Space를 누르고 있으면 화면 이동). 클릭만 하고 떼면 선택 해제(떼는 시점에 처리)
  const handleStagePointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!acceptPointer(e)) return
    const pointer = e.target.getStage()?.getPointerPosition()
    if (!pointer) return
    if (!editable || panning) {
      startPan(pointer)
      return
    }
    const p = pointerToImage(pointer)
    setGesture({ kind: 'draw', anchor: p, current: p, square: Boolean((e.evt as MouseEvent).shiftKey) })
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const pointer = e.target.getStage()?.getPointerPosition()
    // 트랙패드(작은 delta)와 마우스 휠(큰 delta) 모두 자연스럽게 — 지수 배율
    zoomTo(zoom * Math.exp(-e.evt.deltaY * 0.0015), pointer ?? undefined)
  }

  const startMove = (region: Region, e: Konva.KonvaEventObject<PointerEvent>) => {
    e.cancelBubble = true
    if (!acceptPointer(e)) return
    const pointer = e.target.getStage()?.getPointerPosition()
    if (!pointer) return
    if (panning) {
      startPan(pointer)
      return
    }
    const p = pointerToImage(pointer)
    onSelect(region.id)
    setGesture({ kind: 'move', id: region.id, grab: { x: p.x - region.x, y: p.y - region.y }, origin: region })
  }

  const startResize = (region: Region, handle: Handle, e: Konva.KonvaEventObject<PointerEvent>) => {
    e.cancelBubble = true
    if (!acceptPointer(e)) return
    const pointer = e.target.getStage()?.getPointerPosition()
    if (!pointer) return
    if (panning) {
      startPan(pointer)
      return
    }
    const p = pointerToImage(pointer)
    const at = handlePoint(region, handle)
    setGesture({ kind: 'resize', id: region.id, handle, offset: { x: p.x - at.x, y: p.y - at.y }, origin: region })
  }

  const cursor = gesture
    ? gesture.kind === 'pan'
      ? 'grabbing'
      : gesture.kind === 'move'
        ? 'move'
        : gesture.kind === 'resize'
          ? HANDLE_CURSOR[gesture.handle]
          : gesture.kind === 'compare'
            ? 'col-resize'
            : 'crosshair'
    : panning
      ? 'grab'
      : (hoverCursor ?? (editable ? 'crosshair' : 'grab'))

  const hover = (value: string) => ({
    onMouseEnter: () => setHoverCursor(value),
    onMouseLeave: () => setHoverCursor(null),
  })

  const selected = regions.find((r) => r.id === selectedId) ?? null
  const drawRect =
    gesture?.kind === 'draw'
      ? (gesture.square ? squareFromDrag : rectFromDrag)(gesture.anchor, gesture.current, { width, height })
      : null
  const handleHit = coarse ? HANDLE_HIT_COARSE : HANDLE_HIT

  // 영역 모양에 맞는 도형 — 타원은 외접 사각형에 꽉 차는 타원
  const shapeNode = (shape: Shape, r: RegionRect, props: Record<string, unknown>) =>
    shape === 'ellipse' ? (
      <Ellipse x={sx(r.x + r.width / 2)} y={sy(r.y + r.height / 2)} radiusX={(r.width / 2) * zoom} radiusY={(r.height / 2) * zoom} {...props} />
    ) : (
      <Rect x={sx(r.x)} y={sy(r.y)} width={r.width * zoom} height={r.height * zoom} {...props} />
    )

  // 윤곽을 숨기거나 보기 방식이 바뀌면 사라진 도형의 mouseleave가 오지 않으므로 커서를 되돌린다
  useEffect(() => {
    setHoverCursor(null)
  }, [mode, showOutlines, whole])

  const renderOutline = (region: Region) => {
    const isSelected = region.id === selectedId
    return (
      <Group key={region.id}>
        {shapeNode(region.shape, region, { stroke: 'rgba(255,255,255,0.9)', strokeWidth: isSelected ? 4 : 3, listening: false })}
        {shapeNode(region.shape, region, { stroke: INDIGO, strokeWidth: isSelected ? 2 : 1, opacity: isSelected ? 1 : 0.7, listening: false })}
        {/* 타원은 핸들이 놓이는 외접 사각형을 점선으로 보여 준다 */}
        {isSelected && editable && region.shape === 'ellipse' && (
          <Rect
            x={sx(region.x)}
            y={sy(region.y)}
            width={region.width * zoom}
            height={region.height * zoom}
            stroke={INDIGO}
            strokeWidth={1}
            dash={[4, 4]}
            opacity={0.6}
            listening={false}
          />
        )}
        {/* 영역 안을 누르면 선택·이동. 새 영역 그리기 중에는 받지 않는다(기존 영역 위에서도 그릴 수 있게) */}
        {shapeNode(region.shape, region, {
          fill: 'rgba(0,0,0,0.001)',
          name: `region-${region.id}`,
          listening: editable,
          onPointerDown: (e: Konva.KonvaEventObject<PointerEvent>) => startMove(region, e),
          ...hover('move'),
        })}
      </Group>
    )
  }

  // ---------- 비교 경계선(DOM 오버레이 — 키보드로도 조작할 수 있게) ----------
  const dividerX = sx(split * width)
  const visibleTop = Math.max(0, sy(0))
  const visibleBottom = Math.min(size.height, sy(height))
  const showDivider = mode === 'compare' && visibleBottom > visibleTop && dividerX >= 0 && dividerX <= size.width
  const handleY = (visibleTop + visibleBottom) / 2 - visibleTop

  const startDivider = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    setGesture({ kind: 'compare' })
  }

  const onDividerKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.01
    let next: number | null = null
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = split - step
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = split + step
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = 1
    if (next === null) return
    e.preventDefault()
    setSplit(Math.min(1, Math.max(0, next)))
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      style={{ cursor }}
      // 마우스가 캔버스 위로 오면 줌 버튼 등에 남은 포커스를 풀어, 이어서 누르는 Space가 그 버튼을 누르지 않고 화면 이동으로 쓰이게 한다
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const active = document.activeElement
        if (active instanceof HTMLButtonElement && !(e.target as HTMLElement).closest('button')) active.blur()
      }}
      role="region"
      tabIndex={0}
      aria-label={
        whole
          ? '모자이크 미리보기 — 이미지 전체에 적용. 끌어서 화면 위치를, 휠로 배율을 조절합니다.'
          : `모자이크 미리보기 — 영역 ${regions.length}개. 빈 곳을 끌어 영역을 지정하고, 영역을 끌어 옮기며 핸들로 크기를 조절합니다. Space를 누른 채 끌거나 두 손가락으로 화면 위치를, 휠로 배율을 조절합니다.`
      }
    >
      {size.width > 0 && size.height > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          onMouseLeave={() => setHoverCursor(null)}
          onPointerDown={handleStagePointerDown}
          onWheel={handleWheel}
        >
          {/* 확대 시(200% 이상) 픽셀이 뭉개지지 않도록 스무딩 끔 */}
          <Layer imageSmoothingEnabled={zoom < 2} listening={false}>
            <Group x={view.x} y={view.y} scaleX={zoom} scaleY={zoom}>
              <Rect
                width={width}
                height={height}
                fillPatternImage={checker as unknown as HTMLImageElement}
                fillPatternScale={{ x: 1 / zoom, y: 1 / zoom }}
              />
              {mode === 'original' ? (
                <KonvaImage image={original} width={width} height={height} />
              ) : (
                <KonvaImage ref={imageRef} image={result} width={width} height={height} />
              )}
              {/* 워터마크 — 결과 위에 그리고 이미지 영역 밖은 잘라낸다. 원본 보기에서는 숨김, 비교에서는 아래 원본 그룹이 왼쪽을 덮는다 */}
              {watermark && mode !== 'original' && (
                <Group clipX={0} clipY={0} clipWidth={width} clipHeight={height}>
                  <KonvaShape
                    listening={false}
                    perfectDrawEnabled={false}
                    sceneFunc={(context) => drawWatermark(context._context, { width, height }, watermark.settings, watermark.logo)}
                  />
                </Group>
              )}
              {/* 비교: 경계선 왼쪽만 원본을 보인다 */}
              {/* Konva는 clipWidth 0을 「클립 없음」으로 처리하므로 경계선이 맨 왼쪽(0%)이면 그리지 않는다 */}
              {mode === 'compare' && split > 0 && (
                <Group clipX={0} clipY={0} clipWidth={split * width} clipHeight={height}>
                  <KonvaImage image={original} width={width} height={height} />
                </Group>
              )}
            </Group>
          </Layer>
          <Layer>
            <Rect x={sx(0)} y={sy(0)} width={width * zoom} height={height * zoom} stroke={INDIGO} strokeWidth={1} opacity={0.4} listening={false} />
            {showRegions && regions.map(renderOutline)}
            {drawRect && drawRect.width > 0 && drawRect.height > 0 &&
              shapeNode(drawShape, drawRect, { stroke: INDIGO, strokeWidth: 1.5, dash: [6, 4], fill: 'rgba(79,70,229,0.08)', listening: false })}
            {/* 크기 조절 핸들 — 선택한 영역(편집·이동 모드)만, 윤곽 위에 그린다 */}
            {editable &&
              selected &&
              HANDLES.map((handle) => {
                const at = handlePoint(selected, handle)
                const cx = sx(at.x)
                const cy = sy(at.y)
                return (
                  <Group key={handle}>
                    <Rect
                      x={cx - HANDLE_SIZE / 2}
                      y={cy - HANDLE_SIZE / 2}
                      width={HANDLE_SIZE}
                      height={HANDLE_SIZE}
                      fill="#ffffff"
                      stroke={INDIGO}
                      strokeWidth={1.5}
                      listening={false}
                    />
                    <Rect
                      x={cx - handleHit / 2}
                      y={cy - handleHit / 2}
                      width={handleHit}
                      height={handleHit}
                      fill="rgba(0,0,0,0.001)"
                      name={`handle-${handle}`}
                      onPointerDown={(e) => startResize(selected, handle, e)}
                      {...hover(HANDLE_CURSOR[handle])}
                    />
                  </Group>
                )
              })}
          </Layer>
        </Stage>
      )}
      {showDivider && (
        <div
          className="absolute z-10 w-6 -translate-x-1/2 cursor-col-resize touch-none"
          style={{ left: dividerX, top: visibleTop, height: visibleBottom - visibleTop }}
          onPointerDown={startDivider}
          data-testid="mosaic-compare-divider"
        >
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
          <div className="pointer-events-none absolute" style={{ top: Math.max(12, handleY - 44) }}>
            <span className="absolute right-3 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">원본</span>
            <span className="absolute left-9 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">결과</span>
          </div>
          <div
            role="slider"
            tabIndex={0}
            aria-label="원본·결과 비교 위치"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(split * 100)}
            aria-valuetext={`원본 ${Math.round(split * 100)}%`}
            onKeyDown={onDividerKeyDown}
            className="absolute left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[var(--penta-indigo)] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ top: handleY }}
          >
            <ChevronsLeftRight className="h-4 w-4" />
          </div>
        </div>
      )}
      <div onPointerDown={(e) => e.stopPropagation()}>
        <ZoomControls
          zoomPercent={Math.round(zoom * 100)}
          onZoomIn={() => zoomTo(zoom * ZOOM_STEP)}
          onZoomOut={() => zoomTo(zoom / ZOOM_STEP)}
          onFit={fit}
          onActualSize={() => setView({ zoom: 1, ...centerPosition(width, height, size.width, size.height, 1) })}
        />
      </div>
    </div>
  )
}
