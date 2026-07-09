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
  const [columns, setColumns] = useState<InsightPostDTO[][]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InsightPostDTO | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return
    const w = containerRef.current.offsetWidth
    const gap = 24
    const numCols = Math.max(1, Math.floor((w + gap) / (CARD_WIDTH + gap)))
    const cols: InsightPostDTO[][] = Array(numCols)
      .fill(null)
      .map(() => [])
    items.forEach((it) => {
      const idx = cols.reduce(
        (min, col, i) => (col.length < cols[min].length ? i : min),
        0
      )
      cols[idx].push(it)
    })
    setColumns(cols)
  }, [items])

  useEffect(() => {
    calculateColumns()
    const onResize = () => calculateColumns()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calculateColumns])

  const flipKey =
    columns.length > 0
      ? columns
          .map((col, i) => `${i}:${col.map((it) => it.id).join(',')}`)
          .join('|')
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
          <div
            ref={containerRef}
            className="masonry-container justify-center md:justify-start"
          >
            {Array.from({
              length: Math.min(
                4,
                Math.max(
                  1,
                  Math.floor(
                    (containerRef.current?.offsetWidth || 1200) /
                      (CARD_WIDTH + 24)
                  )
                )
              ),
            }).map((_, i) => (
              <div
                key={i}
                className="masonry-column"
                style={{ flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH, gap: 24 }}
              >
                {[1, 2, 3].map((j) => (
                  <PostCardSkeleton
                    key={j}
                    width={CARD_WIDTH}
                    height={260}
                    showButtons={false}
                  />
                ))}
              </div>
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
            <div
              ref={containerRef}
              className="masonry-container justify-center md:justify-start"
            >
              {columns.map((column, colIdx) => (
                <div
                  key={colIdx}
                  className="masonry-column"
                  style={{
                    flex: `0 0 ${CARD_WIDTH}px`,
                    width: CARD_WIDTH,
                    gap: 24,
                  }}
                >
                  {column.map((it) => (
                    <Flipped key={it.id} flipId={it.id}>
                      <div>
                        <InsightGuideCard
                          item={it}
                          onClick={handleCardClick}
                          onEdit={showCardActions ? handleEdit : undefined}
                          onDelete={
                            showCardActions ? handleDeleteClick : undefined
                          }
                          showActions={showCardActions}
                          showHoverEditLabel={!isMobileViewport}
                        />
                      </div>
                    </Flipped>
                  ))}
                </div>
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
