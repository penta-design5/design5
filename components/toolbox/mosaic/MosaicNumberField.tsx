'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** 정수 입력칸 — 입력 중에는 그대로 두고 Enter·포커스 이동 때 반영(제한은 호출하는 쪽에서 처리) */
export function NumberField({
  id,
  label,
  value,
  disabled,
  onCommit,
}: {
  id: string
  label: string
  value: number | null
  disabled: boolean
  onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (value === null ? '' : String(value))
  const commit = () => {
    if (draft !== null && draft !== '') onCommit(Number(draft))
    setDraft(null)
  }
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={shown}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            setDraft(null)
          }
        }}
      />
    </div>
  )
}
