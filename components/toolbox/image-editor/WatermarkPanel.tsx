'use client'

import { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/image-editor/constants'
import { TEXT_FONT_STACKS } from '@/lib/toolbox/image-editor/annotation-render'
import { COLOR_PRESETS, TEXT_FONTS } from '@/lib/toolbox/image-editor/annotations'
import {
  WATERMARK_LIMITS,
  WATERMARK_POSITIONS,
  WATERMARK_POSITION_LABELS,
  type WatermarkKind,
  type WatermarkLayout,
  type WatermarkLogo,
  type WatermarkSettings,
} from '@/lib/toolbox/image-editor/watermark'

interface WatermarkPanelProps {
  settings: WatermarkSettings
  logo: WatermarkLogo | null
  onChange: (patch: Partial<WatermarkSettings>) => void
  onLogoFile: (file: File) => void
  onLogoRemove: () => void
}

const KIND_OPTIONS: { value: WatermarkKind; label: string }[] = [
  { value: 'text', label: '텍스트' },
  { value: 'image', label: '로고 이미지' },
]

const LAYOUT_OPTIONS: { value: WatermarkLayout; label: string }[] = [
  { value: 'single', label: '위치 지정' },
  { value: 'tile', label: '타일(반복)' },
]

const pressed = 'border-[var(--penta-indigo)] text-[var(--penta-indigo)]'

function RangeField({
  label,
  value,
  display,
  limit,
  onChange,
}: {
  label: string
  value: number
  display: string
  limit: { min: number; max: number; step: number }
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{display}</span>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={limit.min}
        max={limit.max}
        step={limit.step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

/**
 * 워터마크 설정 — 설정값 기반 레이어라 실행취소 대상이 아니며, 다운로드 시 현재 크기에 맞춰 합성된다.
 * 텍스트 설정은 localStorage에 저장(로고·켜짐 상태 제외).
 */
export function WatermarkPanel({ settings, logo, onChange, onLogoFile, onLogoRemove }: WatermarkPanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const isText = settings.kind === 'text'
  const L = WATERMARK_LIMITS

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">워터마크</h3>
        <Switch
          aria-label="워터마크 사용"
          checked={settings.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
        />
      </div>

      {!settings.enabled ? (
        <p className="text-xs text-muted-foreground">켜면 텍스트나 로고를 이미지에 반복하거나 원하는 위치에 넣을 수 있습니다.</p>
      ) : (
        <div className="space-y-4 rounded-lg border bg-card p-3">
          <div className="grid grid-cols-2 gap-2">
            {KIND_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={settings.kind === option.value}
                className={cn('h-8', settings.kind === option.value && pressed)}
                onClick={() => onChange({ kind: option.value })}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {isText ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="image-editor-watermark-text">문구</Label>
                <Input
                  id="image-editor-watermark-text"
                  value={settings.text}
                  maxLength={200}
                  placeholder="워터마크 문구"
                  onChange={(e) => onChange({ text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>글꼴</Label>
                <div className="grid grid-cols-4 gap-2">
                  {TEXT_FONTS.map((font) => (
                    <Button
                      key={font.value}
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`워터마크 글꼴 ${font.label}`}
                      aria-pressed={settings.font === font.value}
                      className={cn('h-8 text-sm', settings.font === font.value && pressed)}
                      style={{ fontFamily: TEXT_FONT_STACKS[font.value] }}
                      onClick={() => onChange({ font: font.value })}
                    >
                      {font.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>색상</Label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`워터마크 색상 ${color}`}
                      aria-pressed={settings.color === color}
                      onClick={() => onChange({ color })}
                      className={cn(
                        'h-6 w-6 rounded-full border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        settings.color === color && 'ring-2 ring-[var(--penta-indigo)] ring-offset-1'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label="워터마크 색상 직접 선택"
                    className="h-6 w-8 cursor-pointer rounded border bg-transparent p-0"
                    value={settings.color}
                    onChange={(e) => onChange({ color: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>굵게</Label>
                <Switch aria-label="워터마크 굵게" checked={settings.bold} onCheckedChange={(bold) => onChange({ bold })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>테두리</Label>
                <Switch
                  aria-label="워터마크 테두리"
                  checked={settings.outline}
                  onCheckedChange={(outline) => onChange({ outline })}
                />
              </div>
              <RangeField
                label="크기"
                value={settings.textSize}
                display={`${settings.textSize}%`}
                limit={L.textSize}
                onChange={(textSize) => onChange({ textSize })}
              />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>로고</Label>
                {logo ? (
                  <div className="flex items-center gap-3 rounded-md border p-2">
                    {/* 투명 영역이 보이도록 체크무늬 배경 */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-[conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)] bg-[length:12px_12px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo.previewUrl} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{logo.name}</p>
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
                <p className="text-xs text-muted-foreground">
                  배경이 투명한 PNG를 권장합니다(투명도 유지). 로고는 저장되지 않아 페이지를 새로 열면 다시 선택해야 합니다.
                </p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept={FILE_INPUT_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) onLogoFile(file)
                  }}
                />
              </div>
              <RangeField
                label="크기"
                value={settings.logoSize}
                display={`${settings.logoSize}%`}
                limit={L.logoSize}
                onChange={(logoSize) => onChange({ logoSize })}
              />
            </>
          )}

          <RangeField
            label="불투명도"
            value={settings.opacity}
            display={`${Math.round(settings.opacity * 100)}%`}
            limit={L.opacity}
            onChange={(opacity) => onChange({ opacity })}
          />
          <div className="space-y-2">
            <RangeField
              label="회전"
              value={settings.rotation}
              display={`${settings.rotation}°`}
              limit={L.rotation}
              onChange={(rotation) => onChange({ rotation })}
            />
            <div className="flex gap-2">
              {[0, -30, -45, 45].map((angle) => (
                <Button
                  key={angle}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={settings.rotation === angle}
                  className={cn('h-7 flex-1 text-xs', settings.rotation === angle && pressed)}
                  onClick={() => onChange({ rotation: angle })}
                >
                  {angle}°
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>배치</Label>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={settings.layout === option.value}
                  className={cn('h-8', settings.layout === option.value && pressed)}
                  onClick={() => onChange({ layout: option.value })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {settings.layout === 'single' ? (
            <>
              <div className="space-y-2">
                <Label>위치</Label>
                <div className="grid w-fit grid-cols-3 gap-1 rounded-md border p-1">
                  {WATERMARK_POSITIONS.map((position) => (
                    <button
                      key={position}
                      type="button"
                      aria-label={`위치 ${WATERMARK_POSITION_LABELS[position]}`}
                      aria-pressed={settings.position === position}
                      title={WATERMARK_POSITION_LABELS[position]}
                      onClick={() => onChange({ position })}
                      className={cn(
                        'flex h-8 w-10 items-center justify-center rounded transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        settings.position === position && 'bg-[var(--penta-indigo)] hover:bg-[var(--penta-indigo)]'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          settings.position === position ? 'bg-white' : 'bg-muted-foreground/40'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <RangeField
                label="여백"
                value={settings.margin}
                display={`${settings.margin}%`}
                limit={L.margin}
                onChange={(margin) => onChange({ margin })}
              />
            </>
          ) : (
            <RangeField
              label="간격"
              value={settings.gap}
              display={`${settings.gap}%`}
              limit={L.gap}
              onChange={(gap) => onChange({ gap })}
            />
          )}

          <p className="text-xs text-muted-foreground">
            크기·여백·간격은 이미지 짧은 변 기준 비율입니다. 워터마크는 실행취소 대상이 아니며, 자르기·회전 후에도 현재 크기에 맞춰 다시 배치되어 다운로드 시 합성됩니다.
          </p>
        </div>
      )}
    </section>
  )
}
