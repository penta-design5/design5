'use client'

import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { BRUSH_SIZE_MAX, BRUSH_SIZE_MIN, type RectMode } from '@/lib/toolbox/background-editor/edits'
import type { EditTool } from './BgPreview'

const pressed = 'border-[var(--penta-indigo)] text-[var(--penta-indigo)]'

const RECT_MODES: { value: RectMode; label: string }[] = [
  { value: 'keep', label: '안쪽만 남기기' },
  { value: 'erase', label: '영역 지우기' },
]

const TOOL_HINTS: Record<EditTool, string> = {
  pan: '미리보기 위 도구 막대에서 지우기·복원·사각형을 고르세요.',
  erase: '덜 지워진 부분을 칠해서 지웁니다.',
  restore: '잘못 지워진 부분을 칠해서 되살립니다. 지워진 원본이 흐리게 보입니다.',
  rect: '끌어서 영역을 고르면 바로 적용됩니다.',
}

export interface BgManualSectionProps {
  enabled: boolean
  tool: EditTool
  brushSize: number
  softness: number
  rectMode: RectMode
  hasEdits: boolean
  onBrushSizeChange: (size: number) => void
  onSoftnessChange: (softness: number) => void
  onRectModeChange: (mode: RectMode) => void
  onClear: () => void
}

/** 「수동 보정」 — 브러시 크기·부드러움, 사각형 방식, 수정 모두 지우기 (배경을 제거한 뒤에만) */
export function BgManualSection({
  enabled,
  tool,
  brushSize,
  softness,
  rectMode,
  hasEdits,
  onBrushSizeChange,
  onSoftnessChange,
  onRectModeChange,
  onClear,
}: BgManualSectionProps) {
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
          <p className="text-xs text-muted-foreground">Space를 누른 채 끌면 어떤 도구에서도 화면을 옮길 수 있습니다.</p>
        </>
      )}
    </section>
  )
}
