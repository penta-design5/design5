'use client'

import { Copy, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Omission } from '@/lib/toolbox/text-extractor/omissions'
import { countCharacters } from '@/lib/toolbox/text-extractor/text'
import { OmissionNotice } from './OmissionNotice'

export interface ExtractResultProps {
  /** 추출한 텍스트(사용자가 고칠 수 있음). 아직 추출하지 않았으면 null */
  text: string | null
  fileName: string
  /** PDF 결과 요약(「3쪽 · PDF 글자 2쪽 · OCR 1쪽」), 이미지면 null */
  summary?: string | null
  /** 추출되지 않은 내용(없으면 안내 없음) */
  omissions?: Omission[]
  disabled?: boolean
  onTextChange: (text: string) => void
  onCopy: () => void
  onSave: () => void
}

/** 결과 — 수정 가능한 텍스트 영역 + 글자 수 + 「전체 복사」·「.txt 저장」. 우측 패널과 1280px 미만 본문 카드 공용 */
export function ExtractResult({ idPrefix, className, text, fileName, summary, omissions, disabled, onTextChange, onCopy, onSave }: ExtractResultProps & { idPrefix: string; className?: string }) {
  const id = `${idPrefix}-ocr-result`
  const empty = text === null || text.trim() === ''

  return (
    <section className={cn('flex min-h-0 flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          추출 결과
        </label>
        {text !== null && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {summary ? `${summary} · ` : ''}
            {countCharacters(text).toLocaleString()}자
          </span>
        )}
      </div>
      {text !== null && omissions && <OmissionNotice omissions={omissions} />}
      <Textarea
        id={id}
        value={text ?? ''}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={disabled || text === null}
        placeholder={text === null ? '「텍스트 추출」을 누르면 결과가 여기에 표시됩니다.' : '찾은 글자가 없습니다.'}
        className="min-h-[240px] flex-1 resize-none font-mono text-sm leading-relaxed"
        spellCheck={false}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="[@media(pointer:coarse)]:h-11" onClick={onCopy} disabled={disabled || empty}>
          <Copy className="mr-2 h-4 w-4" />
          전체 복사
        </Button>
        <Button type="button" variant="outline" className="[@media(pointer:coarse)]:h-11" onClick={onSave} disabled={disabled || empty} title={empty ? undefined : fileName}>
          <Download className="mr-2 h-4 w-4" />
          .txt 저장
        </Button>
      </div>
    </section>
  )
}
