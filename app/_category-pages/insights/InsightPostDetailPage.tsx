'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { InsightPostFormDialog } from '@/components/insights/InsightPostFormDialog'
import type { InsightPostDTO } from '@/lib/insights-schemas'
import { Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  pageType?: string | null
}

interface InsightPostDetailPageProps {
  category: Category
  postId: string
}

export function InsightPostDetailPage({
  category,
  postId,
}: InsightPostDetailPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [item, setItem] = useState<InsightPostDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const variant = category.pageType === 'insights-guide' ? 'guide' : 'trend'

  const load = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      setLoading(true)
      const res = await fetch(`/api/insights/posts/${postId}`, {
        credentials: 'include',
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.status === 404) {
        setItem(null)
        return
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || '불러올 수 없습니다.')
      }
      const data = await res.json()
      setItem(data.item)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [postId, status, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    load()
  }, [status, load, router])

  const isAdmin = session?.user?.role === 'ADMIN'

  async function handleDelete() {
    try {
      setDeleting(true)
      const res = await fetch(`/api/insights/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '삭제에 실패했습니다.')
      toast.success('삭제되었습니다.')
      router.push(`/${category.slug}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '삭제 중 오류')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-8">
        <p className="text-muted-foreground">게시물을 찾을 수 없습니다.</p>
        <Button variant="link" className="mt-4 px-0" asChild>
          <Link href={`/${category.slug}`}>목록으로</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col px-4 py-4 md:px-8">
      {/* 헤더 */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-header-title mb-6">{category.name}</h1>
          <h2 className="page-header-title text-2xl">{item.title}</h2>
          {item.description ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${category.slug}`}>← 목록</Link>
          </Button>
          {isAdmin ? (
            <>
              <Button variant="default" onClick={() => setEditOpen(true)}>
                수정하기
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                삭제하기
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* HTML 문서 뷰어 (iframe으로 격리 렌더) */}
      <div className="h-[calc(100dvh-220px)] min-h-[480px] w-full overflow-hidden rounded-lg border">
        <iframe
          src={`/api/insights/posts/${postId}/view`}
          title={item.title}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        />
      </div>

      <InsightPostFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => load()}
        variant={variant}
        post={item}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 게시물을 삭제할까요?</AlertDialogTitle>
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
                handleDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
