'use client'

import type { ReactNode } from 'react'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ZoomControlsProps {
  zoomPercent: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onActualSize: () => void
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** 캔버스 오른쪽 아래에 떠 있는 줌 컨트롤 — TOOLBOX 이미지 도구 공용(이미지 편집·이미지 분할) */
export function ZoomControls({ zoomPercent, onZoomIn, onZoomOut, onFit, onActualSize }: ZoomControlsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-lg border bg-card/95 px-1 py-0.5 shadow-sm">
        <IconButton label="축소" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </IconButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 min-w-[52px] px-1.5 text-xs tabular-nums"
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
