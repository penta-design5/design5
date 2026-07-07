'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider'
import { ResourceSection } from '@/components/category-pages/IconCategory/iconplus/ResourceSection'
import { IconPlusPropertyPanel } from '@/components/category-pages/IconCategory/iconplus/IconPlusPropertyPanel'
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
}

/**
 * ICON+ 워크스페이스 (3영역: 메인 아이콘 / 병합용 리소스 / 속성 패널).
 *
 * Phase 3: 타입별 목록 조회·표시, 섹션 공통 헤더 액션(추가/더보기 전체 선택/선택 개수/해제/삭제),
 * 상호 배타 선택(병합용 아이콘 ↔ 텍스트)을 구현한다.
 * - 업로드 다이얼로그/anchor 입력은 Phase 4, 병합 미리보기는 Phase 5, 속성/다운로드는 Phase 6.
 * @see docs/ICON_PLUS_개발계획.md §3.3
 */
export function IconPlusWorkspace(_props: IconPlusWorkspaceProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const { confirm } = useConfirmDialog()

  const [mainResources, setMainResources] = useState<IconPlusResource[]>([])
  const [mergeIconResources, setMergeIconResources] = useState<IconPlusResource[]>([])
  const [mergeTextResources, setMergeTextResources] = useState<IconPlusResource[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingType, setDeletingType] = useState<IconPlusType | null>(null)

  const [mainSelected, setMainSelected] = useState<Set<string>>(new Set())
  const [mergeIconSelected, setMergeIconSelected] = useState<Set<string>>(new Set())
  const [mergeTextSelected, setMergeTextSelected] = useState<Set<string>>(new Set())

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

  const handleAdd = useCallback(() => {
    // Phase 4에서 업로드 다이얼로그로 대체
    toast.info('업로드 기능은 곧 제공됩니다.')
  }, [])

  const selectedMain = mainResources.find((r) => mainSelected.has(r.id)) ?? null
  const selectedResource =
    mergeIconResources.find((r) => mergeIconSelected.has(r.id)) ??
    mergeTextResources.find((r) => mergeTextSelected.has(r.id)) ??
    null

  return (
    <div className="absolute inset-0 overflow-y-auto px-8 pb-10 pt-2">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(196px,0.8fr)_minmax(440px,2fr)_minmax(300px,1fr)]">
        {/* 좌측: 메인 아이콘 */}
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
          onAdd={handleAdd}
        />

        {/* 중앙: 병합용 아이콘 + 병합용 텍스트 */}
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
            onAdd={handleAdd}
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
            gridClassName="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"
            onToggleSelect={handleToggleMergeText}
            onSelectAll={() => {
              setMergeTextSelected(new Set(mergeTextResources.map((r) => r.id)))
              setMergeIconSelected(new Set())
            }}
            onDeselectAll={() => setMergeTextSelected(new Set())}
            onDelete={() =>
              handleDelete('MERGE_TEXT', mergeTextSelected, () => setMergeTextSelected(new Set()))
            }
            onAdd={handleAdd}
          />
        </div>

        {/* 우측: 속성 패널 (데스크톱에서 상단 고정) */}
        <div className="lg:sticky lg:top-2 lg:self-start">
          <IconPlusPropertyPanel selectedMain={selectedMain} selectedResource={selectedResource} />
        </div>
      </div>
    </div>
  )
}
