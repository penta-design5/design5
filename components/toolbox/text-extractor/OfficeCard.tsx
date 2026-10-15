'use client'

import { FileText, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/design-request-attachments'
import { officeFormatLabel, type OfficeFormat } from '@/lib/toolbox/text-extractor/office'

interface OfficeCardProps {
  fileName: string
  format: OfficeFormat
  size: number
  busy: boolean
  dragActive: boolean
  onBrowse: () => void
}

/** 화면 미리보기를 아직 지원하지 않는 문서 형식의 자리 — 문서 정보와 처리 방식 안내(OCR 없이 글자를 그대로 가져옴) */
export function OfficeCard({ fileName, format, size, busy, dragActive, onBrowse }: OfficeCardProps) {
  return (
    <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-lg border bg-neutral-100 p-6" data-testid="ocr-office-card">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <FileText className="h-12 w-12 text-[var(--penta-indigo)]" />
        <p className="break-all text-base font-medium">{fileName}</p>
        <p className="text-sm text-muted-foreground">
          {officeFormatLabel(format)} 문서 · {formatFileSize(size)}
        </p>
        <p className="text-sm text-muted-foreground">
          「텍스트 추출」을 누르면 OCR 없이 문서에 들어 있는 글자를 그대로 가져옵니다. 머리말·각주·그림 속 글자 등은 추출되지 않으며, 추출 후 결과 위에 따로 알려 드립니다.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onBrowse} disabled={busy}>
          <FolderOpen className="mr-2 h-4 w-4" />
          새 파일 열기
        </Button>
      </div>
      {dragActive && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
          여기에 놓으면 새 파일로 교체됩니다
        </div>
      )}
    </div>
  )
}
