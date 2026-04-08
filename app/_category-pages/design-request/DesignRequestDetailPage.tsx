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
import {
  DesignRequestFormDialog,
  DesignRequestRow,
} from '@/components/design-request/DesignRequestFormDialog'
import { DesignRequestStatusBadge } from '@/components/design-request/DesignRequestStatusBadge'
import { formatDueDateLine } from '@/lib/design-request-dates'
import { Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface DesignRequestDetailPageProps {
  category: Category
  requestId: string
}

export function DesignRequestDetailPage({
  category,
  requestId,
}: DesignRequestDetailPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [item, setItem] = useState<DesignRequestRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      setLoading(true)
      const res = await fetch(`/api/design-requests/${requestId}`, {
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
  }, [requestId, status, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    load()
  }, [status, load, router])

  const canMutate =
    session?.user &&
    item &&
    (session.user.id === item.author.id || session.user.role === 'ADMIN')

  async function handleDelete() {
    try {
      setDeleting(true)
      const res = await fetch(`/api/design-requests/${requestId}`, {
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
        <p className="text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        <Button variant="link" className="mt-4 px-0" asChild>
          <Link href={`/${category.slug}`}>목록으로</Link>
        </Button>
      </div>
    )
  }

  const due = new Date(item.dueDate)

  return (
    <div className="w-full mt-1">
      <div className="mb-3">
        <h1 className="page-header-title mb-6">{category.name}</h1>
        <h2 className="page-header-title text-2xl">{item.title}</h2>
      </div>

      <dl className="space-y-4 rounded-lg border p-6">
        <div className='flex flex-col md:flex-row md:items-center gap-2'>
          <dt className="text-xs font-medium text-muted-foreground md:w-[100px]">의뢰자명</dt>
          <dd>{item.author.name || item.author.email}</dd>
        </div>
        <div className='flex flex-col md:flex-row md:items-center gap-2'>
          <dt className="text-xs font-medium text-muted-foreground md:w-[100px]">의뢰 부서/팀</dt>
          <dd>{item.departmentTeam}</dd>
        </div>
        <div className='flex flex-col md:flex-row md:items-center gap-2'>
          <dt className="text-xs font-medium text-muted-foreground md:w-[100px]">의뢰일</dt>
          <dd>
            {new Date(item.createdAt).toLocaleString('ko-KR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </dd>
        </div>
        <div className='flex flex-col md:flex-row md:items-center gap-2'>
          <dt className="text-xs font-medium text-muted-foreground md:w-[100px]">마감일</dt>
          <dd>{formatDueDateLine(due)}</dd>
        </div>
        <div className='flex flex-col md:flex-row md:items-center gap-2'>
          <dt className="text-xs font-medium text-muted-foreground md:w-[100px]">상태</dt>
          <dd>
            <DesignRequestStatusBadge status={item.status} className="text-sm py-1 px-2.5" />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">의뢰 내용</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{item.content}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Button variant="outline" asChild>
          <Link href={`/${category.slug}`}>← 목록</Link>
        </Button>
        {canMutate ? (
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button variant="default" onClick={() => setEditOpen(true)}>
              수정하기
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              삭제하기
            </Button>
          </div>
        ) : null}
      </div>

      <DesignRequestFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initial={item}
        requesterLabel={item.author.name || item.author.email}
        requesterEmail={item.author.email}
        onSuccess={() => {
          load()
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 의뢰를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 내용은 복구할 수 없습니다.
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
