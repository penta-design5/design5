'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// TextExtractorPage를 dynamic import로 로드 (SSR 비활성화 — 파일 처리·OCR 모델 실행은 브라우저 전용)
const TextExtractorPage = dynamic(
  () => import('@/components/toolbox/text-extractor/TextExtractorPage').then((mod) => ({ default: mod.TextExtractorPage })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function TextExtractorRoute() {
  return <TextExtractorPage />
}
