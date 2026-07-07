'use client'

import { cn } from '@/lib/utils'
import type { IconPlusResource } from './types'

interface IconPlusPropertyPanelProps {
  selectedMain: IconPlusResource | null
  selectedResource: IconPlusResource | null
}

/** 대표 미리보기의 개별 슬롯 (메인 / 리소스 / 결과) */
function PreviewSlot({
  label,
  resource,
  emphasized = false,
}: {
  label: string
  resource?: IconPlusResource | null
  emphasized?: boolean
}) {
  return (
    <div
      className={cn(
        'flex aspect-square flex-1 items-center justify-center rounded-lg p-2',
        emphasized ? 'border border-primary' : ''
      )}
    >
      {resource ? (
        <span
          className="flex h-full w-full items-center justify-center text-foreground [&_svg]:h-full [&_svg]:w-full"
          // svgContent는 업로드 시 서버에서 sanitize됨
          dangerouslySetInnerHTML={{ __html: resource.svgContent }}
        />
      ) : (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  )
}

/**
 * ICON+ 속성 패널.
 *
 * Phase 3: 대표 미리보기 영역(메인 + 리소스 = 결과)의 선택 상태만 반영한다.
 * - 실시간 병합 미리보기(결과 SVG 렌더)는 Phase 5,
 * - 색상/선 두께/크기/다운로드 포맷 컨트롤은 Phase 6에서 이 컴포넌트를 확장한다.
 * @see docs/ICON_PLUS_개발계획.md §3.3, §7
 */
export function IconPlusPropertyPanel({
  selectedMain,
  selectedResource,
}: IconPlusPropertyPanelProps) {
  const hasCombination = Boolean(selectedMain && selectedResource)

  return (
    // ICON 탭 속성 패널과 동일: 화면 전체 높이 고정 + 테두리 없음(배경색 차이로 구분)
    <div className="fixed bottom-0 right-0 top-0 flex h-full w-[410px] flex-col gap-6 overflow-y-auto bg-background px-8 pb-8 pt-14">
      <div>
        <h2 className="text-xl font-bold text-foreground">아이콘 속성</h2>
        <p className="mt-1 text-sm text-muted-foreground">색상, 두께, 크기를 조정할 수 있습니다.</p>
      </div>

      {/* 대표 미리보기 — 테두리 없이 <main>(bg-background)과 동일 배경으로 패널에 자연스럽게 블렌드 */}
      <div className="rounded-lg bg-background p-4">
        <p className="text-sm font-medium text-foreground">대표 미리보기</p>
        {!hasCombination && (
          <p className="mt-1 text-sm text-muted-foreground">선택된 대표 조합 없음</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <PreviewSlot label="메인" resource={selectedMain} />
          <span className="text-muted-foreground">+</span>
          <PreviewSlot label="리소스" resource={selectedResource} />
          <span className="text-muted-foreground">=</span>
          <PreviewSlot label="결과" emphasized />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          메인 아이콘 1개와 병합용 아이콘 또는 병합용 텍스트 1개를 선택하면 병합 결과가 표시됩니다.
        </p>
      </div>

      {/* 속성/다운로드 컨트롤 자리 (Phase 5 미리보기 · Phase 6 색상/두께/크기/다운로드) */}
      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="text-xs text-muted-foreground">
          색상 · 선 두께 · 크기 · 다운로드 기능은 이후 단계에서 제공됩니다.
        </p>
      </div>
    </div>
  )
}
