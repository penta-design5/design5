'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// MosaicPage를 dynamic import로 로드 (SSR 비활성화 — Konva는 브라우저 전용)
const MosaicPage = dynamic(
  () => import('@/components/toolbox/mosaic/MosaicPage').then((mod) => ({ default: mod.MosaicPage })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function MosaicRoute() {
  return <MosaicPage />
}
