'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { TableRowSkeleton } from '@/components/ui/table-row-skeleton'
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider'
import { MenuFormDialog, readApiError } from '@/components/admin/menus/MenuFormDialog'
import { MENU_SECTION_TYPES, type AdminMenu, type MenuSectionType } from '@/lib/menus/schemas'
import { refreshMenuCache } from './actions'

type DialogState = { menu: AdminMenu | null } | null

const COLUMNS = ['순서', '메뉴', '주소', 'HTML 파일', '표시', '작업']

function formatFileInfo(html: NonNullable<AdminMenu['html']>) {
  const size =
    html.size >= 1024 * 1024
      ? `${(html.size / 1024 / 1024).toFixed(1)}MB`
      : `${Math.max(1, Math.round(html.size / 1024))}KB`
  const date = new Date(html.updatedAt).toLocaleDateString('ko-KR')
  return `${size} · ${date}`
}

/**
 * 사이드 메뉴 관리 — WORK·SOURCE·TEMPLATE·BROCHURE·INSIGHTS 섹션의 메뉴.
 * HTML 메뉴는 추가·수정·HTML 교체·삭제, 기존 메뉴는 이름·순서·숨김만. 계획: docs/MENU_ADMIN_구현계획.md §3.8
 */
export default function AdminMenusPage() {
  const router = useRouter()
  const { confirm } = useConfirmDialog()
  const [menus, setMenus] = useState<AdminMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState<MenuSectionType>('WORK')
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [reordering, setReordering] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)

  /** 목록 조회만 담당 (실패 시 안내 후 null) */
  const loadMenus = useCallback(async (): Promise<AdminMenu[] | null> => {
    try {
      const response = await fetch('/api/admin/menus')
      if (response.status === 403) {
        router.push('/')
        return null
      }
      if (!response.ok) {
        throw new Error(await readApiError(response, '메뉴 목록을 불러오지 못했습니다.'))
      }
      const data = await response.json()
      return data.menus
    } catch (error) {
      console.error('Error fetching menus:', error)
      toast.error(error instanceof Error ? error.message : '메뉴 목록을 불러오지 못했습니다.')
      return null
    }
  }, [router])

  const fetchMenus = useCallback(async () => {
    const data = await loadMenus()
    if (data) setMenus(data)
  }, [loadMenus])

  useEffect(() => {
    let active = true
    loadMenus().then((data) => {
      if (!active) return
      if (data) setMenus(data)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [loadMenus])

  /** 변경 후 사이드바(서버 레이아웃) 갱신 + 목록 재조회 */
  const refreshAll = useCallback(async () => {
    try {
      // Server Action 응답에 캐시 만료 후 다시 그린 레이아웃이 함께 온다
      await refreshMenuCache()
    } catch (error) {
      console.error('Error refreshing menu cache:', error)
      router.refresh()
    }
    await fetchMenus()
  }, [fetchMenus, router])

  const sectionMenus = useMemo(() => menus.filter((m) => m.type === section), [menus, section])
  const countBySection = useMemo(() => {
    const counts = Object.fromEntries(MENU_SECTION_TYPES.map((t) => [t, 0])) as Record<MenuSectionType, number>
    menus.forEach((m) => counts[m.type]++)
    return counts
  }, [menus])

  const withBusy = async (id: string, task: () => Promise<void>) => {
    setBusyIds((prev) => new Set(prev).add(id))
    try {
      await task()
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleVisibleChange = (menu: AdminMenu, visible: boolean) =>
    withBusy(menu.id, async () => {
      const response = await fetch(`/api/admin/menus/${menu.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !visible }),
      })
      if (!response.ok) {
        toast.error(await readApiError(response, '표시 상태를 바꾸지 못했습니다.'))
        return
      }
      toast.success(`'${menu.name}' 메뉴를 ${visible ? '표시' : '숨김'}했습니다.`)
      await refreshAll()
    })

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sectionMenus.length) return
    const ids = sectionMenus.map((m) => m.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    setReordering(true)
    try {
      const response = await fetch('/api/admin/menus/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: section, ids }),
      })
      if (!response.ok) {
        toast.error(await readApiError(response, '순서를 바꾸지 못했습니다.'))
      }
      await refreshAll()
    } finally {
      setReordering(false)
    }
  }

  const handleDelete = async (menu: AdminMenu) => {
    const ok = await confirm(
      `'${menu.name}' 메뉴와 첨부된 HTML 파일을 삭제합니다. 삭제한 메뉴는 되돌릴 수 없습니다.`,
      { title: '메뉴 삭제', confirmText: '삭제', variant: 'destructive' }
    )
    if (!ok) return
    await withBusy(menu.id, async () => {
      const response = await fetch(`/api/admin/menus/${menu.id}`, { method: 'DELETE' })
      if (!response.ok) {
        toast.error(await readApiError(response, '메뉴를 삭제하지 못했습니다.'))
        return
      }
      toast.success(`'${menu.name}' 메뉴를 삭제했습니다.`)
      await refreshAll()
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header-title">메뉴 관리</h1>
        <p className="text-muted-foreground mt-2">
          사이드 메뉴의 WORK · SOURCE · TEMPLATE · BROCHURE · INSIGHTS 섹션 메뉴를 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-semibold">메뉴 목록</CardTitle>
            <CardDescription>
              HTML 메뉴는 추가·수정·삭제할 수 있고, 기존 메뉴는 이름·순서 변경과 숨김만 할 수 있습니다. 변경은 사이드바에 바로 반영됩니다.
            </CardDescription>
          </div>
          <Button onClick={() => setDialog({ menu: null })} disabled={loading}>
            <Plus className="mr-1 h-4 w-4" />
            HTML 메뉴 추가
          </Button>
        </CardHeader>
        <CardContent>
          {/* 섹션 탭 */}
          <div className="mb-4 flex flex-wrap items-center gap-1">
            {MENU_SECTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSection(type)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  section === type
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {type}
                <span className="ml-1.5 text-xs opacity-70">{countBySection[type]}</span>
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead key={column} className={column === '메뉴' || column === '주소' ? undefined : 'text-center'}>
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRowSkeleton key={index} columns={COLUMNS.length} />
                ))
              ) : sectionMenus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} className="py-8 text-center text-muted-foreground">
                    이 섹션에 메뉴가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                sectionMenus.map((menu, index) => {
                  const busy = busyIds.has(menu.id)
                  return (
                    <TableRow key={menu.id} className={cn(menu.isHidden && 'text-muted-foreground')}>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-5 text-center text-sm tabular-nums">{index + 1}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMove(index, -1)}
                            disabled={reordering || index === 0}
                            aria-label="위로 이동"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMove(index, 1)}
                            disabled={reordering || index === sectionMenus.length - 1}
                            aria-label="아래로 이동"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{menu.name}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-semibold',
                              menu.isHtml
                                ? 'bg-penta-indigo/10 text-penta-indigo'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {menu.isHtml ? 'HTML' : '기존'}
                          </span>
                          {menu.isHidden && (
                            <span className="rounded-full border px-2 py-0.5 text-xs">숨김</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">/{menu.slug}</TableCell>
                      <TableCell className="text-center text-sm">
                        {menu.html ? (
                          <div className="flex flex-col items-center">
                            <span className="max-w-48 truncate" title={menu.html.fileName}>
                              {menu.html.fileName}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatFileInfo(menu.html)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Switch
                              checked={!menu.isHidden}
                              onCheckedChange={(visible) => handleVisibleChange(menu, visible)}
                              aria-label={`${menu.name} 사이드바 표시`}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`/${menu.slug}`} target="_blank" rel="noopener noreferrer" aria-label="새 탭에서 열기">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDialog({ menu })}
                            disabled={busy}
                            aria-label="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {menu.isHtml && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(menu)}
                              disabled={busy}
                              aria-label="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {dialog && (
        <MenuFormDialog
          key={dialog.menu?.id ?? 'create'}
          menu={dialog.menu}
          defaultType={section}
          onClose={() => setDialog(null)}
          onSaved={refreshAll}
        />
      )}
    </div>
  )
}
