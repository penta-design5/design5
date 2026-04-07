'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type HorizontalScrollEdgeFadeVariant = 'neutral' | 'background'

export interface HorizontalScrollEdgeFadesProps {
  children: ReactNode
  className?: string
  scrollClassName?: string
  /** neutral: 카테고리 목록(bg-neutral-50)과 맞춤, background: 레이아웃 bg-background와 맞춤 */
  edgeFadeVariant?: HorizontalScrollEdgeFadeVariant
}

export function HorizontalScrollEdgeFades({
  children,
  className,
  scrollClassName,
  edgeFadeVariant = 'neutral',
}: HorizontalScrollEdgeFadesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const updateEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = scrollWidth - clientWidth
    const epsilon = 2
    setShowLeft(scrollLeft > epsilon)
    setShowRight(scrollLeft < maxScroll - epsilon)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateEdges()
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    el.addEventListener('scroll', updateEdges, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', updateEdges)
    }
  }, [updateEdges])

  const fadeFrom =
    edgeFadeVariant === 'background'
      ? 'from-background'
      : 'from-neutral-50 dark:from-neutral-900'

  return (
    <div className={cn('relative min-w-0', className)}>
      {showLeft && (
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r to-transparent',
            fadeFrom
          )}
          aria-hidden
        />
      )}
      {showRight && (
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l to-transparent',
            fadeFrom
          )}
          aria-hidden
        />
      )}
      <div
        ref={scrollRef}
        className={cn(
          'horizontal-scroll-edge-fades-track overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]',
          scrollClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
