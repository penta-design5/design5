'use client'

import { Loader2, PackageOpen, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { formatFileSize } from '@/lib/design-request-attachments'
import type { Size } from '@/lib/toolbox/common/canvas'
import { EXPORT_FORMATS, getExportFormat, sanitizeFileName, type ExportFormat } from '@/lib/toolbox/common/export'
import {
  MIN_PIECE_PX,
  PIECE_COUNTS,
  SPLIT_ORDER_OPTIONS,
  edgesOf,
  isEqualLines,
  pieceFileName,
  type PieceCount,
  type SplitLines,
  type SplitOrder,
} from '@/lib/toolbox/image-splitter/grid'
import { SplitSizeSection } from './SplitSizeSection'

export interface SplitImageInfo {
  fileName: string
  fileSize: number
  /** 현재(분할할) 크기 */
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}

/** 저장 형식 선택지 라벨 — 참고 화면 기준 */
const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: 'PNG · 투명 유지',
  jpeg: 'JPG · 투명 → 흰색',
  webp: 'WebP',
}

interface SplitSidePanelProps {
  variant?: 'sidebar' | 'sheet'
  image: SplitImageInfo | null
  count: PieceCount
  order: SplitOrder
  lines: SplitLines
  baseName: string
  format: ExportFormat
  quality: number
  saving: boolean
  resizing: boolean
  onResize: (size: Size) => void
  onFormatChange: (format: ExportFormat) => void
  onQualityChange: (quality: number) => void
  onCountChange: (count: PieceCount) => void
  onOrderChange: (order: SplitOrder) => void
  onLineChange: (axis: keyof SplitLines, index: number, fraction: number) => void
  onResetLines: () => void
  onBaseNameChange: (name: string) => void
  onSave: () => void
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-right tabular-nums">{value}</span>
    </div>
  )
}

/**
 * 우측 옵션 패널 — 이미지 크기 · 이미지 분할 · 이미지 정보 · 저장 (데스크톱 패널과 모바일·태블릿 Sheet 공용).
 * 순서는 이미지 편집(편집 도구 → 이미지 정보 → 내보내기)과 같다. 새 이미지 열기는 미리보기 오른쪽 위 버튼.
 */
export function SplitSidePanel({
  variant = 'sidebar',
  image,
  count,
  order,
  lines,
  baseName,
  format,
  quality,
  saving,
  resizing,
  onResize,
  onFormatChange,
  onQualityChange,
  onCountChange,
  onOrderChange,
  onLineChange,
  onResetLines,
  onBaseNameChange,
  onSave,
}: SplitSidePanelProps) {
  const isSheet = variant === 'sheet'
  const orderOption = SPLIT_ORDER_OPTIONS.find((o) => o.value === order) ?? SPLIT_ORDER_OPTIONS[0]
  const safeBase = sanitizeFileName(baseName)
  const { ext, lossy } = getExportFormat(format)
  const size = image ? { width: image.width, height: image.height } : null
  const linesEqual = size ? isEqualLines(lines, count, size) : true

  // 선별 슬라이더 — 표시 px = 실제 저장 경계(edgesOf)와 동일
  const lineSliders = size
    ? [
        ...edgesOf(lines.xs, size.width)
          .slice(1, -1)
          .map((px, index) => ({ axis: 'xs' as const, index, px, length: size.width, label: `세로선 ${index + 1}`, coord: 'X' })),
        ...edgesOf(lines.ys, size.height)
          .slice(1, -1)
          .map((px, index) => ({ axis: 'ys' as const, index, px, length: size.height, label: `가로선 ${index + 1}`, coord: 'Y' })),
      ].map((s) => ({ ...s, key: `${s.axis}${s.index}` }))
    : []

  return (
    <div
      className={cn(
        'space-y-6 overflow-y-auto bg-background p-6',
        isSheet ? 'h-full min-h-0 w-full pt-14' : 'h-full w-[410px] border-l'
      )}
    >
      <h2 className="text-lg font-semibold">편집 옵션</h2>

      {!image ? (
        <p className="text-sm text-muted-foreground">이미지를 불러오면 옵션이 표시됩니다.</p>
      ) : (
        <>
          <SplitSizeSection
            idPrefix={variant}
            original={{ width: image.originalWidth, height: image.originalHeight }}
            current={{ width: image.width, height: image.height }}
            busy={resizing}
            onApply={onResize}
          />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">이미지 분할</h3>
            <div className="space-y-2">
              <Label htmlFor={`${variant}-split-count`}>조각 수</Label>
              <Select value={String(count)} onValueChange={(v) => onCountChange(Number(v) as PieceCount)}>
                <SelectTrigger id={`${variant}-split-count`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIECE_COUNTS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}분할
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${variant}-split-order`}>배치</Label>
              <Select value={order} onValueChange={(v) => onOrderChange(v as SplitOrder)}>
                <SelectTrigger id={`${variant}-split-order`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPLIT_ORDER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{orderOption.hint}</p>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={onResetLines} disabled={linesEqual}>
              <RotateCcw className="mr-2 h-4 w-4" />
              균등 분할로 초기화
            </Button>
            <div className="space-y-4">
              {lineSliders.map((s) => (
                <div key={s.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.coord} {s.px}px
                    </span>
                  </div>
                  <Slider
                    aria-label={`${s.label} 위치`}
                    value={[s.px]}
                    min={0}
                    max={s.length}
                    step={1}
                    onValueChange={([value]) => onLineChange(s.axis, s.index, value / s.length)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              분할선을 드래그하거나 선 위치 슬라이더로 조각 크기를 조절하세요. 조각은 최소 {MIN_PIECE_PX}px입니다. 미리보기는 휠(또는 두 손가락)로 확대/축소하고, 빈 곳을 끌어 옮길 수 있습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">이미지 정보</h3>
            <div className="space-y-1.5 rounded-lg border bg-card p-3">
              <InfoRow label="파일명" value={image.fileName} />
              <InfoRow label="원본 크기" value={`${image.originalWidth} × ${image.originalHeight}px`} />
              <InfoRow label="현재 크기" value={`${image.width} × ${image.height}px`} />
              <InfoRow label="원본 용량" value={formatFileSize(image.fileSize)} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">저장</h3>
            <div className="space-y-2">
              <Label htmlFor={`${variant}-split-format`}>저장 형식</Label>
              <Select value={format} onValueChange={(v) => onFormatChange(v as ExportFormat)}>
                <SelectTrigger id={`${variant}-split-format`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {FORMAT_LABELS[f.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {lossy && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>품질</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">{Math.round(quality * 100)}%</span>
                </div>
                <Slider
                  aria-label="저장 품질"
                  value={[quality]}
                  min={0.5}
                  max={1}
                  step={0.01}
                  onValueChange={([value]) => onQualityChange(value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`${variant}-split-name`}>파일명</Label>
              <Input
                id={`${variant}-split-name`}
                value={baseName}
                onChange={(e) => onBaseNameChange(e.target.value)}
              />
              <p className="break-all text-xs text-muted-foreground">
                {pieceFileName(safeBase, 1, count, ext)} ~ {pieceFileName(safeBase, count, count, ext)} · {safeBase}_split.zip
              </p>
            </div>
            <Button type="button" className="w-full" onClick={onSave} disabled={saving || resizing}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageOpen className="mr-2 h-4 w-4" />}
              ZIP으로 저장 ({count}조각)
            </Button>
            <p className="text-xs text-muted-foreground">
              번호·분할선은 저장되지 않습니다. JPG의 투명 영역은 흰색으로 저장합니다. GIF는 정지 이미지로 분할합니다.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
