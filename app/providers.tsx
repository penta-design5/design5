'use client'

import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 개발 환경에서만 경고 필터링
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn
      console.warn = (...args: any[]) => {
        // 정확히 이 메시지만 필터링 (매우 구체적으로)
        const message = args[0]?.toString() || ''
        if (
          message.includes('Skipping auto-scroll behavior due to `position: sticky` or `position: fixed`')
        ) {
          return // 이 경고만 무시
        }
        // 나머지 모든 경고는 정상적으로 표시
        originalWarn.apply(console, args)
      }

      // 컴포넌트 언마운트 시 원래 함수로 복원
      return () => {
        console.warn = originalWarn
      }
    }
  }, [])

  // 테마 전환 UI가 숨겨진 상태이므로 라이트 모드로 고정한다.
  // defaultTheme="system" + enableSystem 이면 Windows 다크 모드 사용자에게
  // OS 설정이 그대로 적용되어(.dark), 미유지 상태인 다크 팔레트 때문에
  // 검정 배경 + 검정 텍스트로 본문이 보이지 않는다.
  // 테마 기능을 정식 공개할 때 defaultTheme="system" enableSystem 으로 되돌린다.
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider delayDuration={300}>
        <SessionProvider>
          <ConfirmDialogProvider>
            {children}
            <Toaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                },
              }}
            />
          </ConfirmDialogProvider>
        </SessionProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}