'use client'

import { useState } from 'react'
import { ChevronDown, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { formatFileSize } from '@/lib/design-request-attachments'
import type { WatermarkLogo, WatermarkSettings } from '@/lib/toolbox/common/watermark'
import { WatermarkPanel } from '@/components/toolbox/common/WatermarkPanel'
import { MosaicFaceSection, type MosaicFaceSectionProps } from './MosaicFaceSection'
import { MosaicPlateSection, type MosaicPlateSectionProps } from './MosaicPlateSection'
import { NumberField } from './MosaicNumberField'
import { EXPORT_FORMATS, getExportFormat, sanitizeFileName, type ExportFormat } from '@/lib/toolbox/common/export'
import type { RectField } from '@/lib/toolbox/mosaic/regions'
import { STRENGTH_MAX, STRENGTH_MIN, blurRadiusFor, cellSizeFor, type Region, type RegionSettings } from '@/lib/toolbox/mosaic/types'

export interface MosaicImageInfo {
  fileName: string
  fileSize: number
  width: number
  height: number
}

/** 저장 형식 선택지 라벨 — 이미지 분할과 같은 표기 */
const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: 'PNG · 투명 유지',
  jpeg: 'JPG · 투명 → 흰색',
  webp: 'WebP',
}

/** 영역 작업 — whole: 이미지 전체에 적용 / regions: 지정한 영역에만 적용 */
export type MosaicScope = 'whole' | 'regions'

const SCOPE_OPTIONS: { value: MosaicScope; label: string }[] = [
  { value: 'whole', label: '이미지 전체' },
  { value: 'regions', label: '영역 지정' },
]

interface MosaicSidePanelProps {
  variant?: 'sidebar' | 'sheet'
  image: MosaicImageInfo | null
  regionCount: number
  /** 저장할 수 있는 상태인지 — 영역이 있거나 워터마크가 켜져 있을 때 */
  canSave: boolean
  /** 「영역 지정」에서 선택된 영역(없으면 null — 좌표 입력은 비활성) */
  selected: Region | null
  /** 지금 속성 컨트롤이 바꾸는 설정 — 「이미지 전체」는 전체 영역, 「영역 지정」은 선택 영역(없으면 새 영역 기본값) */
  active: RegionSettings
  /** active가 무엇의 설정인지: 이미지 전체 / 선택 영역 / 새 영역 기본값 */
  activeTarget: 'whole' | 'selected' | 'defaults'
  scope: MosaicScope
  baseName: string
  format: ExportFormat
  quality: number
  saving: boolean
  onScopeChange: (scope: MosaicScope) => void
  onRectFieldChange: (field: RectField, value: number) => void
  /** 선택 영역이 있으면 그 영역을, 없으면 새 영역 기본값을 바꾼다 */
  onSettingsChange: (patch: Partial<RegionSettings>) => void
  /** 강도 슬라이더를 놓았을 때(연속 변경을 되돌리기 1단계로 묶는 기준) */
  onSettingsCommit: () => void
  onFormatChange: (format: ExportFormat) => void
  onQualityChange: (quality: number) => void
  onBaseNameChange: (name: string) => void
  onSave: () => void
  face: Omit<MosaicFaceSectionProps, 'idPrefix'>
  plate: Omit<MosaicPlateSectionProps, 'idPrefix'>
  watermark: WatermarkSettings
  watermarkLogo: WatermarkLogo | null
  onWatermarkChange: (patch: Partial<WatermarkSettings>) => void
  onWatermarkLogoFile: (file: File) => void
  onWatermarkLogoRemove: () => void
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
 * 우측 속성 패널 — 영역 작업 · 모자이크 강도 · 세부 위치·크기(접힘) · 이미지 정보 · 저장 (데스크톱 패널과 모바일·태블릿 Sheet 공용).
 * 되돌리기·모양·패턴·영역 삭제·새 이미지 열기는 캔버스 위 툴바(MosaicToolbar), 확대/축소는 캔버스 오른쪽 아래 줌 컨트롤에 있다.
 */
export function MosaicSidePanel({
  variant = 'sidebar',
  image,
  regionCount,
  canSave,
  selected,
  active,
  activeTarget,
  scope,
  baseName,
  format,
  quality,
  saving,
  onScopeChange,
  onRectFieldChange,
  onSettingsChange,
  onSettingsCommit,
  onFormatChange,
  onQualityChange,
  onBaseNameChange,
  onSave,
  face,
  plate,
  watermark,
  watermarkLogo,
  onWatermarkChange,
  onWatermarkLogoFile,
  onWatermarkLogoRemove,
}: MosaicSidePanelProps) {
  const isSheet = variant === 'sheet'
  const [detailOpen, setDetailOpen] = useState(false)
  const { ext, lossy } = getExportFormat(format)
  const safeBase = sanitizeFileName(baseName)
  // 거친 픽셀은 셀 크기, 부드러운 블러는 번지는 반경을 환산값으로 보여 준다
  const sizeHint = image
    ? active.pattern === 'blur'
      ? `반경 약 ${blurRadiusFor(active.strength, image.width, image.height)}px`
      : `셀 약 ${cellSizeFor(active.strength, image.width, image.height)}px`
    : null
  const isWhole = scope === 'whole'
  const strengthLabel =
    activeTarget === 'defaults'
      ? `새 영역 · 강도 ${active.strength}`
      : `${activeTarget === 'whole' ? '이미지 전체' : '선택 영역'} · 강도 ${active.strength}${sizeHint ? ` · ${sizeHint}` : ''}`

  return (
    <div
      className={cn(
        'space-y-6 overflow-y-auto bg-background p-6',
        isSheet ? 'h-full min-h-0 w-full pt-14' : 'h-full w-[410px] border-l'
      )}
    >
      <h2 className="text-lg font-semibold">모자이크 편집</h2>

      {!image ? (
        <p className="text-sm text-muted-foreground">이미지를 불러오면 옵션이 표시됩니다.</p>
      ) : (
        <>
          <section className="space-y-4">
            <div className="space-y-2">
              <Label id={`${variant}-mosaic-scope-label`}>영역 작업</Label>
              {/* 탭처럼 두 항목을 한눈에 — 이미지 전체를 고르면 지정해 둔 영역은 지워진다(되돌리기로 복구) */}
              <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1" role="radiogroup" aria-labelledby={`${variant}-mosaic-scope-label`}>
                {SCOPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={scope === o.value}
                    data-scope={o.value}
                    onClick={(e) => {
                      onScopeChange(o.value)
                      // 마우스로 눌렀다면 포커스를 풀어, 이어서 캔버스에서 Space로 화면을 옮기거나 단축키를 써도 이 버튼이 반응하지 않게 한다
                      if (e.detail > 0) e.currentTarget.blur()
                    }}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      scope === o.value ? 'bg-[var(--penta-indigo)] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>모자이크 강도</Label>
              <Slider
                aria-label="모자이크 강도"
                value={[active.strength]}
                min={STRENGTH_MIN}
                max={STRENGTH_MAX}
                step={1}
                onValueChange={([value]) => onSettingsChange({ strength: value })}
                onValueCommit={onSettingsCommit}
              />
              <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
                {strengthLabel}
              </p>
            </div>

            {/* 세부 위치·크기 — 대부분 끌어서 조절하므로 기본은 접어 둔다(입력칸은 접어도 유지되어 값은 그대로) */}
            {/* 「이미지 전체」에서는 숨긴다(입력칸은 유지) */}
            <div className={cn('space-y-3', isWhole && 'hidden')}>
                <button
                  type="button"
                  aria-expanded={detailOpen}
                  aria-controls={`${variant}-mosaic-detail`}
                  data-testid="mosaic-detail-toggle"
                  onClick={(e) => {
                    setDetailOpen((v) => !v)
                    if (e.detail > 0) e.currentTarget.blur()
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>세부 위치·크기</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-xs font-normal tabular-nums text-muted-foreground">
                    {!detailOpen && (
                      <span className="truncate">
                        {selected ? `X ${selected.x} · Y ${selected.y} · ${selected.width}×${selected.height}` : '영역을 선택하면 표시'}
                      </span>
                    )}
                    <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', detailOpen && 'rotate-180')} />
                  </span>
                </button>
                <div id={`${variant}-mosaic-detail`} className={detailOpen ? 'grid grid-cols-2 gap-3' : 'hidden'}>
                  <NumberField id={`${variant}-mosaic-x`} label="위치 X" value={selected?.x ?? null} disabled={!selected} onCommit={(v) => onRectFieldChange('x', v)} />
                  <NumberField id={`${variant}-mosaic-y`} label="위치 Y" value={selected?.y ?? null} disabled={!selected} onCommit={(v) => onRectFieldChange('y', v)} />
                  <NumberField id={`${variant}-mosaic-w`} label="영역 너비" value={selected?.width ?? null} disabled={!selected} onCommit={(v) => onRectFieldChange('width', v)} />
                  <NumberField id={`${variant}-mosaic-h`} label="영역 높이" value={selected?.height ?? null} disabled={!selected} onCommit={(v) => onRectFieldChange('height', v)} />
                </div>
              </div>

            <p className="text-xs text-muted-foreground">
              {isWhole
                ? '이미지 전체에 모자이크가 적용됩니다. 특정 부분만 가리려면 「영역 지정」을 선택하세요(지정한 영역은 지워지며 되돌리기로 복구할 수 있습니다).'
                : '이미지의 빈 곳을 끌어 가릴 영역을 지정하세요. 모양·패턴은 위 툴바에서 고르고, 영역을 선택하지 않으면 새 영역의 기본값이 바뀝니다. 단축키는 툴바의 키보드 아이콘(?)에서 볼 수 있습니다.'}
            </p>
          </section>

          <MosaicFaceSection idPrefix={`${variant}-mosaic`} {...face} />

          <MosaicPlateSection idPrefix={`${variant}-mosaic`} {...plate} />

          {/* 워터마크 — 이미지 편집과 같은 패널·설정(공용). 꺼 두면 한 줄만 차지한다 */}
          <WatermarkPanel
            idPrefix={`${variant}-mosaic`}
            settings={watermark}
            logo={watermarkLogo}
            onChange={onWatermarkChange}
            onLogoFile={onWatermarkLogoFile}
            onLogoRemove={onWatermarkLogoRemove}
          />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">이미지 정보</h3>
            <div className="space-y-1.5 rounded-lg border bg-card p-3">
              <InfoRow label="파일명" value={image.fileName} />
              <InfoRow label="이미지 크기" value={`${image.width} × ${image.height}px`} />
              <InfoRow label="원본 용량" value={formatFileSize(image.fileSize)} />
              <InfoRow label="영역 수" value={isWhole ? '이미지 전체' : `${regionCount}개`} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">저장</h3>
            <div className="space-y-2">
              <Label htmlFor={`${variant}-mosaic-format`}>저장 형식</Label>
              <Select value={format} onValueChange={(v) => onFormatChange(v as ExportFormat)}>
                <SelectTrigger id={`${variant}-mosaic-format`}>
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
                <Slider aria-label="저장 품질" value={[quality]} min={0.5} max={1} step={0.01} onValueChange={([value]) => onQualityChange(value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`${variant}-mosaic-name`}>파일명</Label>
              <Input id={`${variant}-mosaic-name`} value={baseName} onChange={(e) => onBaseNameChange(e.target.value)} />
              <p className="break-all text-xs text-muted-foreground">
                {safeBase}.{ext}
              </p>
            </div>
            <Button type="button" className="w-full" onClick={onSave} disabled={saving || !canSave}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              저장
            </Button>
            <p className="text-xs text-muted-foreground">
              {!canSave ? '모자이크 영역을 하나 이상 지정하거나 워터마크를 켜면 저장할 수 있습니다. ' : ''}
              영역 윤곽은 저장되지 않으며, 가린 부분은 저장한 파일에서 원본으로 복원할 수 없습니다. JPG의 투명 영역은 흰색으로 저장합니다. GIF는 정지 이미지로 처리합니다.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
