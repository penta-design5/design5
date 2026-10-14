'use client'

import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RuleFields, type RuleFieldsProps } from './RuleFields'
import { RulePreview, type RulePreviewProps } from './RulePreview'

type RenameSidePanelProps = Omit<RuleFieldsProps, 'idPrefix' | 'layout' | 'disabled'> &
  RulePreviewProps & {
    zipName: string
    canSave: boolean
    /** ZIP 만드는 중이면 진행률(0~100), 아니면 null */
    progress: number | null
    onSave: () => void
  }

/**
 * 우측 패널(1280px 이상) — 이름 규칙(공통 이름·시작 번호·번호 자릿수) · 바뀔 이름 예시 · ZIP 저장.
 * 1280px 미만에서는 규칙·예시를 본문 카드로, 저장을 헤더 버튼으로 옮긴다(BatchRenamePage).
 * ZIP을 만드는 동안에는 규칙 입력을 잠근다.
 */
export function RenameSidePanel({ example, hasErrors, overflowFrom, zipName, canSave, progress, onSave, ...ruleProps }: RenameSidePanelProps) {
  const saving = progress !== null

  return (
    <div className="h-full w-[410px] space-y-6 overflow-y-auto border-l bg-background p-6">
      <h2 className="text-lg font-semibold">이름 규칙</h2>

      <RuleFields idPrefix="panel" layout="stack" disabled={saving} {...ruleProps} />

      <section className="space-y-2 rounded-lg border bg-muted/40 p-4" aria-live="polite">
        <h3 className="text-sm font-semibold">바뀔 이름</h3>
        <RulePreview example={example} hasErrors={hasErrors} overflowFrom={overflowFrom} />
        <p className="text-xs text-muted-foreground">확장자와 파일 내용은 그대로 유지됩니다.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">저장</h3>
        <p className="break-all text-sm">
          <span className="text-muted-foreground">파일명 </span>
          {zipName}
        </p>
        <Button type="button" className="w-full" disabled={!canSave} onClick={onSave}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {saving ? `ZIP 만드는 중… ${progress}%` : '새 이름으로 ZIP 저장'}
        </Button>
        {progress !== null && <SaveProgress progress={progress} />}
        <p className="text-xs text-muted-foreground">
          파일은 서버로 전송되지 않습니다. 브라우저는 내 PC에 있는 파일의 이름을 직접 바꿀 수 없어, 새 이름으로 묶은 ZIP을 내려받습니다.
        </p>
      </section>
    </div>
  )
}

/** ZIP 생성 진행 막대 */
export function SaveProgress({ progress }: { progress: number }) {
  return (
    <div
      role="progressbar"
      aria-label="ZIP 만드는 중"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className="h-1.5 overflow-hidden rounded-full bg-muted"
    >
      <div className="h-full bg-[var(--penta-indigo)] transition-[width]" style={{ width: `${progress}%` }} />
    </div>
  )
}
