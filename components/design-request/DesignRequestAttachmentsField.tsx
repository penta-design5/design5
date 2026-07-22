'use client'

import { useRef } from 'react'
import { Paperclip, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DESIGN_REQUEST_ACCEPT_ATTR,
  DESIGN_REQUEST_ALLOWED_EXTENSIONS_LABEL,
  DESIGN_REQUEST_ATTACHMENT_MAX_COUNT,
  formatFileSize,
} from '@/lib/design-request-attachments'

/** 이미 저장된 첨부(수정 모드) */
export interface ExistingAttachmentItem {
  id: string
  fileName: string
  fileSize: number
}

export interface DesignRequestAttachmentsFieldProps {
  /** 유지 중인 기존 첨부 (수정 모드) */
  existing: ExistingAttachmentItem[]
  /** 새로 선택한 파일 */
  pending: File[]
  disabled?: boolean
  error?: string | null
  onAddFiles: (files: File[]) => void
  onRemoveExisting: (id: string) => void
  onRemovePending: (index: number) => void
}

export function DesignRequestAttachmentsField({
  existing,
  pending,
  disabled,
  error,
  onAddFiles,
  onRemoveExisting,
  onRemovePending,
}: DesignRequestAttachmentsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const total = existing.length + pending.length
  const reachedMax = total >= DESIGN_REQUEST_ATTACHMENT_MAX_COUNT

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled || reachedMax}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="h-3.5 w-3.5" />
          파일 첨부
        </Button>
        <span className="text-xs text-muted-foreground">
          {total}/{DESIGN_REQUEST_ATTACHMENT_MAX_COUNT}개 · 파일당 25MB 이하
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={DESIGN_REQUEST_ACCEPT_ATTR}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length > 0) onAddFiles(files)
          // 같은 파일 다시 선택 가능하도록 초기화
          e.target.value = ''
        }}
      />

      <p className="text-[11px] text-muted-foreground">
        허용 형식: {DESIGN_REQUEST_ALLOWED_EXTENSIONS_LABEL}
      </p>

      {(existing.length > 0 || pending.length > 0) && (
        <ul className="space-y-1">
          {existing.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-2 py-1.5 text-sm"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{a.fileName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFileSize(a.fileSize)}
              </span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                disabled={disabled}
                onClick={() => onRemoveExisting(a.id)}
                aria-label={`${a.fileName} 삭제`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {pending.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-dashed border-input bg-background px-2 py-1.5 text-sm"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFileSize(f.size)}
              </span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                disabled={disabled}
                onClick={() => onRemovePending(i)}
                aria-label={`${f.name} 삭제`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className={cn('text-sm text-destructive')}>{error}</p>}
    </div>
  )
}
