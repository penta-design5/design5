'use client'

import type { ReactNode } from 'react'
import { ScrollEdgeFades, type ScrollEdgeFadeVariant } from './scroll-edge-fades'

/** 가로 스크롤 가장자리 그라데이션 — 구현은 `ScrollEdgeFades`(orientation="horizontal") */
export type HorizontalScrollEdgeFadeVariant = ScrollEdgeFadeVariant

export interface HorizontalScrollEdgeFadesProps {
  children: ReactNode
  className?: string
  scrollClassName?: string
  /** neutral: 카테고리 목록(bg-neutral-50)과 맞춤, background: 레이아웃 bg-background와 맞춤 */
  edgeFadeVariant?: HorizontalScrollEdgeFadeVariant
}

export function HorizontalScrollEdgeFades(props: HorizontalScrollEdgeFadesProps) {
  return <ScrollEdgeFades {...props} orientation="horizontal" />
}
