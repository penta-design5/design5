'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider'
import { ResourceSection } from '@/components/category-pages/IconCategory/iconplus/ResourceSection'
import { IconPlusPropertyPanel } from '@/components/category-pages/IconCategory/iconplus/IconPlusPropertyPanel'
import { IconPlusUploadDialog } from '@/components/category-pages/IconCategory/iconplus/IconPlusUploadDialog'
import { IconPlusAnchorDialog } from '@/components/category-pages/IconCategory/iconplus/IconPlusAnchorDialog'
import type { IconPlusResource, IconPlusType } from '@/components/category-pages/IconCategory/iconplus/types'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface IconPlusWorkspaceProps {
  category: Category
  /** 공통 헤더(타이틀 + 구독 버튼 + 탭 바). 좌측 컬럼(pr-[410px]) 안에 렌더되어 우측 속성 패널과 겹치지 않는다. */
  header?: ReactNode
}

/**
 * ICON+ 워크스페이스 (3영역: 메인 아이콘 / 병합용 리소스 / 속성 패널).
 *
 * Phase 3: 타입별 목록 조회·표시, 섹션 공통 헤더 액션(추가/더보기 전체 선택/선택 개수/해제/삭제),
 * 상호 배타 선택(병합용 아이콘 ↔ 텍스트)을 구현한다.
 * - 업로드 다이얼로그/anchor 입력은 Phase 4, 병합 미리보기는 Phase 5, 속성/다운로드는 Phase 6.
 * @see docs/ICON_PLUS_개발계획.md §3.3
 */
export function IconPlusWorkspace({ header }: IconPlusWorkspaceProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const { confirm } = useConfirmDialog()
  // md(768px) 미만: 속성 패널을 숨기고, 조합 선택 시 플로팅 버튼 → 우측 슬라이딩 시트로 접근
  const isMobileViewport = useIsMobileViewport()
  const [mobilePropertyOpen, setMobilePropertyOpen] = useState(false)

  const [mainResources, setMainResources] = useState<IconPlusResource[]>([])
  const [mergeIconResources, setMergeIconResources] = useState<IconPlusResource[]>([])
  const [mergeTextResources, setMergeTextResources] = useState<IconPlusResource[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingType, setDeletingType] = useState<IconPlusType | null>(null)

  const [mainSelected, setMainSelected] = useState<Set<string>>(new Set())
  const [mergeIconSelected, setMergeIconSelected] = useState<Set<string>>(new Set())
  const [mergeTextSelected, setMergeTextSelected] = useState<Set<string>>(new Set())

  // 업로드 다이얼로그 대상 타입 (null이면 닫힘)
  const [uploadType, setUploadType] = useState<IconPlusType | null>(null)
  // anchor 편집 대상 MAIN 리소스 id (null이면 닫힘)
  const [anchorEditId, setAnchorEditId] = useState<string | null>(null)

  const fetchType = useCallback(async (type: IconPlusType): Promise<IconPlusResource[]> => {
    try {
      const res = await fetch(`/api/icon-plus?type=${type}`)
      if (!res.ok) return []
      const data = await res.json()
      return (data.resources ?? []) as IconPlusResource[]
    } catch {
      return []
    }
  }, [])

  const setterFor = useCallback((type: IconPlusType) => {
    if (type === 'MAIN') return setMainResources
    if (type === 'MERGE_ICON') return setMergeIconResources
    return setMergeTextResources
  }, [])

  const refresh = useCallback(
    async (type: IconPlusType) => {
      const resources = await fetchType(type)
      setterFor(type)(resources)
    },
    [fetchType, setterFor]
  )

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [main, icons, texts] = await Promise.all([
        fetchType('MAIN'),
        fetchType('MERGE_ICON'),
        fetchType('MERGE_TEXT'),
      ])
      if (!active) return
      setMainResources(main)
      setMergeIconResources(icons)
      setMergeTextResources(texts)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [fetchType])

  // 선택 토글: 관리자는 다중 선택, 일반 사용자는 단일 선택
  const toggle = useCallback(
    (prev: Set<string>, id: string): Set<string> => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!isAdmin) next.clear()
        next.add(id)
      }
      return next
    },
    [isAdmin]
  )

  const handleToggleMain = useCallback(
    (id: string) => setMainSelected((prev) => toggle(prev, id)),
    [toggle]
  )

  // 병합용 아이콘 ↔ 텍스트 상호 배타
  const handleToggleMergeIcon = useCallback(
    (id: string) => {
      setMergeIconSelected((prev) => toggle(prev, id))
      setMergeTextSelected(new Set())
    },
    [toggle]
  )

  const handleToggleMergeText = useCallback(
    (id: string) => {
      setMergeTextSelected((prev) => toggle(prev, id))
      setMergeIconSelected(new Set())
    },
    [toggle]
  )

  const handleDelete = useCallback(
    async (type: IconPlusType, selected: Set<string>, clear: () => void) => {
      if (selected.size === 0) return
      const ok = await confirm(`선택한 ${selected.size}개의 리소스를 삭제하시겠습니까?`, {
        title: '리소스 삭제',
        variant: 'destructive',
        confirmText: '삭제',
      })
      if (!ok) return

      setDeletingType(type)
      try {
        const res = await fetch('/api/icon-plus', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selected) }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error ?? '삭제에 실패했습니다.')
        }
        const data = await res.json()
        toast.success(`${data.deletedCount ?? selected.size}개의 리소스가 삭제되었습니다.`)
        clear()
        await refresh(type)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.')
      } finally {
        setDeletingType(null)
      }
    },
    [confirm, refresh]
  )

  const handleUploadSuccess = useCallback(() => {
    if (!uploadType) return
    toast.success('리소스가 업로드되었습니다.')
    void refresh(uploadType)
  }, [uploadType, refresh])

  const handleAnchorEditSuccess = useCallback(() => {
    toast.success('anchor 좌표가 저장되었습니다.')
    void refresh('MAIN')
  }, [refresh])

  const anchorEditResource = mainResources.find((r) => r.id === anchorEditId) ?? null

  const selectedMain = mainResources.find((r) => mainSelected.has(r.id)) ?? null
  const selectedResource =
    mergeIconResources.find((r) => mergeIconSelected.has(r.id)) ??
    mergeTextResources.find((r) => mergeTextSelected.has(r.id)) ??
    null

  // 메인 + 병합용 리소스를 모두 선택해야 결과를 조정할 수 있다(모바일 플로팅 버튼/시트 노출 조건)
  const canOpenMobileProperties = Boolean(selectedMain && selectedResource)
  const mobilePropertyButtonLabel =
    selectedResource?.type === 'MERGE_TEXT'
      ? '메인 + 텍스트 : 결과 조정하기'
      : '메인 + 아이콘 : 결과 조정하기'

  // 선택 조합이 깨지면(예: 선택 해제/삭제) 열려 있던 시트도 닫는다
  useEffect(() => {
    if (!canOpenMobileProperties) setMobilePropertyOpen(false)
  }, [canOpenMobileProperties])

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50 dark:bg-neutral-900">
      {/* 좌측: 헤더 + 메인/병합용 섹션 (모바일에서는 속성 패널 없음 → pr-0) */}
      <div className="flex-1 min-w-0 pr-0 md:pr-[410px] overflow-y-auto">
        {/* 공통 헤더(타이틀 + 구독 + 탭) — 좌측 컬럼 안에 두어 우측 속성 패널과 겹치지 않음 */}
        {header}

        <div className="px-8 pb-10 pt-4">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(196px,0.8fr)_minmax(440px,2fr)]">
            {/* 메인 아이콘 */}
            <ResourceSection
              title="메인 아이콘"
              description="병합 기준점이 저장되는 원본 아이콘입니다."
              addLabel="메인 추가"
              resources={mainResources}
              selectedIds={mainSelected}
              loading={loading}
              isAdmin={isAdmin}
              deleting={deletingType === 'MAIN'}
              cardVariant="main"
              gridClassName="grid grid-cols-2 gap-3"
              onToggleSelect={handleToggleMain}
              onSelectAll={() => setMainSelected(new Set(mainResources.map((r) => r.id)))}
              onDeselectAll={() => setMainSelected(new Set())}
              onDelete={() => handleDelete('MAIN', mainSelected, () => setMainSelected(new Set()))}
              onAdd={() => setUploadType('MAIN')}
              onEditAnchor={isAdmin ? (id) => setAnchorEditId(id) : undefined}
            />

            {/* 병합용 아이콘 + 병합용 텍스트 */}
            <div className="flex flex-col gap-5">
              <ResourceSection
                title="병합용 아이콘"
                description="메인 아이콘의 절단 영역에 붙일 아이콘 리소스입니다."
                addLabel="아이콘 추가"
                resources={mergeIconResources}
                selectedIds={mergeIconSelected}
                loading={loading}
                isAdmin={isAdmin}
                deleting={deletingType === 'MERGE_ICON'}
                cardVariant="icon"
                gridClassName="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2"
                onToggleSelect={handleToggleMergeIcon}
                onSelectAll={() => {
                  setMergeIconSelected(new Set(mergeIconResources.map((r) => r.id)))
                  setMergeTextSelected(new Set())
                }}
                onDeselectAll={() => setMergeIconSelected(new Set())}
                onDelete={() =>
                  handleDelete('MERGE_ICON', mergeIconSelected, () => setMergeIconSelected(new Set()))
                }
                onAdd={() => setUploadType('MERGE_ICON')}
              />

              <ResourceSection
                title="병합용 텍스트"
                description="문자나 라벨 형태의 SVG 리소스입니다."
                addLabel="텍스트 추가"
                resources={mergeTextResources}
                selectedIds={mergeTextSelected}
                loading={loading}
                isAdmin={isAdmin}
                deleting={deletingType === 'MERGE_TEXT'}
                cardVariant="text"
                gridClassName="flex flex-wrap gap-2"
                onToggleSelect={handleToggleMergeText}
                onSelectAll={() => {
                  setMergeTextSelected(new Set(mergeTextResources.map((r) => r.id)))
                  setMergeIconSelected(new Set())
                }}
                onDeselectAll={() => setMergeTextSelected(new Set())}
                onDelete={() =>
                  handleDelete('MERGE_TEXT', mergeTextSelected, () => setMergeTextSelected(new Set()))
                }
                onAdd={() => setUploadType('MERGE_TEXT')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 우측: 속성 패널 (데스크톱) — ICON 탭과 동일하게 화면 전체 높이 고정 */}
      <div className="hidden md:block">
        <IconPlusPropertyPanel selectedMain={selectedMain} selectedResource={selectedResource} />
      </div>

      {/* 모바일: 메인 + 리소스 조합 선택 시 하단 플로팅 버튼 → 우측 슬라이딩 시트 */}
      {canOpenMobileProperties && !mobilePropertyOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
          <Button
            type="button"
            size="lg"
            className="h-12 w-full shadow-lg"
            aria-label="선택한 조합의 결과 속성 조정 패널 열기"
            onClick={() => setMobilePropertyOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
            {mobilePropertyButtonLabel}
          </Button>
        </div>
      )}

      {/* 모바일 속성 시트 — 하단에서 슬라이딩(다른 탭/페이지와 일관). Sheet는 Portal이라 뷰포트 조건으로 명시 게이팅 */}
      <Sheet
        open={Boolean(isMobileViewport && mobilePropertyOpen && canOpenMobileProperties)}
        onOpenChange={setMobilePropertyOpen}
      >
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto p-0">
          <SheetTitle className="sr-only">아이콘 속성</SheetTitle>
          <IconPlusPropertyPanel
            variant="sheet"
            selectedMain={selectedMain}
            selectedResource={selectedResource}
          />
        </SheetContent>
      </Sheet>

      {/* 업로드 다이얼로그 (관리자 전용, 섹션별 타입) */}
      {isAdmin && uploadType && (
        <IconPlusUploadDialog
          open={uploadType !== null}
          type={uploadType}
          onClose={() => setUploadType(null)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* anchor 편집 다이얼로그 (관리자 전용, 기존 MAIN 재편집) */}
      {isAdmin && (
        <IconPlusAnchorDialog
          resource={anchorEditResource}
          onClose={() => setAnchorEditId(null)}
          onSuccess={handleAnchorEditSuccess}
        />
      )}
    </div>
  )
}
