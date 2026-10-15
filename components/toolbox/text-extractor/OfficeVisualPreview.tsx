'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, FolderOpen, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ZoomControls } from '@/components/toolbox/common/ZoomControls'
import { ZOOM_STEP } from '@/lib/toolbox/common/constants'
import { formatFileSize } from '@/lib/design-request-attachments'
import { officeFormatLabel, type OfficeFormat } from '@/lib/toolbox/text-extractor/office'
import { PREVIEW_RESIZE_EVENT, type PreviewResizeDetail } from '@/lib/toolbox/text-extractor/preview-resize'

/** 형식별 화면 렌더러 — 본문·스타일 요소에 그린다 */
export type OfficeRenderer = (data: ArrayBuffer, body: HTMLElement, style: HTMLElement) => Promise<void>

export interface OfficePreviewRenderer {
  render: OfficeRenderer
  /** 폭 맞춤 최소 배율(기본 0.3) — 이보다 더 줄여야 하면 가로 스크롤(Excel 시트처럼 넓은 문서) */
  minZoom?: number
  /** 쪽(슬라이드) 요소 선택자 — 툴바 「화면에 맞추기」가 쪽 하나를 통째로 맞춘다. 없으면(Excel) 폭 맞춤 */
  pageSelector?: string
}

/** 직접 바꾸는 배율 범위 */
const OFFICE_MIN_ZOOM = 0.1
const OFFICE_MAX_ZOOM = 4
/** 쪽 맞춤 때 쪽 둘레 여백(px) */
const PAGE_MARGIN = 16

/** 폭 맞춤(열 때 기본) · 쪽 맞춤(툴바 「화면에 맞추기」) · 직접 배율 */
type FitMode = 'width' | 'page' | 'manual'

interface OfficeVisualPreviewProps {
  fileName: string
  format: OfficeFormat
  size: number
  data: ArrayBuffer
  render: OfficeRenderer
  minZoom?: number
  pageSelector?: string
  busy: boolean
  dragActive: boolean
  onBrowse: () => void
}

/**
 * 오피스 문서 **화면 미리보기** — 형식별 렌더러가 문서 모양(페이지·표·그림 배치)을 그린다.
 * 원본과 다르게 보일 수 있다는 안내를 위쪽에 항상 둔다. 페이지가 영역보다 넓으면 폭에 맞춰 줄인다(CSS zoom).
 * 오른쪽 아래 줌 툴바(공용 ZoomControls)·Ctrl/⌘+휠로 배율을 바꾸고, 화면 이동은 스크롤로 한다(Z1). 「화면에 맞추기」는 쪽 맞춤(Z1-보완).
 * 그리기에 실패하면 안내만 보이고, 텍스트 추출은 그대로 된다.
 */
export function OfficeVisualPreview({ fileName, format, size, data, render, minZoom = 0.3, pageSelector, busy, dragActive, onBrowse }: OfficeVisualPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'rendering' | 'done' | 'error'>('rendering')

  useEffect(() => {
    const body = bodyRef.current
    const style = styleRef.current
    if (!body || !style) return
    let canceled = false
    setState('rendering')
    body.replaceChildren()
    style.replaceChildren()
    // 화면에 붙지 않은 요소에 먼저 그리고, 취소되지 않았을 때만 옮겨 붙인다(늦게 끝난 이전 파일 그리기가 덮어쓰지 않도록).
    // 렌더러가 버퍼를 건드릴 수 있어 복사본을 넘긴다(추출용 원본 보존)
    const draftBody = document.createElement('div')
    const draftStyle = document.createElement('div')
    render(data.slice(0), draftBody, draftStyle)
      .then(() => {
        if (canceled) return
        style.replaceChildren(...Array.from(draftStyle.childNodes))
        body.replaceChildren(...Array.from(draftBody.childNodes))
        setState('done')
      })
      .catch((e) => {
        if (canceled) return
        console.error('[OCR] 문서 미리보기 실패:', e)
        body.replaceChildren()
        setState('error')
      })
    return () => {
      canceled = true
    }
  }, [data, render])

  // 배율 — 열 때는 「폭 맞춤」(내용이 영역보다 넓으면 폭에 맞춰 줄임, 최소 minZoom — 그보다 넓으면 가로 스크롤).
  // 툴바 「화면에 맞추기」는 **쪽 맞춤**: 지금 보고 있는 쪽(Word·한글)·슬라이드(PowerPoint)가 통째로 보이게(이미지 미리보기와 같은 뜻).
  // 쪽이 없는 Excel은 폭 맞춤. 툴바·Ctrl/⌘+휠로 직접 바꾸면 그 배율을 유지한다(창 크기가 바뀌어도)
  const modeRef = useRef<FitMode>('width')
  const zoomRef = useRef(1)
  const [zoomPercent, setZoomPercent] = useState(100)

  const setZoomValue = useCallback((z: number) => {
    const body = bodyRef.current
    if (!body) return
    body.style.zoom = String(z)
    zoomRef.current = z
    setZoomPercent(Math.round(z * 100))
  }, [])

  /** 배율 적용 — anchor(영역 안 화면 좌표, 기본 가운데)의 문서 위치를 고정한다 */
  const applyZoom = useCallback((next: number, anchor?: { x: number; y: number }) => {
    const scroll = scrollRef.current
    if (!scroll) return
    const prev = zoomRef.current
    const ax = anchor?.x ?? scroll.clientWidth / 2
    const ay = anchor?.y ?? scroll.clientHeight / 2
    const docX = (scroll.scrollLeft + ax) / prev
    const docY = (scroll.scrollTop + ay) / prev
    setZoomValue(next)
    scroll.scrollLeft = docX * next - ax
    scroll.scrollTop = docY * next - ay
  }, [setZoomValue])

  /** 폭 맞춤 배율(원래 크기보다 키우지 않음). 내용 너비는 max-content로 잰다 — 가운데 정렬된 쪽이 영역보다 넓으면 왼쪽으로 넘친 부분이 scrollWidth에 잡히지 않는다(Word) */
  const widthFitZoom = useCallback(() => {
    const scroll = scrollRef.current
    const body = bodyRef.current
    if (!scroll || !body) return 1
    const { zoom, width } = body.style
    body.style.zoom = '1'
    body.style.width = 'max-content'
    const natural = body.scrollWidth
    body.style.zoom = zoom
    body.style.width = width
    const available = scroll.clientWidth
    return natural > available ? Math.max(minZoom, available / natural) : 1
  }, [minZoom])

  const fitWidth = useCallback(() => {
    modeRef.current = 'width'
    setZoomValue(widthFitZoom())
  }, [widthFitZoom, setZoomValue])

  /** 지금 화면 가운데에 걸친 쪽(없으면 가장 가까운 쪽) */
  const currentPage = useCallback((): HTMLElement | null => {
    const scroll = scrollRef.current
    const body = bodyRef.current
    if (!scroll || !body || !pageSelector) return null
    const pages = Array.from(body.querySelectorAll<HTMLElement>(pageSelector))
    if (!pages.length) return null
    const view = scroll.getBoundingClientRect()
    const center = view.top + view.height / 2
    let best = pages[0]
    let bestDist = Infinity
    for (const pg of pages) {
      const r = pg.getBoundingClientRect()
      const dist = r.top <= center && r.bottom >= center ? 0 : Math.min(Math.abs(r.top - center), Math.abs(r.bottom - center))
      if (dist < bestDist) {
        best = pg
        bestDist = dist
      }
    }
    return best
  }, [pageSelector])

  /** 쪽 맞춤 — 쪽 하나가 영역에 통째로 들어오는 배율(원래 크기보다 키우지 않음)로 맞추고 그 쪽을 가운데에 둔다 */
  const fitPage = useCallback((page?: HTMLElement | null) => {
    const scroll = scrollRef.current
    const target = page ?? currentPage()
    if (!scroll || !target) return fitWidth()
    modeRef.current = 'page'
    // 쪽 크기는 배율과 관계없는 offsetWidth/Height(CSS 픽셀)
    const w = target.offsetWidth
    const h = target.offsetHeight
    const z = Math.max(0.05, Math.min(1, (scroll.clientWidth - PAGE_MARGIN * 2) / w, (scroll.clientHeight - PAGE_MARGIN * 2) / h))
    setZoomValue(z)
    // 배율을 바꾼 뒤의 화면 위치로 스크롤(가로는 가운데, 세로는 쪽 위 여백)
    const view = scroll.getBoundingClientRect()
    const r = target.getBoundingClientRect()
    scroll.scrollLeft += r.left - view.left - (scroll.clientWidth - r.width) / 2
    scroll.scrollTop += r.top - view.top - (scroll.clientHeight - r.height) / 2
  }, [currentPage, fitWidth, setZoomValue])

  const zoomTo = useCallback((next: number, anchor?: { x: number; y: number }) => {
    modeRef.current = 'manual'
    applyZoom(Math.min(OFFICE_MAX_ZOOM, Math.max(OFFICE_MIN_ZOOM, next)), anchor)
  }, [applyZoom])

  // 새 파일은 다시 폭 맞춤으로
  useEffect(() => {
    modeRef.current = 'width'
  }, [data])

  useEffect(() => {
    const scroll = scrollRef.current
    const body = bodyRef.current
    if (!scroll || !body || state !== 'done') return
    let pinned: HTMLElement | null = null
    const refit = () => {
      if (modeRef.current === 'width') fitWidth()
      else if (modeRef.current === 'page') fitPage(pinned ?? undefined)
    }
    // 쪽 맞춤 중 창 크기가 바뀌면 같은 쪽을 다시 맞춘다
    const observer = new ResizeObserver(() => {
      if (modeRef.current === 'page' && !pinned) pinned = currentPage()
      refit()
      pinned = null
    })
    // 렌더러가 그린 뒤 내용을 바꾸면(시트 탭 전환 등) PREVIEW_RESIZE_EVENT로 다시 맞춘다
    const onContentResize = (e: Event) => {
      refit()
      if ((e as CustomEvent<PreviewResizeDetail>).detail?.resetScroll) scroll.scrollTo({ top: 0, left: 0 })
    }
    // Ctrl/⌘ + 휠(트랙패드 핀치 포함)은 확대·축소, 그냥 휠은 스크롤
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const rect = scroll.getBoundingClientRect()
      zoomTo(zoomRef.current * Math.exp(-e.deltaY * 0.0015), { x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
    refit()
    observer.observe(scroll)
    body.addEventListener(PREVIEW_RESIZE_EVENT, onContentResize)
    scroll.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      observer.disconnect()
      body.removeEventListener(PREVIEW_RESIZE_EVENT, onContentResize)
      scroll.removeEventListener('wheel', onWheel)
    }
  }, [state, fitWidth, fitPage, currentPage, zoomTo])

  return (
    <div className="relative flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-lg border bg-neutral-100" data-testid="ocr-office-visual">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-card px-4 py-3">
        <FileText className="h-5 w-5 shrink-0 text-[var(--penta-indigo)]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={fileName}>
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {officeFormatLabel(format)} 문서 · {formatFileSize(size)}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="[@media(pointer:coarse)]:h-11" onClick={onBrowse} disabled={busy}>
          <FolderOpen className="mr-2 h-4 w-4" />
          새 파일 열기
        </Button>
      </div>
      <p className="flex items-center gap-2 border-b bg-sky-50 px-4 py-2 text-xs text-sky-900" data-testid="ocr-office-visual-guide">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        미리보기는 원본 문서와 다르게 보일 수 있습니다. 텍스트 추출 결과와는 관계없습니다.
      </p>
      {/* 키보드로도 스크롤할 수 있게 포커스를 받는다(axe scrollable-region-focusable) */}
      <div ref={scrollRef} tabIndex={0} className="relative flex-1 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-label="문서 미리보기" role="region">
        <div ref={styleRef} />
        <div ref={bodyRef} className="ocr-office-render" data-testid="ocr-office-render" />
        {state === 'rendering' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {state === 'error' && (
          <p className="p-10 text-center text-sm text-muted-foreground" data-testid="ocr-office-render-error">
            이 문서는 미리보기를 표시할 수 없습니다. 「텍스트 추출」은 그대로 사용할 수 있습니다.
          </p>
        )}
      </div>
      {state === 'done' && (
        // 세로 스크롤바(Windows 약 17px)를 피해 조금 안쪽에 둔다
        <ZoomControls
          className="bottom-4 right-6"
          zoomPercent={zoomPercent}
          onZoomIn={() => zoomTo(zoomRef.current * ZOOM_STEP)}
          onZoomOut={() => zoomTo(zoomRef.current / ZOOM_STEP)}
          onFit={() => (pageSelector ? fitPage() : fitWidth())}
          onActualSize={() => zoomTo(1)}
        />
      )}
      {dragActive && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
          여기에 놓으면 새 파일로 교체됩니다
        </div>
      )}
    </div>
  )
}
