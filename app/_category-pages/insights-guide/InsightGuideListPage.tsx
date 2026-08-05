'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { SubscribeButton } from '@/components/category-pages/SubscribeButton'
import { Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { PostCardSkeleton } from '@/components/ui/post-card-skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { InsightGuideCard } from '@/components/insights/InsightGuideCard'
import { InsightPostFormDialog } from '@/components/insights/InsightPostFormDialog'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import type { InsightPostDTO } from '@/lib/insights-schemas'

const CARD_WIDTH = 320
const CARD_GAP = 24 // gap-6

// 카드 폭 320px 고정 그리드. 한 행의 카드는 grid 기본값(align-items: stretch)에 의해
// 그 행에서 가장 높은 카드에 자동으로 맞춰진다(= masonry에서는 불가능했던 행 단위 정렬).
const CARD_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fill,320px)] gap-6 justify-center md:justify-start'

// 로딩 중 표시할 스켈레톤 개수(그리드가 폭에 맞춰 알아서 접는다)
const SKELETON_COUNT = 8

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface InsightGuideListPageProps {
  category: Category
}

export function InsightGuideListPage({ category }: InsightGuideListPageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const isMobileViewport = useIsMobileViewport()

  const [items, setItems] = useState<InsightPostDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InsightPostDTO | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  // 배치는 grid가 하지만, 리사이즈로 컬럼 수가 바뀌는 순간을 React가 알아야
  // Flipper가 FLIP 애니메이션을 돌릴 수 있다. 그래서 컬럼 "개수"만 state로 관측한다.
  const [columnCount, setColumnCount] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        categoryId: category.id,
        limit: '100',
      })
      const res = await fetch(`/api/insights/posts?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('목록을 불러오는데 실패했습니다.')
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) {
      console.error(e)
      toast.error('목록을 불러오는데 실패했습니다.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [category.id])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // 그리드 폭을 관측해 컬럼 수를 갱신. 값이 바뀌는 임계점에서만 setState가 일어나므로
  // 리사이즈 도중 불필요한 리렌더는 없다. (grid는 block 요소라 폭이 내용에 영향받지 않음 → 피드백 루프 없음)
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const measure = () => {
      const next = Math.max(
        1,
        Math.floor((el.offsetWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP))
      )
      setColumnCount((prev) => (prev === next ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading, items.length])

  // 컬럼 수를 포함시켜야 리사이즈 시에도 Flipper가 재배치를 애니메이션한다.
  const flipKey =
    items.length > 0
      ? `${columnCount}:${items.map((it) => it.id).join(',')}`
      : 'empty'

  const handleCardClick = useCallback(
    (id: string) => {
      router.push(`/${category.slug}/${id}`)
    },
    [category.slug, router]
  )

  const handleEdit = useCallback((it: InsightPostDTO) => {
    setEditingItem(it)
    setFormOpen(true)
  }, [])

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/insights/posts/${deletingId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('삭제에 실패했습니다.')
      setItems((prev) => prev.filter((it) => it.id !== deletingId))
      toast.success('삭제되었습니다.')
      setDeleteOpen(false)
      setDeletingId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }, [deletingId])

  const handleFormSuccess = useCallback(() => {
    fetchItems()
    setFormOpen(false)
    setEditingItem(null)
  }, [fetchItems])

  const showCardActions = isAdmin && !isMobileViewport

  return (
    <div className="w-full">
        <div className="page-header-stack">
          <div>
            <h1 className="page-header-title">{category.name}</h1>
            <p className="text-muted-foreground mt-2 mb-2 md:mb-0">
              AI 활용에 도움이 되는 가이드를 카드에서 선택해 확인하세요.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <SubscribeButton categoryId={category.id} />
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingItem(null)
                  setFormOpen(true)
                }}
                className="page-header-action-btn"
              >
                게시물 추가
              </Button>
            )}
          </div>
        </div>

        {loading && items.length === 0 && (
          <div className={CARD_GRID_CLASS}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <PostCardSkeleton
                key={i}
                width={CARD_WIDTH}
                height={200}
                showButtons={false}
              />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              등록된 가이드가 없습니다.
            </p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">
                상단의 &quot;게시물 추가&quot; 버튼을 클릭하여 추가하세요.
              </p>
            )}
          </div>
        )}

        {!loading && items.length > 0 && (
          <Flipper flipKey={flipKey}>
            <div ref={gridRef} className={CARD_GRID_CLASS}>
              {items.map((it) => (
                // translate: 위치만 애니메이션한다. 행 단위 stretch로 카드 높이가
                // 함께 바뀌는데, 기본값(scale 포함)이면 전환 중 글자가 늘어나 보인다.
                <Flipped key={it.id} flipId={it.id} translate>
                  {/* grid 아이템이므로 h-full로 행 높이를 그대로 카드에 전달한다 */}
                  <div className="h-full">
                    <InsightGuideCard
                      item={it}
                      onClick={handleCardClick}
                      onEdit={showCardActions ? handleEdit : undefined}
                      onDelete={showCardActions ? handleDeleteClick : undefined}
                      showActions={showCardActions}
                    />
                  </div>
                </Flipped>
              ))}
            </div>
          </Flipper>
        )}

      <InsightPostFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingItem(null)
        }}
        onSuccess={handleFormSuccess}
        variant="guide"
        categoryId={category.id}
        post={editingItem}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 가이드를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 내용은 복구할 수 없습니다. 첨부된 HTML 문서도 함께
              삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
