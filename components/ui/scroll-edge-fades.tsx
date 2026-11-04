'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode, type RefObject } from 'react'
import { cn } from '@/lib/utils'

export type ScrollEdgeFadeVariant = 'neutral' | 'background'
export type ScrollEdgeFadeOrientation = 'horizontal' | 'vertical'

/** 그라데이션 막 크기(px) — 가로 w-10 / 세로 h-10과 같은 값. 자동 스크롤 시 "가려지는 영역" 계산에 사용 */
export const SCROLL_EDGE_FADE_SIZE = 40

export interface ScrollEdgeFadesProps {
  children: ReactNode
  className?: string
  scrollClassName?: string
  /** horizontal: 좌우 가장자리, vertical: 상하 가장자리 */
  orientation?: ScrollEdgeFadeOrientation
  /** neutral: 카테고리 목록(bg-neutral-50)과 맞춤, background: 레이아웃 bg-background와 맞춤 */
  edgeFadeVariant?: ScrollEdgeFadeVariant
  /** 스크롤 영역 요소가 필요할 때(예: 현재 항목으로 자동 스크롤) */
  viewportRef?: RefObject<HTMLDivElement | null>
}

/**
 * 스크롤 영역 가장자리에 "더 있음" 그라데이션 막을 표시한다.
 * 스크롤할 내용이 남은 쪽에만 보이고, 막은 클릭을 가로채지 않는다(pointer-events-none).
 */
export function ScrollEdgeFades({
  children,
  className,
  scrollClassName,
  orientation = 'horizontal',
  edgeFadeVariant = 'neutral',
  viewportRef,
}: ScrollEdgeFadesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showStart, setShowStart] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const isVertical = orientation === 'vertical'

  const updateEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const offset = isVertical ? el.scrollTop : el.scrollLeft
    const maxScroll = isVertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth
    const epsilon = 2
    setShowStart(offset > epsilon)
    setShowEnd(offset < maxScroll - epsilon)
  }, [isVertical])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (viewportRef) viewportRef.current = el
    updateEdges()
    // 영역 크기뿐 아니라 내용 크기 변화(메뉴 펼침·세션 로드 후 메뉴 추가 등)도 감지
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    Array.from(el.children).forEach((child) => ro.observe(child))
    el.addEventListener('scroll', updateEdges, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', updateEdges)
      if (viewportRef) viewportRef.current = null
    }
  }, [updateEdges, viewportRef])

  const fadeFrom =
    edgeFadeVariant === 'background'
      ? 'from-background'
      : 'from-neutral-50 dark:from-neutral-900'

  const fadeBase = 'pointer-events-none absolute z-10 to-transparent'
  const startFadeClass = isVertical
    ? 'inset-x-0 top-0 h-10 bg-gradient-to-b'
    : 'inset-y-0 left-0 w-10 bg-gradient-to-r'
  const endFadeClass = isVertical
    ? 'inset-x-0 bottom-0 h-10 bg-gradient-to-t'
    : 'inset-y-0 right-0 w-10 bg-gradient-to-l'

  return (
    <div className={cn('relative', isVertical ? 'min-h-0' : 'min-w-0', className)}>
      {showStart && <div className={cn(fadeBase, startFadeClass, fadeFrom)} aria-hidden />}
      {showEnd && <div className={cn(fadeBase, endFadeClass, fadeFrom)} aria-hidden />}
      <div
        ref={scrollRef}
        className={cn(
          isVertical
            ? 'overflow-y-auto overflow-x-hidden'
            : 'horizontal-scroll-edge-fades-track overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]',
          scrollClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
