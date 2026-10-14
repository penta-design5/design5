'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BASE_NAME_MAX_LENGTH,
  DIGITS_RANGE,
  FORBIDDEN_CHARS_LABEL,
  type RuleField,
  type SanitizedBaseName,
} from '@/lib/toolbox/batch-rename/name'

export interface RuleInputs {
  baseName: string
  startText: string
  digitsText: string
}

export interface RuleFieldsProps {
  /** id 중복 방지(우측 패널 / 본문) */
  idPrefix: string
  /** stack: 우측 패널(세로) / inline: 1280px 미만 본문 카드(넓으면 한 줄) */
  layout: 'stack' | 'inline'
  inputs: RuleInputs
  errors: Partial<Record<RuleField, string>>
  sanitized: SanitizedBaseName
  /** ZIP 만드는 중에는 잠근다 */
  disabled: boolean
  onInputsChange: (patch: Partial<RuleInputs>) => void
}

/** 이름 규칙 입력 — 공통 이름 · 시작 번호 · 번호 자릿수(D1·D7). 우측 패널과 1280px 미만 본문 카드가 함께 쓴다 */
export function RuleFields({ idPrefix, layout, inputs, errors, sanitized, disabled, onInputsChange }: RuleFieldsProps) {
  const id = (name: string) => `batch-rename-${idPrefix}-${name}`
  const inline = layout === 'inline'
  const baseNotes = [
    sanitized.replacedChars && `쓸 수 없는 문자(${FORBIDDEN_CHARS_LABEL})는 _로 바뀝니다.`,
    sanitized.trimmedEnd && '끝의 공백·점은 지웁니다.',
    sanitized.reserved && 'Windows에서 쓸 수 없는 이름이라 뒤에 _를 붙입니다.',
  ].filter(Boolean) as string[]

  return (
    <fieldset
      disabled={disabled}
      className={cn('min-w-0', inline ? 'grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem]' : 'space-y-6')}
    >
      <div className={cn('space-y-2', inline && 'col-span-2 sm:col-span-1')}>
        <Label htmlFor={id('base')}>공통 이름</Label>
        <Input
          id={id('base')}
          value={inputs.baseName}
          maxLength={BASE_NAME_MAX_LENGTH}
          placeholder="예: 상품이미지"
          autoComplete="off"
          aria-describedby={id('base-help')}
          onChange={(e) => onInputsChange({ baseName: e.target.value })}
        />
        <div id={id('base-help')} className="space-y-1 text-xs">
          {baseNotes.map((note) => (
            <p key={note} className="text-amber-700">
              {note}
            </p>
          ))}
          <p className="text-muted-foreground">비워 두면 번호만 붙습니다(예: 001.png).</p>
        </div>
      </div>

      <div className={cn(!inline && 'grid grid-cols-2 gap-3', inline && 'contents')}>
        <div className="space-y-2">
          <Label htmlFor={id('start')}>시작 번호</Label>
          <Input
            id={id('start')}
            value={inputs.startText}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={Boolean(errors.start)}
            aria-describedby={errors.start ? id('start-error') : undefined}
            onChange={(e) => onInputsChange({ startText: e.target.value })}
          />
          {errors.start && (
            <p id={id('start-error')} className="text-xs text-red-700">
              {errors.start}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={id('digits')}>번호 자릿수</Label>
          <Input
            id={id('digits')}
            value={inputs.digitsText}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={Boolean(errors.digits)}
            aria-describedby={errors.digits ? id('digits-error') : id('digits-help')}
            onChange={(e) => onInputsChange({ digitsText: e.target.value })}
          />
          {errors.digits ? (
            <p id={id('digits-error')} className="text-xs text-red-700">
              {errors.digits}
            </p>
          ) : (
            <p id={id('digits-help')} className="text-xs text-muted-foreground">
              {DIGITS_RANGE.min}~{DIGITS_RANGE.max}자리, 모자라면 앞을 0으로 채웁니다.
            </p>
          )}
        </div>
      </div>
    </fieldset>
  )
}
