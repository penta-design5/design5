'use client'

import { FolderOpen, Loader2, PackageOpen, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { formatFileSize } from '@/lib/design-request-attachments'
import { sanitizeFileName } from '@/lib/toolbox/common/export'
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

export interface SplitImageInfo {
  fileName: string
  fileSize: number
  width: number
  height: number
}

interface SplitSidePanelProps {
  variant?: 'sidebar' | 'sheet'
  image: SplitImageInfo | null
  count: PieceCount
  order: SplitOrder
  lines: SplitLines
  baseName: string
  saving: boolean
  onCountChange: (count: PieceCount) => void
  onOrderChange: (order: SplitOrder) => void
  onLineChange: (axis: keyof SplitLines, index: number, fraction: number) => void
  onResetLines: () => void
  onBaseNameChange: (name: string) => void
  onSave: () => void
  onOpenNew: () => void
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-right tabular-nums">{value}</span>
    </div>
  )
}

/** 우측 옵션 패널 — 사진 분할 · 저장 · 이미지 정보 (데스크톱 패널과 모바일·태블릿 Sheet 공용) */
export function SplitSidePanel({
  variant = 'sidebar',
  image,
  count,
  order,
  lines,
  baseName,
  saving,
  onCountChange,
  onOrderChange,
  onLineChange,
  onResetLines,
  onBaseNameChange,
  onSave,
  onOpenNew,
}: SplitSidePanelProps) {
  const isSheet = variant === 'sheet'
  const orderOption = SPLIT_ORDER_OPTIONS.find((o) => o.value === order) ?? SPLIT_ORDER_OPTIONS[0]
  const safeBase = sanitizeFileName(baseName)
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
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">사진 분할</h3>
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
              분할선을 드래그하거나 선 위치 슬라이더로 조각 크기를 조절하세요. 조각은 최소 {MIN_PIECE_PX}px입니다.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">저장</h3>
            <div className="space-y-1.5 rounded-lg border bg-card p-3">
              <InfoRow label="저장 형식" value="PNG · 투명 유지" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${variant}-split-name`}>파일명</Label>
              <Input
                id={`${variant}-split-name`}
                value={baseName}
                onChange={(e) => onBaseNameChange(e.target.value)}
              />
              <p className="break-all text-xs text-muted-foreground">
                {pieceFileName(safeBase, 1, count, 'png')} ~ {pieceFileName(safeBase, count, count, 'png')} · {safeBase}_split.zip
              </p>
            </div>
            <Button type="button" className="w-full" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageOpen className="mr-2 h-4 w-4" />}
              ZIP으로 저장 ({count}조각)
            </Button>
            <p className="text-xs text-muted-foreground">번호·분할선은 저장되지 않습니다. GIF는 첫 프레임(정지 이미지)으로 분할합니다.</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">이미지 정보</h3>
            <div className="space-y-1.5 rounded-lg border bg-card p-3">
              <InfoRow label="파일명" value={image.fileName} />
              <InfoRow label="크기" value={`${image.width} × ${image.height}px`} />
              <InfoRow label="용량" value={formatFileSize(image.fileSize)} />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={onOpenNew}>
              <FolderOpen className="mr-2 h-4 w-4" />
              다른 이미지 열기
            </Button>
          </section>
        </>
      )}
    </div>
  )
}
