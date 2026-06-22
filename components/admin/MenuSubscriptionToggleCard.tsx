'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

/**
 * 메뉴 구독 알림 기능 전역 on/off 토글 (관리자 대시보드).
 * OFF면 전 메뉴에서 구독 버튼 비노출 + 게시물 추가/수정 시 메일 미발송.
 */
export function MenuSubscriptionToggleCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/app-settings/menu-subscription')
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (active) setEnabled(Boolean(data.menuSubscriptionEnabled))
      } catch {
        if (active) setEnabled(true) // 조회 실패 시 기본값(켜짐) 가정
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function handleToggle(next: boolean) {
    if (updating) return
    setUpdating(true)
    const prev = enabled
    setEnabled(next) // 낙관적 반영
    try {
      const res = await fetch('/api/app-settings/menu-subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuSubscriptionEnabled: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? '설정 변경에 실패했습니다.')
      }
      toast.success(
        next
          ? '메뉴 구독 알림이 켜졌습니다.'
          : '메뉴 구독 알림이 꺼졌습니다.'
      )
    } catch (e) {
      setEnabled(prev) // 실패 시 롤백
      toast.error(e instanceof Error ? e.message : '설정 변경에 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1.5">
          <CardTitle className="text-lg font-medium">메뉴 구독 알림</CardTitle>
          <CardDescription>
            끄면 모든 메뉴에서 구독 버튼이 숨겨지고, 게시물 추가·수정 시 구독자
            메일이 발송되지 않습니다.
          </CardDescription>
        </div>
        <div className="bg-muted-foreground/5 dark:bg-muted-foreground/15 p-3 rounded-full">
          <Mail className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {enabled === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={updating}
                aria-label="메뉴 구독 알림 전역 토글"
              />
              <span className="text-sm font-medium">
                {enabled ? '켜짐' : '꺼짐'}
              </span>
              {updating && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
