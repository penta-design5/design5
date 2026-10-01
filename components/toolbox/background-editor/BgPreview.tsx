'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fitZoom } from '@/lib/toolbox/common/view'

/** 미리보기 방식 — 결과가 나온 뒤 작업 영역 왼쪽 위 전환 버튼으로 고른다 */
export type PreviewMode = 'original' | 'compare' | 'result'

/** 투명 영역 체크무늬 — 공용 createCheckerPattern과 같은 색·8px 칸 */
const CHECKER_STYLE: React.CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '16px 16px',
}

/** 비교 경계선 키보드 이동 폭(%) — Shift는 10배 */
const KEY_STEP = 1

interface BgPreviewProps {
  original: HTMLCanvasElement
  /** 배경을 제거한 결과(원본 해상도) — 없으면 원본만 표시 */
  result: HTMLCanvasElement | null
  mode: PreviewMode
  /** 처리 중 — 원본을 흐리게 */
  dimmed?: boolean
}

/** 원본 해상도 캔버스를 화면 크기 × devicePixelRatio로만 그린다(큰 이미지도 가볍게) */
function DisplayCanvas({
  source,
  width,
  height,
  className,
  style,
  testId,
  label,
}: {
  source: HTMLCanvasElement
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
  testId: string
  label: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const display = ref.current
    if (!display) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    display.width = Math.min(source.width, Math.round(width * dpr))
    display.height = Math.min(source.height, Math.round(height * dpr))
    const ctx = display.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, display.width, display.height)
    ctx.drawImage(source, 0, 0, display.width, display.height)
  }, [source, width, height])
  return (
    <canvas
      ref={ref}
      data-testid={testId}
      className={cn('absolute inset-0 block', className)}
      style={{ width, height, ...style }}
      role="img"
      aria-label={label}
    />
  )
}

/**
 * 작업 영역에 맞춰 이미지를 표시한다(원본보다 키우지 않음).
 * - 원본: 불러온 이미지 / 결과: 체크무늬 위 투명 배경
 * - 비교: 왼쪽 원본 · 오른쪽 결과, 세로 경계선을 끌어(마우스·터치·방향키) 비교 위치를 바꾼다
 * 확대/축소·화면 이동은 P3에서 추가한다 — 그때 화면 끌기와 겹치지 않도록 경계선(손잡이 포함)을 잡을 때만 비교 위치가 움직인다.
 */
export function BgPreview({ original, result, mode, dimmed }: BgPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  /** 경계선 위치(%, 왼쪽 = 원본 영역) */
  const [split, setSplit] = useState(50)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBox({ width: Math.floor(width), height: Math.floor(height) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 새 결과(새 이미지·다시 제거)가 나오면 경계선을 가운데로
  useEffect(() => setSplit(50), [result])

  // 끄는 중에는 window 포인터 이벤트로 따라가 이미지 밖으로 나가도 끊기지 않는다
  useEffect(() => {
    if (!dragging) return
    const move = (e: PointerEvent) => {
      const rect = frameRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0) return
      setSplit(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)))
    }
    const end = () => setDragging(false)
    const prevCursor = document.body.style.cursor
    document.body.style.cursor = 'col-resize'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      document.body.style.cursor = prevCursor
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragging])

  const zoom = box.width && box.height ? fitZoom(original.width, original.height, box.width, box.height) : 0
  const width = Math.max(1, Math.round(original.width * zoom))
  const height = Math.max(1, Math.round(original.height * zoom))
  const shown: PreviewMode = result ? mode : 'original'

  const startDrag = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    const rect = frameRef.current?.getBoundingClientRect()
    if (rect && rect.width > 0) setSplit(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)))
    setDragging(true)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? KEY_STEP * 10 : KEY_STEP
    const next =
      e.key === 'ArrowLeft' ? split - step : e.key === 'ArrowRight' ? split + step : e.key === 'Home' ? 0 : e.key === 'End' ? 100 : null
    if (next === null) return
    e.preventDefault()
    setSplit(Math.min(100, Math.max(0, next)))
  }

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
      {zoom > 0 && (
        <div
          ref={frameRef}
          className={cn('relative shadow-sm transition-opacity', dimmed && 'opacity-60')}
          style={{ width, height }}
          data-testid="bg-preview"
          data-mode={shown}
          data-transparent={shown === 'original' ? 'false' : 'true'}
        >
          {result && shown !== 'original' && (
            <DisplayCanvas source={result} width={width} height={height} style={CHECKER_STYLE} testId="bg-preview-result" label="배경을 제거한 결과" />
          )}
          {shown !== 'result' && (
            <DisplayCanvas
              source={original}
              width={width}
              height={height}
              testId="bg-preview-original"
              label="원본 이미지"
              // 비교: 경계선 왼쪽만 원본을 보인다
              style={shown === 'compare' ? { clipPath: `inset(0 ${100 - split}% 0 0)` } : undefined}
            />
          )}

          {shown === 'compare' && (
            <>
              <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">원본</span>
              <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">결과</span>
              {/* 경계선 — 잡기 쉽게 투명 히트 영역(24px)을 두고, 손잡이는 키보드 슬라이더 */}
              <div
                className="absolute inset-y-0 z-10 w-6 -translate-x-1/2 cursor-col-resize touch-none"
                style={{ left: `${split}%` }}
                onPointerDown={startDrag}
                data-testid="bg-compare-divider"
              >
                <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="원본·결과 비교 위치"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(split)}
                  aria-valuetext={`원본 ${Math.round(split)}%`}
                  onKeyDown={onKeyDown}
                  className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[var(--penta-indigo)] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronsLeftRight className="h-4 w-4" />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
