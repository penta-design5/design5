'use client'

import type { ReactNode } from 'react'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ZoomControlsProps {
  zoomPercent: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onActualSize: () => void
  /** 위치 조정(기본 오른쪽 아래 12px) — 세로 스크롤바를 피해야 할 때 */
  className?: string
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11" onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** 캔버스 오른쪽 아래에 떠 있는 줌 컨트롤 — TOOLBOX 공용(이미지 편집·이미지 분할·배경 편집·이미지 모자이크·텍스트추출). 터치 기기(pointer: coarse)에서는 버튼 44px */
export function ZoomControls({ zoomPercent, onZoomIn, onZoomOut, onFit, onActualSize, className }: ZoomControlsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-lg border bg-card/95 px-1 py-0.5 shadow-sm', className)} data-testid="zoom-controls">
        <IconButton label="축소" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </IconButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 min-w-[52px] px-1.5 text-xs tabular-nums [@media(pointer:coarse)]:h-11"
              onClick={onActualSize}
              aria-label="100%로 보기"
            >
              {zoomPercent}%
            </Button>
          </TooltipTrigger>
          <TooltipContent>100%로 보기</TooltipContent>
        </Tooltip>
        <IconButton label="확대" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </IconButton>
        <IconButton label="화면에 맞추기" onClick={onFit}>
          <Maximize className="h-4 w-4" />
        </IconButton>
      </div>
    </TooltipProvider>
  )
}
