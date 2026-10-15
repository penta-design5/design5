'use client'

import { Info } from 'lucide-react'
import type { Omission } from '@/lib/toolbox/text-extractor/omissions'

/**
 * 「추출되지 않은 내용」 안내 — 결과 위에 접을 수 있는 상자(처음엔 펼침). 문서에 실제로 빠진 것이 있을 때만 그린다.
 */
export function OmissionNotice({ omissions }: { omissions: Omission[] }) {
  if (omissions.length === 0) return null
  return (
    <details open className="group rounded-md border border-amber-300 bg-amber-50 text-sm" data-testid="ocr-omissions">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [@media(pointer:coarse)]:min-h-11 font-medium text-amber-900 [&::-webkit-details-marker]:hidden">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">추출되지 않은 내용 {omissions.length}가지</span>
        <span className="text-xs font-normal text-amber-800 group-open:hidden">펼치기</span>
        <span className="hidden text-xs font-normal text-amber-800 group-open:inline">접기</span>
      </summary>
      <ul className="space-y-1.5 border-t border-amber-200 px-3 py-2">
        {omissions.map((o) => (
          <li key={o.label}>
            <span className="font-medium text-amber-950">{o.label}</span>
            {o.hint && <span className="block text-xs text-amber-900">{o.hint}</span>}
          </li>
        ))}
      </ul>
    </details>
  )
}
