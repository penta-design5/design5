'use client'

import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadZoneProps {
  dragActive: boolean
  disabled?: boolean
  onBrowse: () => void
  className?: string
}

/** 이미지가 없을 때의 업로드 영역. 드래그 앤 드롭·붙여넣기 처리는 페이지에서 담당 */
export function ImageUploadZone({ dragActive, disabled, onBrowse, className }: ImageUploadZoneProps) {
  return (
    <button
      type="button"
      onClick={onBrowse}
      disabled={disabled}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-card p-8 text-center transition-colors',
        dragActive
          ? 'border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.05)]'
          : 'border-border hover:border-[rgb(var(--penta-indigo-rgb)/0.6)]',
        disabled && 'cursor-wait opacity-60',
        className
      )}
    >
      <ImagePlus className="h-10 w-10 text-muted-foreground" />
      <p className="text-base font-medium">
        {dragActive ? '여기에 이미지를 놓으세요' : '클릭하거나 이미지를 끌어다 놓으세요'}
      </p>
      <p className="text-sm text-muted-foreground">Ctrl/⌘ + V로 복사한 이미지를 붙여넣을 수도 있습니다.</p>
      <p className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF, BMP · 최대 20MB · 약 1,670만 픽셀(4096×4096) 이하</p>
    </button>
  )
}
