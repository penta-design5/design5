'use client'

import { useEffect, useState } from 'react'
import { Crop } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ASPECT_PRESETS, type AspectKey, type CropRect } from '@/lib/toolbox/image-editor/crop'

export interface CropState {
  rect: CropRect
  aspect: AspectKey
}

interface CropPanelProps {
  crop: CropState | null
  onStart: () => void
  onAspectChange: (aspect: AspectKey) => void
  onFieldChange: (field: keyof CropRect, value: number) => void
  onApply: () => void
  onCancel: () => void
}

/** 숫자 입력 — 입력 중 빈 값을 허용하고, 포커스가 없을 때 외부 값(드래그 등)과 동기화 */
function NumberField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (value: number) => void }) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        className="h-8 tabular-nums"
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          setText(String(value))
        }}
        onChange={(e) => {
          setText(e.target.value)
          if (e.target.value.trim() !== '' && Number.isFinite(Number(e.target.value))) onChange(Number(e.target.value))
        }}
      />
    </div>
  )
}

export function CropPanel({ crop, onStart, onAspectChange, onFieldChange, onApply, onCancel }: CropPanelProps) {
  if (!crop) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">자르기</h3>
        <Button type="button" variant="outline" className="w-full" onClick={onStart}>
          <Crop className="mr-2 h-4 w-4" />
          자르기 시작
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">자르기</h3>
      <p className="text-xs text-muted-foreground">캔버스에서 상자를 끌어 옮기거나 모서리·변의 핸들로 크기를 조절하세요.</p>

      <div className="space-y-2">
        <Label>비율</Label>
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={crop.aspect === preset.key}
              className={cn(
                'h-7 px-2 text-xs',
                crop.aspect === preset.key && 'border-[var(--penta-indigo)] text-[var(--penta-indigo)]'
              )}
              onClick={() => onAspectChange(preset.key)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField id="image-editor-crop-x" label="X" value={crop.rect.x} onChange={(v) => onFieldChange('x', v)} />
        <NumberField id="image-editor-crop-y" label="Y" value={crop.rect.y} onChange={(v) => onFieldChange('y', v)} />
        <NumberField id="image-editor-crop-width" label="너비" value={crop.rect.width} onChange={(v) => onFieldChange('width', v)} />
        <NumberField id="image-editor-crop-height" label="높이" value={crop.rect.height} onChange={(v) => onFieldChange('height', v)} />
      </div>
      <p className="text-xs text-muted-foreground">
        자른 후 크기: {crop.rect.width} × {crop.rect.height}px · Enter 적용 · Esc 취소
      </p>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          취소
        </Button>
        <Button type="button" size="sm" className="flex-1" onClick={onApply}>
          자르기 적용
        </Button>
      </div>
    </section>
  )
}
