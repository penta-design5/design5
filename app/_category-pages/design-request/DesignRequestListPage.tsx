'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { DesignRequestFormDialog } from '@/components/design-request/DesignRequestFormDialog'
import { DesignRequestStatusBadge } from '@/components/design-request/DesignRequestStatusBadge'
import { formatDueDateLine } from '@/lib/design-request-dates'
import { DESIGN_REQUEST_STATUS_OPTIONS } from '@/lib/design-request-constants'
import { DesignRequestStatus } from '@prisma/client'
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const DESIGN_REQUEST_TITLE_TOOLTIP_MIN_LEN = 20

function designRequestTitleTableDisplay(title: string): {
  display: string
  showTooltip: boolean
} {
  if (title.length > DESIGN_REQUEST_TITLE_TOOLTIP_MIN_LEN) {
    return {
      display: `${title.slice(0, DESIGN_REQUEST_TITLE_TOOLTIP_MIN_LEN)}…`,
      showTooltip: true,
    }
  }
  return { display: title, showTooltip: false }
}

function ymdToDate(s: string): Date | undefined {
  if (!s?.trim()) return undefined
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return undefined
  const dt = new Date(y, m - 1, d)
  return Number.isNaN(dt.getTime()) ? undefined : dt
}

function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  return format(d, 'yyyy-MM-dd')
}

type DetailFilterDraft = {
  author: string
  dept: string
  status: string
  createdFrom: Date | undefined
  createdTo: Date | undefined
  dueFrom: Date | undefined
  dueTo: Date | undefined
}

function draftFromApplied(a: {
  author: string
  dept: string
  status: string
  createdFrom: string
  createdTo: string
  dueFrom: string
  dueTo: string
}): DetailFilterDraft {
  return {
    author: a.author,
    dept: a.dept,
    status: a.status,
    createdFrom: ymdToDate(a.createdFrom),
    createdTo: ymdToDate(a.createdTo),
    dueFrom: ymdToDate(a.dueFrom),
    dueTo: ymdToDate(a.dueTo),
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface DesignRequestListPageProps {
  category: Category
}

type Row = {
  id: string
  title: string
  departmentTeam: string
  dueDate: string
  status: DesignRequestStatus
  createdAt: string
  author: { id: string; name: string | null; email: string }
}

const PAGE_SIZES = [10, 20, 50] as const

export function DesignRequestListPage({ category }: DesignRequestListPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [items, setItems] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')

  const [filterAuthor, setFilterAuthor] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCreatedFrom, setFilterCreatedFrom] = useState('')
  const [filterCreatedTo, setFilterCreatedTo] = useState('')
  const [filterDueFrom, setFilterDueFrom] = useState('')
  const [filterDueTo, setFilterDueTo] = useState('')

  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [detailFilterDraft, setDetailFilterDraft] = useState<DetailFilterDraft>(() =>
    draftFromApplied({
      author: '',
      dept: '',
      status: '',
      createdFrom: '',
      createdTo: '',
      dueFrom: '',
      dueTo: '',
    })
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    })
    if (qDebounced.trim()) params.set('q', qDebounced.trim())
    if (filterAuthor.trim()) params.set('authorName', filterAuthor.trim())
    if (filterDept.trim()) params.set('departmentTeam', filterDept.trim())
    if (filterStatus) params.set('status', filterStatus)
    if (filterCreatedFrom) params.set('createdFrom', filterCreatedFrom)
    if (filterCreatedTo) params.set('createdTo', filterCreatedTo)
    if (filterDueFrom) params.set('dueFrom', filterDueFrom)
    if (filterDueTo) params.set('dueTo', filterDueTo)
    return params.toString()
  }, [
    page,
    pageSize,
    qDebounced,
    filterAuthor,
    filterDept,
    filterStatus,
    filterCreatedFrom,
    filterCreatedTo,
    filterDueFrom,
    filterDueTo,
  ])

  const load = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      setLoading(true)
      const res = await fetch(`/api/design-requests?${buildQuery()}`, {
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
      setItems(data.items)
      setTotal(data.total)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [buildQuery, status, router])

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

  const handleDetailFilterOpenChange = (open: boolean) => {
    setFilterPopoverOpen(open)
    if (open) {
      setDetailFilterDraft(
        draftFromApplied({
          author: filterAuthor,
          dept: filterDept,
          status: filterStatus,
          createdFrom: filterCreatedFrom,
          createdTo: filterCreatedTo,
          dueFrom: filterDueFrom,
          dueTo: filterDueTo,
        })
      )
    }
  }

  const handleDetailFilterReset = () => {
    setDetailFilterDraft({
      author: '',
      dept: '',
      status: '',
      createdFrom: undefined,
      createdTo: undefined,
      dueFrom: undefined,
      dueTo: undefined,
    })
  }

  const handleDetailFilterSearch = () => {
    setFilterAuthor(detailFilterDraft.author.trim())
    setFilterDept(detailFilterDraft.dept.trim())
    setFilterStatus(detailFilterDraft.status)
    setFilterCreatedFrom(dateToYmd(detailFilterDraft.createdFrom))
    setFilterCreatedTo(dateToYmd(detailFilterDraft.createdTo))
    setFilterDueFrom(dateToYmd(detailFilterDraft.dueFrom))
    setFilterDueTo(dateToYmd(detailFilterDraft.dueTo))
    setPage(1)
    setFilterPopoverOpen(false)
  }

  const updateRowStatus = async (id: string, newStatus: DesignRequestStatus) => {
    setStatusUpdatingId(id)
    try {
      const res = await fetch(`/api/design-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || '상태 변경에 실패했습니다.')
      }
      toast.success('상태가 변경되었습니다.')
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '상태 변경 실패')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    try {
      setBulkDeleting(true)
      const res = await fetch('/api/design-requests/bulk', {
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

  const filterActive = useMemo(() => {
    return (
      filterAuthor.trim() ||
      filterDept.trim() ||
      filterStatus ||
      filterCreatedFrom ||
      filterCreatedTo ||
      filterDueFrom ||
      filterDueTo
    )
  }, [
    filterAuthor,
    filterDept,
    filterStatus,
    filterCreatedFrom,
    filterCreatedTo,
    filterDueFrom,
    filterDueTo,
  ])

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

  return (
    <TooltipProvider delayDuration={300}>
    <div className="mx-auto px-0 py-0">
    {/* <div className="container mx-auto px-4 py-6 md:px-8"> */}
      <div className="mb-6 flex flex-row gap-4 items-center justify-between">
        <h1 className="page-header-title">{category.name}</h1>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          의뢰하기
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 md:flex-wrap items-center gap-2">
          <Input
            placeholder="제목 검색"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            className="max-w-xs"
          />
          <Popover open={filterPopoverOpen} onOpenChange={handleDetailFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" title="상세 검색">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={6}
              collisionPadding={20}
              className="w-80 max-w-[min(20rem,calc(100vw-1.5rem))] p-0 max-md:max-h-[min(65dvh,calc(100dvh-6rem))] max-md:overflow-y-auto max-md:overscroll-y-contain max-md:[-webkit-overflow-scrolling:touch] max-md:[touch-action:pan-y]"
            >
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label>의뢰자명</Label>
                  <Input
                    value={detailFilterDraft.author}
                    onChange={(e) =>
                      setDetailFilterDraft((d) => ({ ...d, author: e.target.value }))
                    }
                    placeholder="이름 또는 이메일"
                  />
                </div>
                <div className="space-y-2">
                  <Label>의뢰 부서/팀</Label>
                  <Input
                    value={detailFilterDraft.dept}
                    onChange={(e) =>
                      setDetailFilterDraft((d) => ({ ...d, dept: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>상태</Label>
                  <Select
                    value={detailFilterDraft.status || '__all__'}
                    onValueChange={(v) =>
                      setDetailFilterDraft((d) => ({
                        ...d,
                        status: v === '__all__' ? '' : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">전체</SelectItem>
                      <SelectItem value="REQUESTED">요청</SelectItem>
                      <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                      <SelectItem value="COMPLETED">완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>의뢰일 (시작)</Label>
                  <DatePicker
                    value={detailFilterDraft.createdFrom}
                    onChange={(date) =>
                      setDetailFilterDraft((d) => ({ ...d, createdFrom: date }))
                    }
                    placeholder="시작일 선택"
                  />
                </div>
                <div className="space-y-2">
                  <Label>의뢰일 (종료)</Label>
                  <DatePicker
                    value={detailFilterDraft.createdTo}
                    onChange={(date) =>
                      setDetailFilterDraft((d) => ({ ...d, createdTo: date }))
                    }
                    placeholder="종료일 선택"
                  />
                </div>
                <div className="space-y-2">
                  <Label>마감일 (시작)</Label>
                  <DatePicker
                    value={detailFilterDraft.dueFrom}
                    onChange={(date) =>
                      setDetailFilterDraft((d) => ({ ...d, dueFrom: date }))
                    }
                    placeholder="시작일 선택"
                  />
                </div>
                <div className="space-y-2">
                  <Label>마감일 (종료)</Label>
                  <DatePicker
                    value={detailFilterDraft.dueTo}
                    onChange={(date) =>
                      setDetailFilterDraft((d) => ({ ...d, dueTo: date }))
                    }
                    placeholder="종료일 선택"
                  />
                </div>
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDetailFilterReset}
                    className="flex-1"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    초기화
                  </Button>
                  <Button type="button" onClick={handleDetailFilterSearch} className="flex-1">
                    <Search className="mr-2 h-4 w-4" />
                    검색
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
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
      </div>

      <div className="rounded-md border">
        <Table className="[&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={items.length > 0 && selected.size === items.length}
                    onCheckedChange={(c) => toggleAllPage(!!c)}
                    aria-label="전체 선택"
                  />
                </TableHead>
              )}
              <TableHead className="w-14 text-right">No.</TableHead>
              <TableHead>의뢰 제목</TableHead>
              <TableHead>의뢰자명</TableHead>
              <TableHead>의뢰 부서/팀</TableHead>
              <TableHead>의뢰일</TableHead>
              <TableHead>마감일</TableHead>
              <TableHead className='text-center'>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 8 : 7}
                  className="h-24 text-center text-muted-foreground"
                >
                  등록된 의뢰가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row, index) => {
                const no = total - (page - 1) * pageSize - index
                const due = new Date(row.dueDate)
                const isCompleted = row.status === 'COMPLETED'
                const titleTable = designRequestTitleTableDisplay(row.title)
                const linkClass = cn(
                  'font-medium hover:underline',
                  isCompleted
                    ? 'text-muted-foreground'
                    : 'text-[var(--penta-indigo)] dark:text-penta-sky'
                )
                return (
                  <TableRow
                    key={row.id}
                    className={
                      isCompleted ? 'text-muted-foreground' : undefined
                    }
                  >
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(row.id)}
                          onCheckedChange={(c) => toggleOne(row.id, !!c)}
                          aria-label="행 선택"
                        />
                      </TableCell>
                    )}
                    <TableCell
                      className={cn(
                        'text-right tabular-nums',
                        !isCompleted && 'text-muted-foreground'
                      )}
                    >
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
                    <TableCell>{row.author.name || row.author.email}</TableCell>
                    <TableCell>{row.departmentTeam}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(row.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="min-w-[200px] text-sm">
                      {formatDueDateLine(due)}
                    </TableCell>
                    <TableCell className="text-center">
                      {isAdmin ? (
                        <div
                          className="flex justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusUpdatingId === row.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <Select
                              value={row.status}
                              onValueChange={(v) =>
                                updateRowStatus(row.id, v as DesignRequestStatus)
                              }
                            >
                              <SelectTrigger className="h-8 w-[80px] shrink-0 text-xs px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="w-[90px] min-w-[90px] max-w-[90px]">
                                {DESIGN_REQUEST_STATUS_OPTIONS.map((o) => (
                                  <SelectItem
                                    key={o.value}
                                    value={o.value}
                                    className="pr-1 pl-6"
                                  >
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ) : (
                        <DesignRequestStatusBadge status={row.status} />
                      )}
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

      <DesignRequestFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        requesterLabel={session.user.name || session.user.email || '사용자'}
        requesterEmail={session.user.email || ''}
        onSuccess={() => {
          load()
          setPage(1)
        }}
      />

      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택한 항목을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected.size}건의 의뢰가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleBulkDelete()
              }}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  )
}
