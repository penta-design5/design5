'use client'

import { useRef } from 'react'
import { Download, ImagePlus, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/common/constants'
import type { WatermarkLogo } from '@/lib/toolbox/common/watermark'
import type { ScanWarning } from '@/lib/toolbox/qr-code/contrast'
import {
  BG_PRESETS,
  DEFAULT_QR_FILE_NAME,
  EC_LEVEL_GUIDE,
  EC_LEVEL_OPTIONS,
  FG_PRESETS,
  getQrFormat,
  LOGO_EC_LEVEL,
  LOGO_MIN_VERSION,
  LOGO_PERCENT_RANGE,
  MARGIN_RANGE,
  QR_FORMATS,
  qrFileName,
  SIZE_PRESETS,
  type EcLevel,
  type QrFormat,
  type QrSettings,
} from '@/lib/toolbox/qr-code/options'
import { QrColorField } from './QrColorField'
import { QrContentSection } from './QrContentSection'
import { QrWarnings } from './QrWarnings'

interface QrSidePanelProps {
  variant?: 'sheet' | 'sidebar'
  text: string
  settings: QrSettings
  format: QrFormat
  /** 중앙 로고(없으면 null) */
  logo: WatermarkLogo | null
  logoPercent: number
  /** 저장 크기 입력값(문자열 — 입력 중 상태 유지) */
  sizeText: string
  /** 크기 입력 오류(없으면 null) */
  sizeError: string | null
  warnings: ScanWarning[]
  baseName: string
  /** 생성 정보(생성 전이면 null) */
  info: { version: number; moduleSize: number | null } | null
  saving: boolean
  onTextChange: (text: string) => void
  onSettingsChange: (patch: Partial<QrSettings>) => void
  onLogoFile: (file: File) => void
  onLogoRemove: () => void
  onLogoPercentChange: (percent: number) => void
  onFormatChange: (format: QrFormat) => void
  onSizeTextChange: (size: string) => void
  onBaseNameChange: (name: string) => void
  onSave: () => void
}

/** 우측 옵션 패널 — 내용 · 디자인 · 오류 정정 · 스캔 안내 · 저장 (로고는 P4에서 추가) */
export function QrSidePanel({
  variant = 'sidebar',
  text,
  settings,
  format,
  logo,
  logoPercent,
  sizeText,
  sizeError,
  warnings,
  baseName,
  info,
  saving,
  onTextChange,
  onSettingsChange,
  onLogoFile,
  onLogoRemove,
  onLogoPercentChange,
  onFormatChange,
  onSizeTextChange,
  onBaseNameChange,
  onSave,
}: QrSidePanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const isSheet = variant === 'sheet'
  const hasText = text.trim().length > 0
  const formatOption = getQrFormat(format)
  const fileName = qrFileName(baseName, format)
  // 로고가 있으면 오류 정정은 H로 고정(선택값은 보존했다가 로고를 지우면 되돌린다)
  const ecLevel = logo ? LOGO_EC_LEVEL : settings.ecLevel
  const ecOption = EC_LEVEL_OPTIONS.find((o) => o.value === ecLevel) ?? EC_LEVEL_OPTIONS[1]
  const canSave = hasText && info !== null && !sizeError && !saving

  return (
    <div
      className={cn(
        'space-y-6 overflow-y-auto bg-background p-6',
        isSheet ? 'h-full min-h-0 w-full pt-14' : 'h-full w-[410px] border-l'
      )}
    >
      <h2 className="text-lg font-semibold">QR 옵션</h2>

      {/* 내용 입력: xl 이상은 이 패널, 그 미만은 본문(QrCodePage)에 있다 */}
      {!isSheet && (
        <QrContentSection idPrefix={variant} text={text} ecLevel={ecLevel} autoFocus onTextChange={onTextChange} />
      )}


      <section className="space-y-4">
        <h3 className="text-sm font-semibold">디자인</h3>
        <QrColorField label="점 색상" value={settings.fg} presets={FG_PRESETS} onChange={(fg) => onSettingsChange({ fg })} />
        <QrColorField
          label="배경 색상"
          value={settings.bg}
          presets={BG_PRESETS}
          disabled={settings.bgTransparent}
          onChange={(bg) => onSettingsChange({ bg })}
        />
        <div className="flex items-center justify-between">
          <Label>배경 투명</Label>
          <Switch
            aria-label="배경 투명"
            checked={settings.bgTransparent}
            onCheckedChange={(bgTransparent) => onSettingsChange({ bgTransparent })}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>여백</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{settings.margin}칸</span>
          </div>
          <Slider
            aria-label="여백"
            className="[@media(pointer:coarse)]:py-4"
            value={[settings.margin]}
            min={MARGIN_RANGE.min}
            max={MARGIN_RANGE.max}
            step={MARGIN_RANGE.step}
            onValueChange={([margin]) => onSettingsChange({ margin })}
          />
          <p className="text-xs text-muted-foreground">QR 둘레의 빈 칸 수입니다. 규격 권장은 4칸입니다.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">로고</h3>
        {logo ? (
          <div className="flex items-center gap-3 rounded-md border p-2">
            {/* 투명 영역이 보이도록 체크무늬 배경 */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-[conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)] bg-[length:12px_12px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.previewUrl} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm" data-testid="qr-logo-name">
                {logo.name}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {logo.width} × {logo.height}px
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => logoInputRef.current?.click()}>
              변경
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="로고 삭제" onClick={onLogoRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="w-full" onClick={() => logoInputRef.current?.click()}>
            <ImagePlus className="mr-2 h-4 w-4" />
            로고 이미지 선택
          </Button>
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept={FILE_INPUT_ACCEPT}
          className="hidden"
          aria-label="로고 이미지 파일"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) onLogoFile(file)
          }}
        />
        {logo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>로고 크기</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{logoPercent}%</span>
            </div>
            <Slider
              aria-label="로고 크기"
              className="[@media(pointer:coarse)]:py-4"
              value={[logoPercent]}
              min={LOGO_PERCENT_RANGE.min}
              max={LOGO_PERCENT_RANGE.max}
              step={LOGO_PERCENT_RANGE.step}
              onValueChange={([v]) => onLogoPercentChange(v)}
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          QR 가운데에 로고를 넣습니다. 배경이 투명한 PNG를 권장합니다. 로고는 저장되지 않아 페이지를 새로 열면 다시 선택해야 합니다.
          {logo && format === 'svg' ? ' SVG에는 로고가 이미지로 포함됩니다.' : ''}
        </p>
        {logo && (
          <p className="text-xs text-muted-foreground">
            로고가 가리는 점을 복원할 수 있도록 훼손 복원력이 「최고 (H)」로 고정되고, QR이 조금 더 촘촘해질 수 있습니다(최소 버전 {LOGO_MIN_VERSION}). 점이 적은 작은 QR에서는 읽기 쉽도록 로고가 자동으로 조금 작아질 수 있습니다.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">훼손 복원력 (오류 정정)</h3>
        <p className="text-xs text-muted-foreground">{EC_LEVEL_GUIDE}</p>
        <Label htmlFor={`${variant}-qr-ec`} className="sr-only">
          훼손 복원력(오류 정정) 수준
        </Label>
        <Select value={ecLevel} disabled={Boolean(logo)} onValueChange={(v) => onSettingsChange({ ecLevel: v as EcLevel })}>
          <SelectTrigger id={`${variant}-qr-ec`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EC_LEVEL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-foreground">{logo ? '로고를 넣어 「최고 (H)」로 고정되었습니다. 로고를 삭제하면 선택한 값으로 돌아갑니다.' : ecOption.hint}</p>
      </section>

      <QrWarnings warnings={warnings} />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">저장</h3>
        <div className="space-y-2">
          <Label htmlFor={`${variant}-qr-format`}>형식</Label>
          <Select value={format} onValueChange={(v) => onFormatChange(v as QrFormat)}>
            <SelectTrigger id={`${variant}-qr-format`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QR_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{formatOption.hint}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${variant}-qr-size`}>크기 (px, 한 변)</Label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="크기 프리셋">
            {SIZE_PRESETS.map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs tabular-nums [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:px-4"
                aria-pressed={sizeText === String(n)}
                onClick={() => onSizeTextChange(String(n))}
              >
                {n}
              </Button>
            ))}
          </div>
          <Input
            id={`${variant}-qr-size`}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={sizeText}
            aria-invalid={sizeError ? true : undefined}
            onChange={(e) => onSizeTextChange(e.target.value)}
          />
          {sizeError ? (
            <p className="text-xs text-destructive" role="alert">
              {sizeError}
            </p>
          ) : (
            info && (
              <p className="text-xs text-muted-foreground tabular-nums">
                버전 {info.version}
                {info.moduleSize !== null ? ` · 점 1칸 ${info.moduleSize}px` : ''}
              </p>
            )
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${variant}-qr-name`}>파일명</Label>
          <Input id={`${variant}-qr-name`} value={baseName} placeholder={DEFAULT_QR_FILE_NAME} onChange={(e) => onBaseNameChange(e.target.value)} />
          <p className="break-all text-xs text-muted-foreground">
            {fileName} · {formatOption.ext.toUpperCase()}
            {settings.bgTransparent ? ' · 투명 배경' : ''}
          </p>
        </div>
        <Button type="button" className="w-full" onClick={onSave} disabled={!canSave}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {formatOption.ext.toUpperCase()}로 저장
        </Button>
      </section>
    </div>
  )
}
