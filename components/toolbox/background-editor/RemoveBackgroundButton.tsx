'use client'

import { Check, Eraser, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type RemoveButtonState = 'ready' | 'busy' | 'done'

interface RemoveBackgroundButtonProps {
  state: RemoveButtonState
  onClick: () => void
  className?: string
}

/** 「배경 제거」 실행 버튼 — 우측 패널 맨 위와(xl 미만) 작업 영역 아래에서 같은 모양으로 쓴다 */
export function RemoveBackgroundButton({ state, onClick, className }: RemoveBackgroundButtonProps) {
  return (
    <Button
      type="button"
      className={cn('w-full', className)}
      onClick={onClick}
      disabled={state !== 'ready'}
      data-testid="bg-remove-button"
      data-state={state}
    >
      {state === 'busy' ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : state === 'done' ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Eraser className="mr-2 h-4 w-4" />
      )}
      {state === 'busy' ? '처리 중…' : state === 'done' ? '배경 제거 완료' : '배경 제거'}
    </Button>
  )
}
