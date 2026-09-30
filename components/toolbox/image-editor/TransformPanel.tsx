'use client'

import { useEffect, useState } from 'react'
import { FlipHorizontal2, FlipVertical2, RotateCcwSquare, RotateCwSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { rotatedBounds, validateOutputSize, type FlipDirection, type Size } from '@/lib/toolbox/image-editor/transform'

export type RotationFillMode = 'transparent' | 'white' | 'custom'

/** 자유 회전 미리보기 상태 (적용 전까지 문서에 반영되지 않음) */
export interface RotationDraft {
  angle: number
  fillMode: RotationFillMode
  customColor: string
}

export const DEFAULT_ROTATION_DRAFT: RotationDraft = { angle: 0, fillMode: 'transparent', customColor: '#000000' }

/** 빈 영역 채움색 (투명이면 null) */
export const rotationFillColor = (draft: RotationDraft): string | null =>
  draft.fillMode === 'white' ? '#ffffff' : draft.fillMode === 'custom' ? draft.customColor : null

interface TransformPanelProps {
  size: Size
  draft: RotationDraft
  onDraftChange: (draft: RotationDraft) => void
  onRotate90: (direction: 1 | -1) => void
  onFlip: (direction: FlipDirection) => void
  onApplyRotation: () => void
}

const FILL_OPTIONS: { value: RotationFillMode; label: string }[] = [
  { value: 'transparent', label: '투명' },
  { value: 'white', label: '흰색' },
  { value: 'custom', label: '지정색' },
]

export function TransformPanel({ size, draft, onDraftChange, onRotate90, onFlip, onApplyRotation }: TransformPanelProps) {
  // 숫자 입력 중 "-" 같은 중간값을 허용하기 위해 문자열로 보관
  const [angleText, setAngleText] = useState(String(draft.angle))
  useEffect(() => {
    setAngleText((prev) => (Number(prev) === draft.angle ? prev : String(draft.angle)))
  }, [draft.angle])

  const update = (patch: Partial<RotationDraft>) => onDraftChange({ ...draft, ...patch })
  const setAngle = (angle: number) => update({ angle: Math.max(-180, Math.min(180, Math.round(angle * 10) / 10)) })

  const result = rotatedBounds(size.width, size.height, draft.angle)
  const error = draft.angle !== 0 ? validateOutputSize(result) : null

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">회전·반전</h3>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: '왼쪽 90°', icon: RotateCcwSquare, onClick: () => onRotate90(-1) },
          { label: '오른쪽 90°', icon: RotateCwSquare, onClick: () => onRotate90(1) },
          { label: '좌우 반전', icon: FlipHorizontal2, onClick: () => onFlip('horizontal') },
          { label: '상하 반전', icon: FlipVertical2, onClick: () => onFlip('vertical') },
        ].map(({ label, icon: Icon, onClick }) => (
          <Button key={label} type="button" variant="outline" className="h-auto flex-col gap-1 px-1 py-2 text-xs" onClick={onClick}>
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="image-editor-rotate-angle">자유 회전</Label>
          <div className="flex items-center gap-1">
            <Input
              id="image-editor-rotate-angle"
              type="number"
              inputMode="decimal"
              min={-180}
              max={180}
              step={0.1}
              className="h-8 w-20 text-right tabular-nums"
              value={angleText}
              onChange={(e) => {
                setAngleText(e.target.value)
                const value = Number(e.target.value)
                if (e.target.value.trim() !== '' && Number.isFinite(value)) setAngle(value)
              }}
              onBlur={() => setAngleText(String(draft.angle))}
            />
            <span className="text-sm text-muted-foreground">°</span>
          </div>
        </div>
        <Slider aria-label="자유 회전 각도" value={[draft.angle]} min={-180} max={180} step={1} onValueChange={([value]) => setAngle(value)} />

        <div className="space-y-2">
          <Label>빈 영역</Label>
          <div className="flex items-center gap-2">
            {FILL_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant="outline"
                className={cn('h-8 flex-1', draft.fillMode === option.value && 'border-[var(--penta-indigo)] text-[var(--penta-indigo)]')}
                aria-pressed={draft.fillMode === option.value}
                onClick={() => update({ fillMode: option.value })}
              >
                {option.label}
              </Button>
            ))}
            <input
              type="color"
              aria-label="빈 영역 지정색"
              className="h-8 w-10 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
              value={draft.customColor}
              onChange={(e) => update({ fillMode: 'custom', customColor: e.target.value })}
            />
          </div>
        </div>

        <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error ?? `적용 후 크기: ${result.width} × ${result.height}px`}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" disabled={draft.angle === 0} onClick={() => setAngle(0)}>
            초기화
          </Button>
          <Button type="button" size="sm" className="flex-1" disabled={draft.angle === 0 || !!error} onClick={onApplyRotation}>
            회전 적용
          </Button>
        </div>
      </div>
    </section>
  )
}
