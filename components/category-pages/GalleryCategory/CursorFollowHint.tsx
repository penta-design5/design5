'use client'

import { useState, useCallback, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

/** 커서와 말풍선(삼각형 끝) 사이 */
const CURSOR_GAP = 12
const VIEW_PAD = 8

interface CursorFollowHintProps {
  children: React.ReactNode
  /** \\n 으로 줄바꿈 가능 */
  content: string
  className?: string
}

function clampLeft(clientX: number, halfWidth: number) {
  return Math.max(
    VIEW_PAD + halfWidth,
    Math.min(clientX, window.innerWidth - VIEW_PAD - halfWidth)
  )
}

/**
 * 마우스 커서를 따라다니는 말풍선형 힌트.
 * 기본: 말풍선이 커서 **위**, 하단 중앙 **역삼각형**이 커서를 가리킴.
 * 화면 상단에 공간이 없으면 커서 **아래**로 옮기고 상단에 삼각형(위를 가리킴).
 */
export function CursorFollowHint({ children, content, className }: CursorFollowHintProps) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  /** true = 커서 아래에 말풍선(위쪽 삼각형) */
  const [flip, setFlip] = useState(false)
  const [layout, setLayout] = useState({ left: 0, top: 0 })
  const [positioned, setPositioned] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)

  const move = useCallback((clientX: number, clientY: number) => {
    setCursor({ x: clientX, y: clientY })
  }, [])

  useLayoutEffect(() => {
    if (!open || !bubbleRef.current) {
      return
    }

    const el = bubbleRef.current
    const rect = el.getBoundingClientRect()
    const h = rect.height
    const w = rect.width
    const halfW = w / 2
    const left = clampLeft(cursor.x, halfW)

    const topIfAbove = cursor.y - CURSOR_GAP - h

    if (flip) {
      if (topIfAbove >= VIEW_PAD) {
        setFlip(false)
        return
      }
      let top = cursor.y + CURSOR_GAP
      if (top + h > window.innerHeight - VIEW_PAD) {
        top = window.innerHeight - VIEW_PAD - h
      }
      if (top < VIEW_PAD) top = VIEW_PAD
      setLayout({ left, top })
      setPositioned(true)
      return
    }

    if (topIfAbove < VIEW_PAD) {
      setFlip(true)
      return
    }

    setLayout({ left, top: topIfAbove })
    setPositioned(true)
  }, [open, cursor.x, cursor.y, content, flip])

  const portal =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={bubbleRef}
        className={cn(
          'pointer-events-none fixed z-[100] flex w-max max-w-xs flex-col items-center transition-opacity duration-75',
          positioned ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          left: layout.left,
          top: layout.top,
          transform: 'translateX(-50%)',
        }}
        role="tooltip"
      >
        {!flip ? (
          <>
            <div
              className={cn(
                'w-full rounded-md bg-gray-700 px-3 py-2 text-left text-sm leading-snug text-white shadow-md',
                'whitespace-pre-line'
              )}
            >
              {content}
            </div>
            {/* 삼각형 위치: 말풍선 하단 중앙 — `left-*` 로 미세 조정 가능 */}
            <div className="flex w-full justify-center" aria-hidden>
              <div className="h-0 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-gray-700" />
            </div>
          </>
        ) : (
          <>
            <div className="flex w-full justify-center" aria-hidden>
              <div className="h-0 w-0 border-x-[7px] border-b-[9px] border-x-transparent border-b-gray-700" />
            </div>
            <div
              className={cn(
                'w-full rounded-md bg-gray-700 px-3 py-2 text-left text-sm leading-snug text-white shadow-md',
                'whitespace-pre-line'
              )}
            >
              {content}
            </div>
          </>
        )}
      </div>,
      document.body
    )

  return (
    <>
      <div
        onPointerEnter={(e) => {
          setOpen(true)
          setFlip(false)
          setPositioned(false)
          move(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          move(e.clientX, e.clientY)
        }}
        onPointerLeave={() => {
          setOpen(false)
          setFlip(false)
          setPositioned(false)
          setLayout({ left: 0, top: 0 })
        }}
      >
        {children}
      </div>
      {portal}
    </>
  )
}
