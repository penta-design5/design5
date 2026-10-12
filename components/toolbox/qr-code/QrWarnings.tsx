'use client'

import { AlertTriangle } from 'lucide-react'
import type { ScanWarning } from '@/lib/toolbox/qr-code/contrast'

/** 스캔 안내(황색 목록) — 경고가 없으면 아무것도 그리지 않는다 */
export function QrWarnings({ warnings }: { warnings: ScanWarning[] }) {
  if (warnings.length === 0) return null
  return (
    <section className="space-y-2" aria-label="스캔 안내">
      <h3 className="text-sm font-semibold">스캔 안내</h3>
      <ul className="space-y-2">
        {warnings.map((w) => (
          <li
            key={w.key}
            data-warning={w.key}
            className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{w.message}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
