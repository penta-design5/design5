'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface SubscribeButtonProps {
  categoryId: string
}

/**
 * 메뉴(카테고리) 구독/취소 토글 버튼.
 * - 전역 토글(OFF)이거나 미로그인 시 아무것도 렌더하지 않음.
 * - 미구독: `구독` (툴팁 안내) → 클릭 시 구독 + 안내 다이얼로그.
 * - 구독중: `구독 취소` → 클릭 시 취소 + toast.
 */
export function SubscribeButton({ categoryId }: SubscribeButtonProps) {
  // null = 아직 로딩 중 (렌더 보류)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [pending, setPending] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [settingsRes, subsRes] = await Promise.all([
          fetch('/api/app-settings/public'),
          fetch('/api/subscriptions'),
        ])

        const settings = settingsRes.ok ? await settingsRes.json() : null
        if (active) setEnabled(settings?.menuSubscriptionEnabled ?? false)

        if (subsRes.ok) {
          const data = await subsRes.json()
          const ids: string[] = data?.categoryIds ?? []
          if (active) setSubscribed(ids.includes(categoryId))
        } else {
          // 미로그인 등 → 구독 버튼 숨김
          if (active) setSubscribed(null)
        }
      } catch {
        if (active) {
          setEnabled(false)
          setSubscribed(null)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [categoryId])

  async function handleSubscribe() {
    if (pending) return
    setPending(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? '구독에 실패했습니다.')
      }
      setSubscribed(true)
      setDialogOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '구독에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  async function handleUnsubscribe() {
    if (pending) return
    setPending(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? '구독 취소에 실패했습니다.')
      }
      setSubscribed(false)
      toast.success('구독이 취소되었습니다.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '구독 취소에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  // 전역 OFF, 로딩 중, 미로그인 → 렌더 보류
  if (enabled !== true || subscribed === null) return null

  if (subscribed) {
    return (
      <Button
        variant="outline"
        className="page-header-action-btn"
        onClick={handleUnsubscribe}
        disabled={pending}
      >
        구독 취소
      </Button>
    )
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="page-header-action-btn"
              onClick={handleSubscribe}
              disabled={pending}
            >
              구독
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            구독 시 업데이트 내용이 자동으로 메일로 발송됩니다.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구독되었습니다</DialogTitle>
            <DialogDescription>
              업데이트가 메일로 발송됩니다. 구독 취소는 같은 버튼(&apos;구독
              취소&apos;)으로 언제든 가능합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
