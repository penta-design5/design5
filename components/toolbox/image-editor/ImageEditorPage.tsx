'use client'

import { ImageIcon } from 'lucide-react'

/**
 * TOOLBOX「이미지 편집」 페이지 골격 (P0).
 * 레이아웃은 Chart Generator와 동일: 좌측 작업 영역 + 우측 410px 옵션 패널(데스크톱).
 * 업로드·캔버스·도구는 P1부터 구현 — docs/TOOLBOX_handoff.md
 */
export function ImageEditorPage() {
  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50 dark:bg-neutral-900">
      {/* 좌측: 편집 영역 (모바일에서는 우측 패널 없음 → pr-0) */}
      <div className="flex-1 pr-0 md:pr-[410px] overflow-y-auto">
        <div className="px-8 pt-16 pb-8">
          <div className="mb-6">
            <h1 className="page-header-title">이미지 편집</h1>
            <p className="text-muted-foreground mt-2">
              이미지를 회전·자르기·크기 변경하고, 텍스트·도형·워터마크를 넣어 다운로드하세요.
            </p>
          </div>

          {/* P1에서 업로드 존 + 캔버스로 교체 */}
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card p-8 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">이미지 편집 기능을 준비 중입니다.</p>
          </div>
        </div>
      </div>

      {/* 우측: 옵션 패널 (데스크톱) — P1부터 도구별 옵션 표시 */}
      <div className="hidden md:block fixed right-0 top-0 bottom-0">
        <div className="h-full w-[410px] space-y-6 overflow-y-auto border-l bg-background p-6">
          <h2 className="text-lg font-semibold">편집 옵션</h2>
          <p className="text-sm text-muted-foreground">이미지를 불러오면 옵션이 표시됩니다.</p>
        </div>
      </div>
    </div>
  )
}
