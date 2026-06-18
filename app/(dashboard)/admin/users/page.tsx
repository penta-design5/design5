'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { UserRole } from '@prisma/client'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { TableRowSkeleton } from '@/components/ui/table-row-skeleton'

interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  role: UserRole
  receiveDesignRequestMail: boolean
  createdAt: string
  updatedAt: string
  _count: {
    posts: number
    notices: number
  }
}

type RoleFilter = 'ALL' | UserRole

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Set<string>>(new Set())
  const [updatingMail, setUpdatingMail] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<RoleFilter>('ALL')

  // 관리자 우선 정렬 (관리자 → 사용자, 그룹 내에서는 이름/이메일순)
  const sortedUsers = useMemo(() => {
    const roleOrder: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.MEMBER]: 1,
    }
    return [...users].sort((a, b) => {
      if (a.role !== b.role) return roleOrder[a.role] - roleOrder[b.role]
      return (a.name || a.email).localeCompare(b.name || b.email, 'ko')
    })
  }, [users])

  const adminCount = useMemo(
    () => users.filter((u) => u.role === UserRole.ADMIN).length,
    [users]
  )
  const memberCount = users.length - adminCount

  const visibleUsers = useMemo(
    () =>
      filter === 'ALL'
        ? sortedUsers
        : sortedUsers.filter((u) => u.role === filter),
    [sortedUsers, filter]
  )

  const filterTabs: { value: RoleFilter; label: string; count: number }[] = [
    { value: 'ALL', label: '전체', count: users.length },
    { value: UserRole.ADMIN, label: '관리자', count: adminCount },
    { value: UserRole.MEMBER, label: '사용자', count: memberCount },
  ]

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (response.status === 403) {
        router.push('/')
        return
      }

      if (!response.ok) {
        throw new Error('사용자 목록을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdating((prev) => new Set(prev).add(userId))

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '역할 변경에 실패했습니다.')
      }

      // 로컬 상태 업데이트
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      )
    } catch (error: any) {
      console.error('Error updating role:', error)
      toast.error(error.message || '역할 변경에 실패했습니다.')
    } finally {
      setUpdating((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  // 디자인 의뢰 알림 메일 수신 여부 토글(관리자 대상)
  const handleMailToggle = async (userId: string, next: boolean) => {
    try {
      setUpdatingMail((prev) => new Set(prev).add(userId))

      const response = await fetch(`/api/admin/users/${userId}/notification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiveDesignRequestMail: next }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '알림 설정 변경에 실패했습니다.')
      }

      // 로컬 상태 업데이트
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, receiveDesignRequestMail: next }
            : user
        )
      )
    } catch (error) {
      console.error('Error updating mail preference:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : '알림 설정 변경에 실패했습니다.'
      )
    } finally {
      setUpdatingMail((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const getRoleLabel = (role: UserRole) => {
    return role === UserRole.ADMIN ? '관리자' : '사용자'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-header-title">회원 관리</h1>
          <p className="text-muted-foreground mt-2">
            등록된 모든 회원의 정보를 관리하고 권한을 부여합니다.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>회원 목록</CardTitle>
            <CardDescription>등록된 회원 정보를 불러오는 중...</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead className='text-center'>역할</TableHead>
                  <TableHead className='text-center'>의뢰 알림</TableHead>
                  <TableHead className='text-center'>게시물 수</TableHead>
                  <TableHead className='text-center'>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton key={index} columns={5} showAvatar={true} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header-title">회원 관리</h1>
        <p className="text-muted-foreground mt-2">
          등록된 모든 회원의 정보를 관리하고 권한을 부여합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>회원 목록</CardTitle>
          <CardDescription>등록된 회원은 총 <strong className='text-penta-indigo'>{users.length}</strong>명(관리자 <strong className='text-penta-indigo'>{adminCount}</strong> · 사용자 <strong className='text-penta-indigo'>{memberCount}</strong>)이며, 역할(권한)은 변경 즉시 적용됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 역할 필터 탭 */}
          <div className="flex items-center gap-1 mb-4">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  filter === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead className='text-center'>역할</TableHead>
                <TableHead className='text-center'>의뢰 알림</TableHead>
                <TableHead className='text-center'>게시물 수</TableHead>
                <TableHead className='text-center'>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {users.length === 0
                      ? '등록된 사용자가 없습니다.'
                      : '해당하는 회원이 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                visibleUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn(
                      user.role === UserRole.ADMIN &&
                        'bg-penta-indigo/5 hover:bg-penta-indigo/10'
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
                          <AvatarFallback>
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.name || '이름 없음'}
                        </span>
                        {user.role === UserRole.ADMIN && (
                          <span className="rounded-full bg-penta-indigo/10 px-2 py-0.5 text-xs font-semibold text-penta-indigo">
                            관리자
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {updating.has(user.id) ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-muted-foreground">변경 중...</span>
                        </div>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value as UserRole)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UserRole.MEMBER}>사용자</SelectItem>
                            <SelectItem value={UserRole.ADMIN}>관리자</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className='text-center'>
                      {/* 디자인 의뢰 알림은 관리자만 수신 — 사용자 역할은 해당 없음(—) */}
                      {user.role === UserRole.ADMIN ? (
                        <div className="flex items-center justify-center gap-2">
                          {updatingMail.has(user.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Switch
                              checked={user.receiveDesignRequestMail}
                              onCheckedChange={(next) =>
                                handleMailToggle(user.id, next)
                              }
                              aria-label="디자인 의뢰 알림 메일 수신"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className='text-center'>{user._count.posts}</TableCell>
                    <TableCell className='text-center'>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

