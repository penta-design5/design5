'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { QR_BYTE_CAPACITY, utf8ByteLength, type EcLevel } from '@/lib/toolbox/qr-code/options'

interface QrContentSectionProps {
  /** id 중복 방지(`sidebar` · `main`) */
  idPrefix: string
  text: string
  /** 실제 적용 중인 오류 정정(로고가 있으면 H) — 용량 안내용 */
  ecLevel: EcLevel
  rows?: number
  autoFocus?: boolean
  onTextChange: (text: string) => void
}

/** 「내용」 입력 — xl 이상은 우측 패널, 그 미만은 본문(미리보기 위)에 둔다(입력하며 미리보기를 바로 보도록) */
export function QrContentSection({ idPrefix, text, ecLevel, rows = 5, autoFocus, onTextChange }: QrContentSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">내용</h3>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:px-3" onClick={() => onTextChange('')} disabled={!text}>
          <X className="mr-1 h-3.5 w-3.5" />
          지우기
        </Button>
      </div>
      <Label htmlFor={`${idPrefix}-qr-text`} className="sr-only">
        QR 코드에 담을 URL 또는 텍스트
      </Label>
      <Textarea
        id={`${idPrefix}-qr-text`}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="https://example.com 또는 텍스트를 입력하세요"
        rows={rows}
        spellCheck={false}
        autoFocus={autoFocus}
      />
      <p className="text-xs text-muted-foreground tabular-nums">
        {text.length.toLocaleString()}자 · {utf8ByteLength(text).toLocaleString()}바이트 (복원력 {ecLevel} 기준 약{' '}
        {QR_BYTE_CAPACITY[ecLevel].toLocaleString()}바이트까지)
      </p>
      <p className="text-xs text-muted-foreground">URL이든 일반 텍스트든 입력한 그대로 담깁니다. 앞뒤 공백·줄바꿈은 제외됩니다.</p>
    </section>
  )
}
