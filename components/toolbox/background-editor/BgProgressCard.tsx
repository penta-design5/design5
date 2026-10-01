'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ModelStatus, RemovalStatus, RemovalStep } from './use-background-removal'

/** 배경 제거가 이보다 빨리 끝나면 진행 카드를 띄우지 않는다(WebGPU 0.4초 — 깜박임 방지) */
const REMOVAL_CARD_DELAY_MS = 300

const STEPS: { step: RemovalStep; label: string }[] = [
  { step: 'prepare', label: '이미지 준비' },
  { step: 'infer', label: '배경 분석(AI)' },
  { step: 'compose', label: '결과 만들기' },
]

/** 십진 MB — Hugging Face 표기(90.7 MB)와 같게 */
const mb = (bytes: number) => (bytes / 1_000_000).toFixed(1)

function Bar({ value }: { value?: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value === undefined ? undefined : Math.round(value)}
    >
      {value === undefined ? (
        <div className="h-full w-2/5 animate-progress-indeterminate rounded-full bg-[var(--penta-indigo)]" />
      ) : (
        <div className="h-full rounded-full bg-[var(--penta-indigo)] transition-[width] duration-200" style={{ width: `${value}%` }} />
      )}
    </div>
  )
}

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(id)
  }, [startedAt])
  return startedAt === null ? 0 : Math.max(0, now - startedAt)
}

interface BgProgressCardProps {
  model: ModelStatus
  removal: RemovalStatus
  /** 모델 준비 결과 CPU 실행이면 안내 추가 */
  cpu: boolean
  onCancelDownload: () => void
}

/**
 * 작업 영역 가운데의 진행 카드 — 모델 내려받기(실제 진행률)와 배경 제거(단계 + 경과 시간)를 같은 자리에 보여 준다.
 * 진행 중일 때만 그린다. 취소·오류는 페이지가 토스트로 알리고, 「배경 제거」 버튼으로 다시 시도한다.
 */
export function BgProgressCard({ model, removal, cpu, onCancelDownload }: BgProgressCardProps) {
  const running = removal.kind === 'running' ? removal : null
  const elapsed = useElapsed(running ? running.startedAt : null)
  const [removalVisible, setRemovalVisible] = useState(false)

  useEffect(() => {
    if (!running) {
      setRemovalVisible(false)
      return
    }
    const id = setTimeout(() => setRemovalVisible(true), REMOVAL_CARD_DELAY_MS)
    return () => clearTimeout(id)
    // 같은 작업(startedAt) 안의 단계 변화로는 타이머를 다시 걸지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running?.startedAt])

  let content: React.ReactNode = null

  if (model.kind === 'downloading') {
    const percent = model.total > 0 ? Math.min(100, (model.loaded / model.total) * 100) : 0
    content = (
      <>
        <Title>AI 모델 내려받는 중</Title>
        <Bar value={percent} />
        <p className="text-sm tabular-nums" aria-live="polite">
          {mb(model.loaded)} / {mb(model.total)}MB ({Math.floor(percent)}%)
        </p>
        <p className="text-xs text-muted-foreground">처음 한 번만 내려받고, 이후에는 저장된 모델을 사용합니다.</p>
        <Button type="button" variant="outline" size="sm" className="self-center" onClick={onCancelDownload}>
          <X className="mr-1.5 h-4 w-4" />
          취소
        </Button>
      </>
    )
  } else if (model.kind === 'verifying' || model.kind === 'preparing') {
    content = (
      <>
        <Title spinner>{model.kind === 'verifying' ? 'AI 모델 확인 중…' : 'AI 모델 준비 중…'}</Title>
        <Bar />
      </>
    )
  } else if (running && removalVisible) {
    const activeIndex = STEPS.findIndex((s) => s.step === running.step)
    content = (
      <>
        <Title spinner>배경 제거 중…</Title>
        <ol className="space-y-1.5 text-left text-sm">
          {STEPS.map((s, i) => (
            <li
              key={s.step}
              className={cn('flex items-center gap-2', i > activeIndex && 'text-muted-foreground', i === activeIndex && 'font-medium')}
            >
              {i < activeIndex ? (
                <Check className="h-4 w-4 text-[var(--penta-indigo)]" />
              ) : i === activeIndex ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--penta-indigo)]" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center text-xs">{i + 1}</span>
              )}
              {s.label}
            </li>
          ))}
        </ol>
        <Bar />
        <p className="text-sm tabular-nums text-muted-foreground">{(elapsed / 1000).toFixed(1)}초</p>
        {cpu && (
          <p className="text-xs text-muted-foreground">
            이 PC는 그래픽 가속(WebGPU)을 사용할 수 없어 CPU로 처리합니다. 시간이 더 걸릴 수 있습니다.
          </p>
        )}
      </>
    )
  }

  if (!content) return null
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 p-4">
      <div
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border bg-card p-5 text-center shadow-lg"
        role="status"
        data-testid="bg-progress-card"
      >
        {content}
      </div>
    </div>
  )
}

function Title({ children, spinner }: { children: React.ReactNode; spinner?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 font-semibold">
      {spinner && <Loader2 className="h-5 w-5 animate-spin text-[var(--penta-indigo)]" />}
      <span>{children}</span>
    </div>
  )
}
