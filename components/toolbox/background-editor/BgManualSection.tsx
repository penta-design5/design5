'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { BRUSH_SIZE_MAX, BRUSH_SIZE_MIN, type RectMode } from '@/lib/toolbox/background-editor/edits'
import type { PickOptions, PickRange, RGB } from '@/lib/toolbox/background-editor/picker'
import type { EditTool } from './BgPreview'

const pressed = 'border-[var(--penta-indigo)] text-[var(--penta-indigo)]'

const RECT_MODES: { value: RectMode; label: string }[] = [
  { value: 'keep', label: '안쪽만 남기기' },
  { value: 'erase', label: '영역 지우기' },
]

const PICK_RANGES: { value: PickRange; label: string }[] = [
  { value: 'contiguous', label: '이어진 영역만' },
  { value: 'global', label: '이미지 전체' },
]

const toHex = ([r, g, b]: RGB) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase()

const TOOL_HINTS: Record<EditTool, string> = {
  pan: '미리보기 위 도구 막대에서 지우기·복원·사각형을 고르세요.',
  erase: '덜 지워진 부분을 칠해서 지웁니다.',
  restore: '잘못 지워진 부분을 칠해서 되살립니다. 지워진 원본이 흐리게 보입니다.',
  rect: '끌어서 영역을 고르면 바로 적용됩니다.',
  picker: '지울 색을 누르면 비슷한 색이 지워집니다. 허용 범위·범위를 바꾸면 마지막 스포이드 결과에 바로 반영됩니다.',
}

export interface BgManualSectionProps {
  enabled: boolean
  tool: EditTool
  brushSize: number
  softness: number
  rectMode: RectMode
  pick: PickOptions
  /** 마지막 작업이 스포이드면 그 기준색 */
  lastPickColor: RGB | null
  hasEdits: boolean
  onBrushSizeChange: (size: number) => void
  onSoftnessChange: (softness: number) => void
  onRectModeChange: (mode: RectMode) => void
  onPickChange: (patch: Partial<PickOptions>) => void
  onClear: () => void
}

/** 허용 범위 — 끄는 동안 숫자만, 놓을 때 반영(전체 이미지 다시 계산) */
function ToleranceSlider({ value, onCommit }: { value: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>허용 범위</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{draft}</span>
      </div>
      <Slider
        aria-label="스포이드 허용 범위"
        value={[draft]}
        min={0}
        max={100}
        step={1}
        onValueChange={([v]) => setDraft(v)}
        onValueCommit={([v]) => onCommit(v)}
      />
      <p className="text-xs text-muted-foreground">클수록 더 다른 색까지 지웁니다.</p>
    </div>
  )
}

/** 「수동 보정」 — 브러시 크기·부드러움, 사각형 방식, 수정 모두 지우기 (배경을 제거한 뒤에만) */
export function BgManualSection({
  enabled,
  tool,
  brushSize,
  softness,
  rectMode,
  pick,
  lastPickColor,
  hasEdits,
  onBrushSizeChange,
  onSoftnessChange,
  onRectModeChange,
  onPickChange,
  onClear,
}: BgManualSectionProps) {
  // 터치 기기에는 Space 키가 없다 — 두 손가락 조작으로 안내
  const coarse = useMediaQuery('(pointer: coarse)')
  return (
    <section className="space-y-4" data-testid="bg-manual-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">수동 보정</h3>
        {enabled && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClear} disabled={!hasEdits}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            수정 모두 지우기
          </Button>
        )}
      </div>
      {!enabled ? (
        <p className="text-sm text-muted-foreground">배경을 제거하면 덜 지워진 부분을 직접 지우거나 되살릴 수 있습니다.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{TOOL_HINTS[tool]}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>브러시 크기</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{brushSize}px</span>
            </div>
            <Slider
              aria-label="브러시 크기"
              value={[brushSize]}
              min={BRUSH_SIZE_MIN}
              max={BRUSH_SIZE_MAX}
              step={1}
              onValueChange={([v]) => onBrushSizeChange(v)}
            />
            <p className="text-xs text-muted-foreground">화면 기준 크기입니다. 확대하면 더 세밀하게 칠할 수 있습니다. 단축키 [ ]</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>브러시 부드러움</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{softness}%</span>
            </div>
            <Slider
              aria-label="브러시 부드러움"
              value={[softness]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => onSoftnessChange(v)}
            />
          </div>
          <div className="space-y-2">
            <Label>사각형 영역</Label>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="사각형 영역 방식">
              {RECT_MODES.map((m) => (
                <Button
                  key={m.value}
                  type="button"
                  variant="outline"
                  role="radio"
                  aria-checked={rectMode === m.value}
                  className={cn('h-9', rectMode === m.value && pressed)}
                  onClick={() => onRectModeChange(m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>스포이드 범위</Label>
              {lastPickColor && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="bg-pick-color">
                  <span className="h-4 w-4 rounded border shadow-sm" style={{ backgroundColor: toHex(lastPickColor) }} />
                  {toHex(lastPickColor)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="스포이드 범위">
              {PICK_RANGES.map((r) => (
                <Button
                  key={r.value}
                  type="button"
                  variant="outline"
                  role="radio"
                  aria-checked={pick.range === r.value}
                  className={cn('h-9', pick.range === r.value && pressed)}
                  onClick={() => onPickChange({ range: r.value })}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>
          <ToleranceSlider value={pick.tolerance} onCommit={(tolerance) => onPickChange({ tolerance })} />
          <p className="text-xs text-muted-foreground" data-testid="bg-pan-hint">
            {coarse
              ? '두 손가락으로 화면을 옮기고 확대/축소합니다. 한 손가락은 고른 도구로 작업합니다.'
              : 'Space를 누른 채 끌면 어떤 도구에서도 화면을 옮길 수 있습니다.'}
          </p>
        </>
      )}
    </section>
  )
}
