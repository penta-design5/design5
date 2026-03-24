'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Loader2, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { DesktopCard } from '@/components/category-pages/DesktopCategory/DesktopCard'
import { DesktopUploadDialog } from '@/components/category-pages/DesktopCategory/DesktopUploadDialog'
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
import type { DesktopWallpaperPost } from '@/lib/desktop-schemas'

const CARD_WIDTH = 320

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface DesktopPageProps {
  category: Category
}

export function DesktopPage({ category }: DesktopPageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [wallpapers, setWallpapers] = useState<DesktopWallpaperPost[]>([])
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState<DesktopWallpaperPost[][]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editingWallpaper, setEditingWallpaper] = useState<DesktopWallpaperPost | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchWallpapers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/desktop-wallpapers?limit=100')
      if (!res.ok) throw new Error('목록을 불러오는데 실패했습니다.')
      const data = await res.json()
      setWallpapers(data.wallpapers || [])
    } catch (e) {
      console.error(e)
      toast.error('바탕화면 목록을 불러오는데 실패했습니다.')
      setWallpapers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWallpapers()
  }, [fetchWallpapers])

  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return
    const w = containerRef.current.offsetWidth
    const gap = 24
    const numCols = Math.max(1, Math.floor((w + gap) / (CARD_WIDTH + gap)))
    const cols: DesktopWallpaperPost[][] = Array(numCols)
      .fill(null)
      .map(() => [])
    wallpapers.forEach((wp) => {
      const idx = cols.reduce((min, col, i) =>
        col.length < cols[min].length ? i : min
      , 0)
      cols[idx].push(wp)
    })
    setColumns(cols)
  }, [wallpapers])

  useEffect(() => {
    calculateColumns()
    const onResize = () => calculateColumns()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calculateColumns])

  const flipKey = columns.length > 0
    ? `desktop:${columns.map((col, i) => `${i}:${col.map((w) => w.id).join(',')}`).join('|')}`
    : 'empty'

  const handleCardClick = useCallback(
    (wallpaperId: string) => {
      router.push(`/${category.slug}/${wallpaperId}`)
    },
    [category.slug, router]
  )

  const handleEdit = useCallback((wp: DesktopWallpaperPost) => {
    setEditingWallpaper(wp)
    setUploadOpen(true)
  }, [])

  const handleDeleteClick = useCallback((wallpaperId: string) => {
    setDeletingId(wallpaperId)
    setDeleteOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/desktop-wallpapers/${deletingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('삭제에 실패했습니다.')
      setWallpapers((prev) => prev.filter((w) => w.id !== deletingId))
      setDeleteOpen(false)
      setDeletingId(null)
    } catch (e) {
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }, [deletingId])

  const handleUploadSuccess = useCallback(() => {
    fetchWallpapers()
    setUploadOpen(false)
    setEditingWallpaper(null)
  }, [fetchWallpapers])

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <div className="px-8 pt-0 pb-8">
        <div className="page-header-stack">
          <div>
            <h1 className="page-header-title">{category.name}</h1>
            <p className="text-muted-foreground mt-2 mb-2 md:mb-0">
              관리자가 업로드한 바탕화면을 선택하여 제목, 설명, 캘린더를 추가하고 배경 이미지로 다운로드하세요.
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingWallpaper(null)
                setUploadOpen(true)
              }}
              className="page-header-action-btn"
            >
              바탕화면 추가
            </Button>
          )}
        </div>

        {loading && wallpapers.length === 0 && (
          <div ref={containerRef} className="masonry-container justify-center md:justify-start">
            {Array.from({ length: Math.min(4, Math.max(1, Math.floor((containerRef.current?.offsetWidth || 1200) / (CARD_WIDTH + 24)))) }).map((_, i) => (
              <div key={i} className="masonry-column" style={{ flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH, gap: 24 }}>
                {[1, 2, 3].map((j) => (
                  <PostCardSkeleton key={j} width={CARD_WIDTH} height={260} showButtons={false} />
                ))}
              </div>
            ))}
          </div>
        )}

        {!loading && wallpapers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Monitor className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground mb-2">등록된 바탕화면이 없습니다.</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">
                상단의 &quot;바탕화면 추가&quot; 버튼을 클릭하여 추가하세요.
              </p>
            )}
          </div>
        )}

        {!loading && wallpapers.length > 0 && (
          <Flipper flipKey={flipKey}>
            <div ref={containerRef} className="masonry-container justify-center md:justify-start">
              {columns.map((column, colIdx) => (
                <div
                  key={colIdx}
                  className="masonry-column"
                  style={{ flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH, gap: 24 }}
                >
                  {column.map((wp) => (
                    <Flipped key={wp.id} flipId={wp.id}>
                      <div>
                        <DesktopCard
                          wallpaper={wp}
                          onClick={handleCardClick}
                          onEdit={isAdmin ? handleEdit : undefined}
                          onDelete={isAdmin ? handleDeleteClick : undefined}
                          showActions={isAdmin}
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

      <DesktopUploadDialog
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); setEditingWallpaper(null); }}
        onSuccess={handleUploadSuccess}
        wallpaper={editingWallpaper}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>바탕화면 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 바탕화면을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
