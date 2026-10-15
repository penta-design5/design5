'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PDF_MAX_PAGES } from '@/lib/toolbox/text-extractor/pdf'

export interface PdfOptionsProps {
  numPages: number
  startText: string
  endText: string
  /** 페이지 범위 오류(없으면 null) */
  rangeError: string | null
  forceOcr: boolean
  /** 선택 영역이 있으면 그 영역을 고른 페이지(범위 대신 이 페이지만 추출), 없으면 null */
  regionPage: number | null
  disabled?: boolean
  onStartTextChange: (value: string) => void
  onEndTextChange: (value: string) => void
  onForceOcrChange: (value: boolean) => void
}

/** PDF 옵션 — 페이지 범위(최대 50쪽) · 모든 페이지 OCR. 우측 패널과 1280px 미만 본문 카드 공용 */
export function PdfOptions({ idPrefix, numPages, startText, endText, rangeError, forceOcr, regionPage, disabled, onStartTextChange, onEndTextChange, onForceOcrChange }: PdfOptionsProps & { idPrefix: string }) {
  const errorId = `${idPrefix}-pdf-range-error`
  const rangeDisabled = disabled || regionPage !== null
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">페이지 범위</h3>
        <span className="text-xs text-muted-foreground">전체 {numPages.toLocaleString()}쪽</span>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`${idPrefix}-pdf-start`} className="sr-only">
          시작 페이지
        </Label>
        <Input
          id={`${idPrefix}-pdf-start`}
          inputMode="numeric"
          value={startText}
          disabled={rangeDisabled}
          aria-invalid={rangeError !== null}
          aria-describedby={rangeError ? errorId : undefined}
          onChange={(e) => onStartTextChange(e.target.value)}
          className="w-20 text-center tabular-nums"
        />
        <span aria-hidden="true">~</span>
        <Label htmlFor={`${idPrefix}-pdf-end`} className="sr-only">
          끝 페이지
        </Label>
        <Input
          id={`${idPrefix}-pdf-end`}
          inputMode="numeric"
          value={endText}
          disabled={rangeDisabled}
          aria-invalid={rangeError !== null}
          aria-describedby={rangeError ? errorId : undefined}
          onChange={(e) => onEndTextChange(e.target.value)}
          className="w-20 text-center tabular-nums"
        />
        <span className="text-sm">쪽</span>
      </div>
      {regionPage !== null ? (
        <p className="text-xs text-muted-foreground">선택 영역이 있어 {regionPage}쪽의 선택 영역만 추출합니다.</p>
      ) : rangeError ? (
        <p id={errorId} className="text-xs text-red-700" role="alert">
          {rangeError}
        </p>
      ) : (
        numPages > PDF_MAX_PAGES && <p className="text-xs text-muted-foreground">한 번에 {PDF_MAX_PAGES}쪽까지 추출할 수 있습니다.</p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm">모든 페이지를 OCR로 읽기</p>
          <p className="text-xs text-muted-foreground">PDF에 들어 있는 글자가 깨져 나올 때 켜세요. 시간이 더 걸립니다.</p>
        </div>
        <Switch aria-label="모든 페이지를 OCR로 읽기" checked={forceOcr} disabled={disabled} onCheckedChange={onForceOcrChange} />
      </div>
    </section>
  )
}
