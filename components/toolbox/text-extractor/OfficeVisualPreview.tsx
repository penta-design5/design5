'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, FolderOpen, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/design-request-attachments'
import { officeFormatLabel, type OfficeFormat } from '@/lib/toolbox/text-extractor/office'
import { PREVIEW_RESIZE_EVENT, type PreviewResizeDetail } from '@/lib/toolbox/text-extractor/preview-resize'

/** 형식별 화면 렌더러 — 본문·스타일 요소에 그린다 */
export type OfficeRenderer = (data: ArrayBuffer, body: HTMLElement, style: HTMLElement) => Promise<void>

export interface OfficePreviewRenderer {
  render: OfficeRenderer
  /** 폭 맞춤 최소 배율(기본 0.3) — 이보다 더 줄여야 하면 가로 스크롤(Excel 시트처럼 넓은 문서) */
  minZoom?: number
}

interface OfficeVisualPreviewProps {
  fileName: string
  format: OfficeFormat
  size: number
  data: ArrayBuffer
  render: OfficeRenderer
  minZoom?: number
  busy: boolean
  dragActive: boolean
  onBrowse: () => void
}

/**
 * 오피스 문서 **화면 미리보기** — 형식별 렌더러가 문서 모양(페이지·표·그림 배치)을 그린다.
 * 원본과 다르게 보일 수 있다는 안내를 위쪽에 항상 둔다. 페이지가 영역보다 넓으면 폭에 맞춰 줄인다(CSS zoom).
 * 그리기에 실패하면 안내만 보이고, 텍스트 추출은 그대로 된다.
 */
export function OfficeVisualPreview({ fileName, format, size, data, render, minZoom = 0.3, busy, dragActive, onBrowse }: OfficeVisualPreviewProps) {
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

  // 폭 맞춤 — 그려진 내용이 영역보다 넓으면 줄인다(최소 minZoom, 그보다 넓으면 가로 스크롤).
  // 렌더러가 그린 뒤 내용을 바꾸면(시트 탭 전환 등) PREVIEW_RESIZE_EVENT로 다시 맞춘다
  useEffect(() => {
    const scroll = scrollRef.current
    const body = bodyRef.current
    if (!scroll || !body || state !== 'done') return
    const fit = () => {
      body.style.zoom = '1'
      const available = scroll.clientWidth
      const natural = body.scrollWidth
      body.style.zoom = natural > available ? String(Math.max(minZoom, available / natural)) : '1'
    }
    const onContentResize = (e: Event) => {
      fit()
      if ((e as CustomEvent<PreviewResizeDetail>).detail?.resetScroll) scroll.scrollTo({ top: 0, left: 0 })
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(scroll)
    body.addEventListener(PREVIEW_RESIZE_EVENT, onContentResize)
    return () => {
      observer.disconnect()
      body.removeEventListener(PREVIEW_RESIZE_EVENT, onContentResize)
    }
  }, [state, minZoom])

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
      {dragActive && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
          여기에 놓으면 새 파일로 교체됩니다
        </div>
      )}
    </div>
  )
}
