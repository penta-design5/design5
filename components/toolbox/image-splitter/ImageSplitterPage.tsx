'use client'

/**
 * TOOLBOX「이미지 분할」 — 모든 처리는 브라우저에서만 수행(서버 전송 없음).
 * 레이아웃: 좌측 작업 영역 + 우측 410px 옵션 패널(xl 이상), xl 미만은 「편집 옵션」 Sheet(P4) — 이미지 편집과 동일.
 * 개발 중에는 사이드바(TOOLBOX_MENU)에 노출하지 않는다(P4에서 등록).
 * 구현 기록: docs/TOOLBOX_image-splitter_handoff.md
 */
export function ImageSplitterPage() {
  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50">
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        <div className="flex h-full flex-col px-8 pt-16 pb-8">
          <div className="mb-4">
            <h1 className="page-header-title">이미지 분할</h1>
            <p className="text-muted-foreground mt-2">
              이미지를 2·4·8·16조각으로 나눠 ZIP으로 저장하세요. 이미지는 서버로 전송되지 않습니다.
            </p>
          </div>
          <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-lg border-2 border-dashed bg-card text-sm text-muted-foreground">
            준비 중입니다
          </div>
        </div>
      </div>

      <div className="hidden xl:block fixed right-0 top-0 bottom-0">
        <div className="h-full w-[410px] space-y-6 overflow-y-auto border-l bg-background p-6">
          <h2 className="text-lg font-semibold">편집 옵션</h2>
          <p className="text-sm text-muted-foreground">이미지를 불러오면 옵션이 표시됩니다.</p>
        </div>
      </div>
    </div>
  )
}
