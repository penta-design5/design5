'use client'

import { Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatFileSize } from '@/lib/design-request-attachments'
import { EXPORT_FORMATS, getExportFormat, type ExportFormat } from '@/lib/toolbox/image-editor/export'
import type { EditorDoc } from '@/lib/toolbox/image-editor/types'

export interface ExportSettings {
  format: ExportFormat
  quality: number
  baseName: string
}

export interface LoadedImageInfo {
  fileName: string
  fileSize: number
  originalWidth: number
  originalHeight: number
}

interface EditorSidePanelProps {
  variant?: 'sidebar' | 'sheet'
  image: LoadedImageInfo | null
  doc: EditorDoc | null
  exportSettings: ExportSettings
  exporting: boolean
  onExportSettingsChange: (settings: ExportSettings) => void
  onExport: () => void
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-right tabular-nums">{value}</span>
    </div>
  )
}

/** 우측 옵션 패널 — P1: 이미지 정보·내보내기. 도구별 옵션은 P2~P5에서 상단에 추가 */
export function EditorSidePanel({
  variant = 'sidebar',
  image,
  doc,
  exportSettings,
  exporting,
  onExportSettingsChange,
  onExport,
}: EditorSidePanelProps) {
  const isSheet = variant === 'sheet'
  const format = getExportFormat(exportSettings.format)
  const update = (patch: Partial<ExportSettings>) => onExportSettingsChange({ ...exportSettings, ...patch })

  return (
    <div
      className={cn(
        'space-y-6 overflow-y-auto bg-background p-6',
        isSheet ? 'h-full min-h-0 w-full pt-14' : 'h-full w-[410px] border-l'
      )}
    >
      <h2 className="text-lg font-semibold">편집 옵션</h2>

      {!image || !doc ? (
        <p className="text-sm text-muted-foreground">이미지를 불러오면 옵션이 표시됩니다.</p>
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">이미지 정보</h3>
            <div className="space-y-1.5 rounded-lg border bg-card p-3">
              <InfoRow label="파일명" value={image.fileName} />
              <InfoRow label="원본 크기" value={`${image.originalWidth} × ${image.originalHeight}px`} />
              <InfoRow label="현재 크기" value={`${doc.width} × ${doc.height}px`} />
              <InfoRow label="원본 용량" value={formatFileSize(image.fileSize)} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">내보내기</h3>

            <div className="space-y-2">
              <Label htmlFor="image-editor-export-format">형식</Label>
              <Select value={exportSettings.format} onValueChange={(value) => update({ format: value as ExportFormat })}>
                <SelectTrigger id="image-editor-export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {exportSettings.format === 'jpeg' && (
                <p className="text-xs text-muted-foreground">JPG는 투명도를 지원하지 않아 투명 영역은 흰색으로 채워집니다.</p>
              )}
            </div>

            {format.lossy && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>품질</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">{Math.round(exportSettings.quality * 100)}%</span>
                </div>
                <Slider
                  value={[exportSettings.quality]}
                  min={0.5}
                  max={1}
                  step={0.01}
                  onValueChange={([value]) => update({ quality: value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="image-editor-export-name">파일명</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-editor-export-name"
                  value={exportSettings.baseName}
                  onChange={(e) => update({ baseName: e.target.value })}
                />
                <span className="shrink-0 text-sm text-muted-foreground">.{format.ext}</span>
              </div>
            </div>

            <Button type="button" className="w-full" onClick={onExport} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              다운로드
            </Button>
            <p className="text-xs text-muted-foreground">
              화면 배율과 관계없이 현재 크기({doc.width} × {doc.height}px) 그대로 저장됩니다.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
