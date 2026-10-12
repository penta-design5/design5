'use client'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface QrColorFieldProps {
  label: string
  value: string
  presets: string[]
  disabled?: boolean
  onChange: (color: string) => void
}

/** 색상 프리셋 + 직접 선택(`<input type="color">`). 값은 항상 소문자 `#rrggbb`. */
export function QrColorField({ label, value, presets, disabled, onChange }: QrColorFieldProps) {
  return (
    <div className={cn('space-y-2', disabled && 'opacity-50')}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            disabled={disabled}
            aria-label={`${label} ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            className={cn(
              'h-6 w-6 [@media(pointer:coarse)]:h-9 [@media(pointer:coarse)]:w-9 rounded-full border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none',
              value === color && 'ring-2 ring-[var(--penta-indigo)] ring-offset-1'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
        <input
          type="color"
          disabled={disabled}
          aria-label={`${label} 직접 선택`}
          className="h-6 w-8 [@media(pointer:coarse)]:h-9 [@media(pointer:coarse)]:w-12 cursor-pointer rounded border bg-transparent p-0 disabled:pointer-events-none"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
        />
      </div>
    </div>
  )
}
