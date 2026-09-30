'use client'

import { useEffect, useState } from 'react'
import { Link2, Link2Off } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  linkedDimension,
  resolveResize,
  validateOutputSize,
  type ResizeUnit,
  type Size,
} from '@/lib/toolbox/image-editor/transform'

interface ResizePanelProps {
  size: Size
  onApply: (size: Size) => void
}

const PERCENT_PRESETS = [50, 200]
const PIXEL_PRESETS: Size[] = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 1080, height: 1080 },
]

const initialValues = (size: Size, unit: ResizeUnit) =>
  unit === 'percent' ? { width: '100', height: '100' } : { width: String(size.width), height: String(size.height) }

const toNumber = (text: string) => (text.trim() === '' ? NaN : Number(text))

export function ResizePanel({ size, onApply }: ResizePanelProps) {
  const [unit, setUnit] = useState<ResizeUnit>('px')
  const [keepRatio, setKeepRatio] = useState(true)
  const [values, setValues] = useState(() => initialValues(size, 'px'))

  // 문서 크기가 바뀌면(회전·리사이즈·실행취소 등) 현재 크기로 입력 초기화
  useEffect(() => {
    setValues(initialValues(size, unit))
    // unit 변경은 changeUnit에서 처리하므로 크기 변화에만 반응
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height])

  const changeUnit = (next: ResizeUnit) => {
    setUnit(next)
    setValues(initialValues(size, next))
  }

  const changeValue = (changed: 'width' | 'height', text: string) => {
    const other = changed === 'width' ? 'height' : 'width'
    const value = toNumber(text)
    setValues((prev) => ({
      ...prev,
      [changed]: text,
      ...(keepRatio && Number.isFinite(value) && value > 0
        ? { [other]: String(linkedDimension(size, unit, changed, value)) }
        : {}),
    }))
  }

  const result = resolveResize(size, unit, toNumber(values.width), toNumber(values.height))
  const error = validateOutputSize(result)
  const unchanged = !error && result.width === size.width && result.height === size.height
  const enlarging = !error && (result.width > size.width || result.height > size.height)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">크기 변경</h3>
        <div className="flex rounded-md border p-0.5" role="group" aria-label="단위">
          {(['px', 'percent'] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => changeUnit(u)}
              className={cn(
                'rounded px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                unit === u ? 'bg-[var(--penta-indigo)] text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {u === 'px' ? 'px' : '%'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="image-editor-resize-width">너비</Label>
          <Input
            id="image-editor-resize-width"
            type="number"
            inputMode="numeric"
            min={1}
            className="tabular-nums"
            value={values.width}
            onChange={(e) => changeValue('width', e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('mb-0.5 h-9 w-9 shrink-0', keepRatio && 'text-[var(--penta-indigo)]')}
          aria-pressed={keepRatio}
          aria-label={keepRatio ? '비율 유지 켜짐' : '비율 유지 꺼짐'}
          title={keepRatio ? '비율 유지 켜짐' : '비율 유지 꺼짐'}
          onClick={() => setKeepRatio((v) => !v)}
        >
          {keepRatio ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
        </Button>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="image-editor-resize-height">높이</Label>
          <Input
            id="image-editor-resize-height"
            type="number"
            inputMode="numeric"
            min={1}
            className="tabular-nums"
            value={values.height}
            onChange={(e) => changeValue('height', e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        비율 유지: <span className={keepRatio ? 'text-[var(--penta-indigo)]' : ''}>{keepRatio ? '켜짐' : '꺼짐'}</span>
      </p>

      <div className="flex flex-wrap gap-1.5">
        {PERCENT_PRESETS.map((percent) => (
          <Button
            key={percent}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setUnit('percent')
              setValues({ width: String(percent), height: String(percent) })
            }}
          >
            {percent}%
          </Button>
        ))}
        {PIXEL_PRESETS.map((preset) => (
          <Button
            key={`${preset.width}x${preset.height}`}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs tabular-nums"
            title="정확한 크기로 맞추므로 비율 유지가 꺼집니다"
            onClick={() => {
              setUnit('px')
              setKeepRatio(false)
              setValues({ width: String(preset.width), height: String(preset.height) })
            }}
          >
            {preset.width}×{preset.height}
          </Button>
        ))}
      </div>

      <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
        {error ?? `적용 후 크기: ${result.width} × ${result.height}px${enlarging ? ' · 확대하면 화질이 떨어질 수 있습니다.' : ''}`}
      </p>
      <Button type="button" size="sm" className="w-full" disabled={!!error || unchanged} onClick={() => onApply(result)}>
        크기 적용
      </Button>
    </section>
  )
}
