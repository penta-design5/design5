'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// BatchRenamePage를 dynamic import로 로드 (SSR 비활성화 — File·클립보드·ZIP 생성은 브라우저 전용)
const BatchRenamePage = dynamic(
  () => import('@/components/toolbox/batch-rename/BatchRenamePage').then((mod) => ({ default: mod.BatchRenamePage })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function BatchRenameRoute() {
  return <BatchRenamePage />
}
