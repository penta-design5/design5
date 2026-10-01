'use client'

import { Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { formatFileSize } from '@/lib/design-request-attachments'
import { EXPORT_FORMATS, getExportFormat, sanitizeFileName, type ExportFormat } from '@/lib/toolbox/common/export'
import type { BackgroundSettings } from '@/lib/toolbox/background-editor/compose'
import { MODEL } from '@/lib/toolbox/background-editor/model'
import type { InferenceBackend } from '@/lib/toolbox/background-editor/protocol'
import type { EdgeSettings } from '@/lib/toolbox/background-editor/refine'
import { BgBackgroundSection } from './BgBackgroundSection'
import { BgEdgeSection } from './BgEdgeSection'
import { BgManualSection, type BgManualSectionProps } from './BgManualSection'
import { RemoveBackgroundButton, type RemoveButtonState } from './RemoveBackgroundButton'
import type { ModelStatus, RemovalStatus } from './use-background-removal'

export interface BgImageInfo {
  fileName: string
  fileSize: number
  width: number
  height: number
}

export const BACKEND_LABELS: Record<InferenceBackend, string> = {
  webgpu: '그래픽 가속(WebGPU)',
  wasm: 'CPU',
}

interface BgSidePanelProps {
  variant?: 'sidebar' | 'sheet'
  image: BgImageInfo | null
  model: ModelStatus
  removal: RemovalStatus
  hasResult: boolean
  removeState: RemoveButtonState
  background: BackgroundSettings
  format: ExportFormat
  quality: number
  baseName: string
  saving: boolean
  onRemove: () => void
  onBackgroundChange: (patch: Partial<BackgroundSettings>) => void
  onPickBackgroundImage: (file: File) => void
  onFormatChange: (format: ExportFormat) => void
  onQualityChange: (quality: number) => void
  edge: EdgeSettings
  onEdgeChange: (patch: Partial<EdgeSettings>) => void
  /** 수동 보정 설정 */
  manual: Omit<BgManualSectionProps, 'enabled'>
  onBaseNameChange: (name: string) => void
  onSave: () => void
}

/** 저장 형식 라벨 — 이미지 분할과 같은 표기 */
const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: 'PNG · 투명 유지',
  jpeg: 'JPG · 투명 → 흰색',
  webp: 'WebP',
}

const MODEL_NOTE = `처음 사용할 때 AI 모델(약 ${(MODEL.bytes / 1_000_000).toFixed(1)}MB)을 내려받습니다. 이후에는 저장된 모델을 사용합니다.`

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-right tabular-nums">{value}</span>
    </div>
  )
}

function modelLabel(model: ModelStatus): string {
  switch (model.kind) {
    case 'idle':
      return '준비 전'
    case 'downloading':
      return '내려받는 중'
    case 'verifying':
    case 'preparing':
      return '준비 중'
    case 'ready':
      return model.fromCache ? '저장된 모델 사용' : `내려받음(${(MODEL.bytes / 1_000_000).toFixed(1)}MB)`
    case 'canceled':
      return '내려받기 취소'
    case 'error':
      return '오류'
  }
}

/**
 * 우측 옵션 패널 — 배경 제거(실행 버튼) · 배경(교체) · 경계 다듬기 · 수동 보정 · 처리 정보 · 이미지 정보 · 저장(형식·품질) (데스크톱 패널과 모바일·태블릿 Sheet 공용).
 */
export function BgSidePanel({
  variant = 'sidebar',
  image,
  model,
  removal,
  hasResult,
  removeState,
  background,
  format,
  quality,
  baseName,
  saving,
  onRemove,
  onBackgroundChange,
  onPickBackgroundImage,
  onFormatChange,
  onQualityChange,
  edge,
  onEdgeChange,
  manual,
  onBaseNameChange,
  onSave,
}: BgSidePanelProps) {
  const isSheet = variant === 'sheet'
  const safeBase = sanitizeFileName(baseName)
  const { ext, lossy, label } = getExportFormat(format)
  // 단색·이미지(꽉 채우기) 배경이면 투명한 부분이 없다 — JPG 흰색 안내 생략
  const opaque = background.kind === 'color' || (background.kind === 'image' && background.image !== null && background.fit === 'cover')
  const backend = removal.kind === 'done' ? removal.backend : model.kind === 'ready' ? model.backend : null

  return (
    <div
      className={cn(
        'space-y-6 overflow-y-auto bg-background p-6',
        isSheet ? 'h-full min-h-0 w-full pt-14' : 'h-full w-[410px] border-l'
      )}
    >
      <h2 className="text-lg font-semibold">편집 옵션</h2>

      {!image ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>이미지를 불러온 뒤 「배경 제거」를 누르세요.</p>
          <p>{MODEL_NOTE}</p>
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">배경 제거</h3>
            <RemoveBackgroundButton state={removeState} onClick={onRemove} />
            {model.kind !== 'ready' && <p className="text-xs text-muted-foreground">{MODEL_NOTE}</p>}
          </section>

          <BgBackgroundSection
            idPrefix={variant}
            enabled={hasResult}
            background={background}
            onChange={onBackgroundChange}
            onPickImage={onPickBackgroundImage}
          />

          <BgEdgeSection enabled={hasResult} edge={edge} onChange={onEdgeChange} />

          <BgManualSection enabled={hasResult} {...manual} />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">처리 정보</h3>
            <div className="space-y-1.5 rounded-lg border bg-card p-3" data-testid="bg-process-info">
              <InfoRow label="AI 모델" value={modelLabel(model)} />
              <InfoRow label="실행 방식" value={backend ? BACKEND_LABELS[backend] : '-'} />
              <InfoRow label="처리 시간" value={removal.kind === 'done' ? `${(removal.ms / 1000).toFixed(2)}초` : '-'} />
            </div>
            {backend === 'wasm' && (
              <p className="text-xs text-muted-foreground">
                이 PC는 그래픽 가속(WebGPU)을 사용할 수 없어 CPU로 처리합니다. 처리에 시간이 더 걸릴 수 있습니다.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">이미지 정보</h3>
            <div className="space-y-1.5 rounded-lg border bg-card p-3">
              <InfoRow label="파일명" value={image.fileName} />
              <InfoRow label="크기" value={`${image.width} × ${image.height}px`} />
              <InfoRow label="원본 용량" value={formatFileSize(image.fileSize)} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">저장</h3>
            <div className="space-y-2">
              <Label htmlFor={`${variant}-bg-format`}>저장 형식</Label>
              <Select value={format} onValueChange={(v) => onFormatChange(v as ExportFormat)}>
                <SelectTrigger id={`${variant}-bg-format`} data-testid="bg-format">
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
              <Label htmlFor={`${variant}-bg-name`}>파일명</Label>
              <Input id={`${variant}-bg-name`} value={baseName} onChange={(e) => onBaseNameChange(e.target.value)} />
              <p className="break-all text-xs text-muted-foreground">
                {safeBase}.{ext}
              </p>
            </div>
            <Button type="button" className="w-full" onClick={onSave} disabled={!hasResult || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {label}로 저장
            </Button>
            <p className="text-xs text-muted-foreground">
              원본과 같은 크기로 저장합니다.
              {format === 'jpeg' && !opaque && ' JPG는 투명을 지원하지 않아 투명한 부분을 흰색으로 저장합니다.'}
            </p>
          </section>

          <section className="space-y-1.5 text-xs text-muted-foreground">
            <p>이미지는 서버로 전송되지 않고 브라우저에서 처리됩니다.</p>
            <p>경계가 복잡한 이미지(머리카락·털·투명한 물체)는 결과가 완벽하지 않을 수 있습니다.</p>
          </section>
        </>
      )}
    </div>
  )
}
