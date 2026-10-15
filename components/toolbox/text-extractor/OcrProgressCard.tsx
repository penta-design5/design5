'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { OcrProgress } from '@/lib/toolbox/text-extractor/engine'
import type { PdfPageProgress } from './use-ocr'

const STEPS = [
  { key: 'model', label: '인식 모델 준비' },
  { key: 'detect', label: '글자 영역 찾기' },
  { key: 'recognize', label: '글자 읽기' },
] as const

/** 십진 MB — 배경 편집 진행 카드와 같은 표기 */
const mb = (bytes: number) => (bytes / 1_000_000).toFixed(1)

function stepIndex(progress: OcrProgress | null): number {
  if (!progress || progress.stage === 'download' || progress.stage === 'prepare') return 0
  return progress.stage === 'detect' ? 1 : 2
}

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

function useElapsed(startedAt: number) {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(id)
  }, [startedAt])
  return Math.max(0, now - startedAt)
}

interface OcrProgressCardProps {
  progress: OcrProgress | null
  startedAt: number
  /** PDF면 지금 페이지(이미지면 null) */
  page: PdfPageProgress | null
  onCancel: () => void
}

/**
 * 작업 영역 가운데의 진행 카드 — 모델 내려받기(실제 진행률) → 글자 영역 찾기 → 글자 읽기(줄 수) + 경과 시간 + 취소.
 * PDF는 페이지 순번(「2 / 5쪽」)을 함께 보이고, 텍스트 레이어로 읽는 페이지는 단계 대신 한 줄로 알린다.
 */
export function OcrProgressCard({ progress, startedAt, page, onCancel }: OcrProgressCardProps) {
  const elapsed = useElapsed(startedAt)
  const active = stepIndex(progress)

  let bar: number | undefined
  let detail: string | null = null
  if (progress?.stage === 'download') {
    bar = progress.total > 0 ? Math.min(100, (progress.loaded / progress.total) * 100) : 0
    detail = `${mb(progress.loaded)} / ${mb(progress.total)}MB (${Math.floor(bar)}%)`
  } else if (progress?.stage === 'recognize') {
    bar = progress.total > 0 ? (progress.done / progress.total) * 100 : 100
    detail = `${progress.done} / ${progress.total}줄`
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 p-4">
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border bg-card p-5 text-center shadow-lg" role="status" data-testid="ocr-progress-card">
        <div className="flex items-center justify-center gap-2 font-semibold">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--penta-indigo)]" />
          <span>텍스트 추출 중…</span>
        </div>
        {page && (
          <div className="space-y-1.5">
            <p className="text-sm tabular-nums">
              {page.index} / {page.count}쪽 <span className="text-muted-foreground">({page.number}쪽)</span>
            </p>
            <Bar value={((page.index - 1) / page.count) * 100} />
          </div>
        )}
        {page?.source === 'text' ? (
          <p className="text-sm text-muted-foreground">PDF에 들어 있는 글자를 읽는 중</p>
        ) : (
        <ol className="space-y-1.5 text-left text-sm">
          {STEPS.map((s, i) => (
            <li key={s.key} className={cn('flex items-center gap-2', i > active && 'text-muted-foreground', i === active && 'font-medium')}>
              {i < active ? (
                <Check className="h-4 w-4 text-[var(--penta-indigo)]" />
              ) : i === active ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--penta-indigo)]" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center text-xs">{i + 1}</span>
              )}
              {s.label}
            </li>
          ))}
        </ol>
        )}
        {page?.source !== 'text' && <Bar value={bar} />}
        <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {detail ? `${detail} · ` : ''}
          {(elapsed / 1000).toFixed(1)}초
        </p>
        {progress?.stage === 'download' && (
          <p className="text-xs text-muted-foreground">처음 한 번만 내려받고, 이후에는 저장된 모델을 사용합니다.</p>
        )}
        <Button type="button" variant="outline" size="sm" className="self-center" onClick={onCancel}>
          <X className="mr-1.5 h-4 w-4" />
          취소
        </Button>
      </div>
    </div>
  )
}
