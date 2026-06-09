'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Loader2, HardDrive } from 'lucide-react'
import { toast } from 'sonner'
import { HardwareCard } from '@/components/category-pages/HardwareCategory/HardwareCard'
import { HardwareUploadDialog } from '@/components/category-pages/HardwareCategory/HardwareUploadDialog'
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
import type { HardwareProductPost } from '@/lib/hardware-schemas'
import { HARDWARE_FILTERS } from '@/lib/hardware-schemas'
import { HorizontalScrollEdgeFades } from '@/components/ui/horizontal-scroll-edge-fades'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'

const CARD_WIDTH = 320

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface HardwareListPageProps {
  category: Category
}

export function HardwareListPage({ category }: HardwareListPageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const isMobileViewport = useIsMobileViewport()

  const [products, setProducts] = useState<HardwareProductPost[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState<HardwareProductPost[][]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<HardwareProductPost | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchProducts = useCallback(async (filter: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '100' })
      if (filter !== 'ALL') params.append('type', filter)
      const res = await fetch(`/api/hardware?${params.toString()}`)
      if (!res.ok) throw new Error('목록을 불러오는데 실패했습니다.')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (e) {
      console.error(e)
      toast.error('제품 목록을 불러오는데 실패했습니다.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts(selectedFilter)
  }, [fetchProducts, selectedFilter])

  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return
    const w = containerRef.current.offsetWidth
    const gap = 24
    const numCols = Math.max(1, Math.floor((w + gap) / (CARD_WIDTH + gap)))
    const cols: HardwareProductPost[][] = Array(numCols)
      .fill(null)
      .map(() => [])
    products.forEach((p) => {
      const idx = cols.reduce(
        (min, col, i) => (col.length < cols[min].length ? i : min),
        0
      )
      cols[idx].push(p)
    })
    setColumns(cols)
  }, [products])

  useEffect(() => {
    calculateColumns()
    const onResize = () => calculateColumns()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calculateColumns])

  const flipKey =
    columns.length > 0
      ? `hw:${selectedFilter}:${columns.map((col, i) => `${i}:${col.map((p) => p.id).join(',')}`).join('|')}`
      : 'empty'

  const handleCardClick = useCallback(
    (productId: string) => {
      if (isMobileViewport) return
      router.push(`/${category.slug}/${productId}`)
    },
    [category.slug, router, isMobileViewport]
  )

  const handleEdit = useCallback((p: HardwareProductPost) => {
    setEditingProduct(p)
    setUploadOpen(true)
  }, [])

  const handleDeleteClick = useCallback((productId: string) => {
    setDeletingId(productId)
    setDeleteOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/hardware/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제에 실패했습니다.')
      setProducts((prev) => prev.filter((p) => p.id !== deletingId))
      setDeleteOpen(false)
      setDeletingId(null)
    } catch (e) {
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }, [deletingId])

  const handleUploadSuccess = useCallback(() => {
    fetchProducts(selectedFilter)
    setUploadOpen(false)
    setEditingProduct(null)
  }, [fetchProducts, selectedFilter])

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <div className="px-8 pt-0 pb-8">
        <div className="page-header-stack">
          <div>
            <h1 className="page-header-title">{category.name}</h1>
            <p className="text-muted-foreground mt-2 mb-2 md:mb-0">
              하드웨어 제품 이미지를 선택하여 크게 보고 다운로드하세요.
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingProduct(null)
                setUploadOpen(true)
              }}
              className="page-header-action-btn"
            >
              제품 추가
            </Button>
          )}
        </div>

        {/* 필터 메뉴 (한 줄 + 가로 스크롤 + 엣지 페이드) */}
        <HorizontalScrollEdgeFades className="mb-3">
          <div className="flex flex-nowrap items-center gap-0">
            {HARDWARE_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`shrink-0 pl-0 pr-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </HorizontalScrollEdgeFades>

        {loading && products.length === 0 && (
          <div ref={containerRef} className="masonry-container justify-center md:justify-start">
            {Array.from({
              length: Math.min(
                4,
                Math.max(1, Math.floor((containerRef.current?.offsetWidth || 1200) / (CARD_WIDTH + 24)))
              ),
            }).map((_, i) => (
              <div
                key={i}
                className="masonry-column"
                style={{ flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH, gap: 24 }}
              >
                {[1, 2, 3].map((j) => (
                  <PostCardSkeleton key={j} width={CARD_WIDTH} height={260} showButtons={false} />
                ))}
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HardDrive className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground mb-2">등록된 제품이 없습니다.</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">
                상단의 &quot;제품 추가&quot; 버튼을 클릭하여 추가하세요.
              </p>
            )}
          </div>
        )}

        {!loading && products.length > 0 && (
          <Flipper flipKey={flipKey}>
            <div ref={containerRef} className="masonry-container justify-center md:justify-start">
              {columns.map((column, colIdx) => (
                <div
                  key={colIdx}
                  className="masonry-column"
                  style={{ flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH, gap: 24 }}
                >
                  {column.map((p) => (
                    <Flipped key={p.id} flipId={p.id}>
                      <div>
                        <HardwareCard
                          product={p}
                          onClick={handleCardClick}
                          onEdit={isAdmin && !isMobileViewport ? handleEdit : undefined}
                          onDelete={
                            isAdmin && !isMobileViewport ? handleDeleteClick : undefined
                          }
                          showActions={isAdmin && !isMobileViewport}
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
      </div>

      <HardwareUploadDialog
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false)
          setEditingProduct(null)
        }}
        onSuccess={handleUploadSuccess}
        product={editingProduct}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>제품 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 제품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
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
