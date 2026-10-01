'use client'

import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { DEFAULT_EDGE, type EdgeSettings } from '@/lib/toolbox/background-editor/refine'

/**
 * 슬라이더 — 끄는 동안에는 숫자만 바뀌고, 놓을 때(onValueCommit) 반영한다.
 * 큰 이미지는 경계 다듬기 한 번에 수백 ms가 걸릴 수 있어 끄는 내내 다시 계산하지 않는다.
 */
function CommitSlider({
  label,
  hint,
  value,
  onCommit,
}: {
  label: string
  hint: string
  value: number
  onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{draft}%</span>
      </div>
      <Slider
        aria-label={label}
        value={[draft]}
        min={0}
        max={100}
        step={5}
        onValueChange={([v]) => setDraft(v)}
        onValueCommit={([v]) => onCommit(v)}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

interface BgEdgeSectionProps {
  enabled: boolean
  edge: EdgeSettings
  onChange: (patch: Partial<EdgeSettings>) => void
}

/** 「경계 다듬기」 — 부드럽게 · 색 번짐 줄이기 (배경을 제거한 뒤에만) */
export function BgEdgeSection({ enabled, edge, onChange }: BgEdgeSectionProps) {
  const isDefault = edge.feather === DEFAULT_EDGE.feather && edge.defringe === DEFAULT_EDGE.defringe
  return (
    <section className="space-y-4" data-testid="bg-edge-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">경계 다듬기</h3>
        {enabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange(DEFAULT_EDGE)}
            disabled={isDefault}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            초기화
          </Button>
        )}
      </div>
      {!enabled ? (
        <p className="text-sm text-muted-foreground">배경을 제거하면 경계를 다듬을 수 있습니다.</p>
      ) : (
        <>
          <CommitSlider
            label="부드럽게"
            hint="경계를 살짝 흐려 배경과 자연스럽게 이어지게 합니다."
            value={edge.feather}
            onCommit={(feather) => onChange({ feather })}
          />
          <CommitSlider
            label="색 번짐 줄이기"
            hint="머리카락·털 등 경계에 남은 원래 배경색을 줄입니다."
            value={edge.defringe}
            onCommit={(defringe) => onChange({ defringe })}
          />
        </>
      )}
    </section>
  )
}
