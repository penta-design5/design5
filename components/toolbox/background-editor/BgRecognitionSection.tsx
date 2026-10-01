'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { createCanvas } from '@/lib/toolbox/common/canvas'
import {
  RECOGNITION_MAX,
  RECOGNITION_MIN,
  adjustForRecognition,
  isDefaultRecognition,
  sameRecognition,
  type RecognitionSettings,
} from '@/lib/toolbox/background-editor/recognition'

const SLIDERS: { key: keyof RecognitionSettings; label: string }[] = [
  { key: 'contrast', label: '대비' },
  { key: 'highlights', label: '하이라이트' },
  { key: 'saturation', label: '채도' },
]

const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`)

/** 썸네일 긴 변 최대(px) — 패널 폭(약 360px) × 2(고해상도 화면) */
const PREVIEW_MAX_SIDE = 720

/**
 * AI 입력 미리보기 — 원본을 한 번 줄여 두고, 설정이 바뀔 때마다 그 작은 이미지에만 조정을 적용한다(슬라이더를 끄는 동안 실시간).
 * 누르고 있는 동안 원본을 보여 준다.
 */
function RecognitionPreview({ original, settings }: { original: HTMLCanvasElement; settings: RecognitionSettings }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [holding, setHolding] = useState(false)
  const base = useMemo(() => {
    const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(original.width, original.height))
    const width = Math.max(1, Math.round(original.width * scale))
    const height = Math.max(1, Math.round(original.height * scale))
    const { canvas, ctx } = createCanvas(width, height)
    ctx.drawImage(original, 0, 0, width, height)
    const image = ctx.getImageData(0, 0, width, height)
    canvas.width = 0
    return image
  }, [original])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.width = base.width
    canvas.height = base.height
    const image = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height)
    if (!holding) adjustForRecognition(image.data, settings)
    ctx.putImageData(image, 0, 0)
  }, [base, settings, holding])

  const release = () => setHolding(false)
  return (
    <div className="space-y-1">
      <button
        type="button"
        className="relative block w-full overflow-hidden rounded-md border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ aspectRatio: `${base.width} / ${base.height}` }}
        aria-label="AI 입력 미리보기 — 누르고 있으면 원본을 봅니다"
        aria-pressed={holding}
        onPointerDown={(e) => {
          e.preventDefault()
          setHolding(true)
        }}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            setHolding(true)
          }
        }}
        onKeyUp={release}
        onBlur={release}
        data-testid="bg-recognition-preview"
        data-holding={holding}
      >
        <canvas ref={ref} className="block h-full w-full" />
        <span className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {holding ? '원본' : 'AI 입력'}
        </span>
      </button>
      <p className="text-xs text-muted-foreground">AI가 보는 이미지입니다. 누르고 있으면 원본을 봅니다.</p>
    </div>
  )
}

interface BgRecognitionSectionProps {
  hasResult: boolean
  /** 원본(미리보기용) */
  original: HTMLCanvasElement | null
  settings: RecognitionSettings
  /** 지금 결과를 만들 때 쓴 설정 — 다르면 「다시 배경 제거」를 누를 수 있다 */
  applied: RecognitionSettings | null
  processing: boolean
  /** 그래픽 가속(WebGPU) — 슬라이더를 놓으면 바로 다시 제거한다 */
  autoRerun: boolean
  /** 끄는 동안(미리보기만 갱신) */
  onChange: (patch: Partial<RecognitionSettings>) => void
  /** 놓을 때(값 확정 — 자동 다시 제거) */
  onCommit: (settings: RecognitionSettings) => void
  onReset: () => void
  onRerun: () => void
}

/**
 * 「인식 보정」 — 대비·하이라이트·채도를 AI 입력에만 적용해 배경 제거를 다시 실행한다(결과·저장 이미지 색은 그대로).
 * 효과를 측정해 효과가 있던 세 가지만 둔다(P4-3 축소 구현).
 */
export function BgRecognitionSection({
  hasResult,
  original,
  settings,
  applied,
  processing,
  autoRerun,
  onChange,
  onCommit,
  onReset,
  onRerun,
}: BgRecognitionSectionProps) {
  const changed = applied ? !sameRecognition(applied, settings) : false
  return (
    <section className="space-y-4" data-testid="bg-recognition-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">인식 보정</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onReset}
          disabled={isDefaultRecognition(settings)}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          초기화
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        배경이 덜 지워지거나 대상이 함께 지워질 때, AI가 보는 이미지의 색을 조정해 다시 인식합니다. 결과·저장 이미지의 색은 바뀌지 않으며, 효과는 이미지마다 다릅니다.
      </p>
      {original && <RecognitionPreview original={original} settings={settings} />}
      {SLIDERS.map(({ key, label }) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{label}</Label>
            <span className="text-sm tabular-nums text-muted-foreground">{signed(settings[key])}</span>
          </div>
          <Slider
            aria-label={`인식 보정 ${label}`}
            value={[settings[key]]}
            min={RECOGNITION_MIN}
            max={RECOGNITION_MAX}
            step={5}
            onValueChange={([v]) => onChange({ [key]: v })}
            onValueCommit={([v]) => onCommit({ ...settings, [key]: v })}
          />
        </div>
      ))}
      {hasResult ? (
        <>
          <Button
            type="button"
            variant={changed ? 'default' : 'outline'}
            className="w-full"
            onClick={onRerun}
            disabled={!changed || processing}
            data-testid="bg-rerun-button"
          >
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {processing ? '처리 중…' : '다시 배경 제거'}
          </Button>
          <p className="text-xs text-muted-foreground">
            {autoRerun
              ? '슬라이더를 놓으면 바로 다시 배경 제거합니다. 수동 보정은 그대로 유지되고, 실행 취소로 이전 결과로 돌아갈 수 있습니다.'
              : changed
                ? '바꾼 설정으로 AI를 다시 실행합니다. 수동 보정은 그대로 유지되고, 실행 취소로 이전 결과로 돌아갈 수 있습니다.'
                : '설정을 바꾸면 다시 배경 제거할 수 있습니다.'}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">설정은 「배경 제거」를 누를 때 적용됩니다.</p>
      )}
    </section>
  )
}
