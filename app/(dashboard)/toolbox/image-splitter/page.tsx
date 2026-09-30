'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// ImageSplitterPage를 dynamic import로 로드 (SSR 비활성화 — Konva는 브라우저 전용)
const ImageSplitterPage = dynamic(
  () => import('@/components/toolbox/image-splitter/ImageSplitterPage').then((mod) => ({ default: mod.ImageSplitterPage })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function ImageSplitterRoute() {
  return <ImageSplitterPage />
}
