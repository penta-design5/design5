'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX_SIDE, linkedDimension, validateOutputSize, type Size } from '@/lib/toolbox/common/canvas'
import { SIZE_PRESETS, matchingPreset, parsePx, presetError, scaledSize } from '@/lib/toolbox/image-splitter/size'

interface SplitSizeSectionProps {
  /** id 접두사(데스크톱 패널·Sheet가 동시에 렌더되므로 구분) */
  idPrefix: string
  original: Size
  current: Size
  busy: boolean
  onApply: (size: Size) => void
}

const toValues = (size: Size) => ({ width: String(size.width), height: String(size.height) })

/**
 * 「이미지 크기」 — 분할 전에 전체 이미지 크기를 바꾼다. 항상 원본에서 다시 리사이즈한다(호출하는 쪽).
 * 프리셋(원본 크기·2배·3배)은 입력칸만 채우고, 적용은 직접 입력과 같이 「크기 적용」으로 한다(이미지 편집과 동일).
 * 비율 유지는 원본 비율 기준(여러 번 바꿔도 비율 오차가 쌓이지 않게).
 */
export function SplitSizeSection({ idPrefix, original, current, busy, onApply }: SplitSizeSectionProps) {
  const [keepRatio, setKeepRatio] = useState(true)
  const [values, setValues] = useState(() => toValues(current))

  // 적용·새 이미지로 현재 크기가 바뀌면 입력도 맞춘다
  useEffect(() => {
    setValues(toValues(current))
  }, [current.width, current.height]) // eslint-disable-line react-hooks/exhaustive-deps

  const changeValue = (changed: 'width' | 'height', text: string) => {
    const other = changed === 'width' ? 'height' : 'width'
    const value = parsePx(text)
    setValues((prev) => ({
      ...prev,
      [changed]: text,
      ...(keepRatio && value > 0 ? { [other]: String(linkedDimension(original, 'px', changed, value)) } : {}),
    }))
  }

  const toggleRatio = (next: boolean) => {
    setKeepRatio(next)
    // 다시 켜면 너비 기준으로 높이를 원본 비율에 맞춘다
    const width = parsePx(values.width)
    if (next && width > 0) setValues({ width: values.width, height: String(linkedDimension(original, 'px', 'width', width)) })
  }

  const result = { width: parsePx(values.width), height: parsePx(values.height) }
  const error = validateOutputSize(result)
  const unchanged = !error && result.width === current.width && result.height === current.height
  const enlarging = !error && (result.width > original.width || result.height > original.height)
  // 선택 표시는 입력값 기준(프리셋을 누르면 입력칸만 채우고, 적용은 「크기 적용」)
  const active = error ? null : matchingPreset(original, result)
  const presetErrors = SIZE_PRESETS.map((p) => ({ preset: p, error: presetError(original, p.scale) }))
  const blocked = presetErrors.filter((p) => p.error)

  return (
    <section className="space-y-4" aria-busy={busy}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">이미지 크기</h3>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="크기 적용 중" />}
      </div>

      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="크기 프리셋">
        {presetErrors.map(({ preset, error: presetBlocked }) => {
          const size = scaledSize(original, preset.scale)
          const isActive = active?.scale === preset.scale
          return (
            <Button
              key={preset.scale}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={isActive}
              disabled={busy || !!presetBlocked}
              title={presetBlocked ?? `${size.width} × ${size.height}px`}
              className={cn('h-8 text-xs', isActive && 'border-[var(--penta-indigo)] text-[var(--penta-indigo)]')}
              onClick={() => setValues(toValues(size))}
            >
              {preset.label}
            </Button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`${idPrefix}-size-width`}>가로(px)</Label>
          <Input
            id={`${idPrefix}-size-width`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_SIDE}
            className="tabular-nums"
            value={values.width}
            onChange={(e) => changeValue('width', e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`${idPrefix}-size-height`}>세로(px)</Label>
          <Input
            id={`${idPrefix}-size-height`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_SIDE}
            className="tabular-nums"
            value={values.height}
            onChange={(e) => changeValue('height', e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${idPrefix}-size-ratio`} checked={keepRatio} onCheckedChange={(v) => toggleRatio(v === true)} />
        <Label htmlFor={`${idPrefix}-size-ratio`} className="font-normal">
          원본 비율 유지
        </Label>
      </div>

      <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')} aria-live="polite">
        {error ?? `적용 후 크기: ${result.width} × ${result.height}px${enlarging ? ' · 원본보다 크면 화질이 떨어질 수 있습니다.' : ''}`}
      </p>
      <Button type="button" size="sm" className="w-full" disabled={busy || !!error || unchanged} onClick={() => onApply(result)}>
        크기 적용
      </Button>
      <p className="text-xs text-muted-foreground">
        전체 이미지 크기를 적용한 뒤 분할합니다. 항상 원본에서 다시 계산하므로 여러 번 바꿔도 화질이 떨어지지 않습니다.
        최대 한 변 {MAX_SIDE.toLocaleString()}px · 약 1,670만 px(4096×4096).
        {blocked.length > 0 && ` ${blocked.map((b) => b.preset.label).join('·')}는 상한을 넘어 쓸 수 없습니다.`}
      </p>
    </section>
  )
}
