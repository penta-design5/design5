'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SubscribeButton } from '@/components/category-pages/SubscribeButton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { InsightPostDTO } from '@/lib/insights-schemas'

const PAGE_SIZES = [10, 20, 50] as const

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface InsightTrendListPageProps {
  category: Category
}

const TITLE_MAX = 40

function trendTitleDisplay(title: string): {
  display: string
  showTooltip: boolean
} {
  if (title.length > TITLE_MAX) {
    return { display: `${title.slice(0, TITLE_MAX)}…`, showTooltip: true }
  }
  return { display: title, showTooltip: false }
}

export function InsightTrendListPage({ category }: InsightTrendListPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [items, setItems] = useState<InsightPostDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const load = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      setLoading(true)
      const params = new URLSearchParams({
        categoryId: category.id,
        page: String(page),
        limit: String(pageSize),
      })
      const res = await fetch(`/api/insights/posts?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || '목록을 불러올 수 없습니다.')
      }
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [category.id, page, pageSize, status, router])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const toggleAllPage = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(items.map((r) => r.id)))
  }

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    setSelected(next)
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    try {
      setBulkDeleting(true)
      const res = await fetch('/api/insights/posts/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '삭제에 실패했습니다.')
      toast.success(`${data.deleted ?? selected.size}건 삭제되었습니다.`)
      setSelected(new Set())
      setBulkOpen(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '삭제 중 오류')
    } finally {
      setBulkDeleting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const colSpan = isAdmin ? 4 : 3

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full">
        <div className="page-header-stack">
          <div>
            <h1 className="page-header-title">{category.name}</h1>
            <p className="text-muted-foreground mt-2 mb-2 md:mb-0">
              AI 관련 최신 동향을 공유하는 게시판입니다.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <SubscribeButton categoryId={category.id} />
            {isAdmin && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="page-header-action-btn"
              >
                글쓰기
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">전체 {total.toLocaleString()}건</span>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">보기</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}줄
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && selected.size > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={() => setBulkOpen(true)}
            >
              선택 삭제 ({selected.size})
            </Button>
          ) : null}
        </div>

        <div className="rounded-md border">
          <Table className="[&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
            <TableHeader>
              <TableRow>
                {isAdmin && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        items.length > 0 && selected.size === items.length
                      }
                      onCheckedChange={(c) => toggleAllPage(!!c)}
                      aria-label="전체 선택"
                    />
                  </TableHead>
                )}
                <TableHead className="w-14 text-right">No.</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="w-40">게시일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="h-24 text-center text-muted-foreground"
                  >
                    등록된 게시물이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, index) => {
                  const no = total - (page - 1) * pageSize - index
                  const titleTable = trendTitleDisplay(row.title)
                  const linkClass =
                    'font-medium hover:underline text-[var(--penta-indigo)] dark:text-penta-sky'
                  return (
                    <TableRow key={row.id}>
                      {isAdmin && (
                        <TableCell>
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={(c) => toggleOne(row.id, !!c)}
                            aria-label="행 선택"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {no}
                      </TableCell>
                      <TableCell>
                        {titleTable.showTooltip ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/${category.slug}/${row.id}`}
                                className={linkClass}
                              >
                                {titleTable.display}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-sm whitespace-normal break-words"
                            >
                              {row.title}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Link
                            href={`/${category.slug}/${row.id}`}
                            className={linkClass}
                          >
                            {titleTable.display}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(row.createdAt).toLocaleDateString('ko-KR')}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <InsightPostFormDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            load()
            setPage(1)
          }}
          variant="trend"
          categoryId={category.id}
        />

        <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>선택한 항목을 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                {selected.size}건의 게시물이 영구 삭제됩니다. 첨부된 HTML
                문서도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkDeleting}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleBulkDelete()
                }}
                disabled={bulkDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {bulkDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '삭제'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
