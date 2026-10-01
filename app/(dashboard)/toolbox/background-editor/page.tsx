'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// BackgroundEditorPage를 dynamic import로 로드 (SSR 비활성화 — AI 모델·Worker·캔버스는 브라우저 전용)
const BackgroundEditorPage = dynamic(
  () => import('@/components/toolbox/background-editor/BackgroundEditorPage').then((mod) => ({ default: mod.BackgroundEditorPage })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function BackgroundEditorRoute() {
  return <BackgroundEditorPage />
}
