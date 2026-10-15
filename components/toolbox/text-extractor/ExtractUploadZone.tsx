'use client'

import { FileUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExtractUploadZoneProps {
  dragActive: boolean
  disabled?: boolean
  onBrowse: () => void
  className?: string
}

/** 파일이 없을 때의 업로드 영역(이미지 + PDF + 오피스 문서). 공용 `ImageUploadZone`은 이미지 전용 문구라 이 메뉴 전용으로 둔다. 끌어다 놓기·붙여넣기 처리는 페이지에서 */
export function ExtractUploadZone({ dragActive, disabled, onBrowse, className }: ExtractUploadZoneProps) {
  return (
    <button
      type="button"
      onClick={onBrowse}
      disabled={disabled}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-card p-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        dragActive
          ? 'border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.05)]'
          : 'border-border hover:border-[rgb(var(--penta-indigo-rgb)/0.6)]',
        disabled && 'cursor-wait opacity-60',
        className
      )}
    >
      <FileUp className="h-10 w-10 text-muted-foreground" />
      <p className="text-base font-medium">{dragActive ? '여기에 파일을 놓으세요' : '클릭하거나 이미지·PDF·문서를 끌어다 놓으세요'}</p>
      <p className="text-sm text-muted-foreground">Ctrl/⌘ + V로 캡처한 이미지를 붙여넣을 수도 있습니다.</p>
      <p className="text-xs text-muted-foreground">이미지(PNG, JPG, WebP, GIF, BMP · 최대 20MB) · PDF(최대 50MB, 한 번에 50쪽) · 문서(DOCX, PPTX, XLSX, HWPX · 최대 50MB)</p>
    </button>
  )
}
