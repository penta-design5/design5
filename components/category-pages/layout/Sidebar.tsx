'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Settings, LogIn, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { canAccessDesignSystem } from '@/lib/access-control'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeLogo } from '@/components/ThemeLogo'
import { BRAND_KO } from '@/lib/brand'
import { buildSidebarSections, type SidebarCategory } from '@/lib/menus/sidebar-sections'
import { ScrollEdgeFades, SCROLL_EDGE_FADE_SIZE } from '@/components/ui/scroll-edge-fades'
import { SidebarItemNode } from './SidebarLink'

interface SidebarProps {
  categories: SidebarCategory[]
  className?: string
  onLinkClick?: () => void
}

export function Sidebar({ categories, className, onLinkClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [userName, setUserName] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  )
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuViewportRef = useRef<HTMLDivElement>(null)
  const userRole = session?.user?.role

  // 현재 메뉴(aria-current="page")가 메뉴 영역 밖이나 그라데이션 막 아래에 가려져 있으면 가운데로 스크롤.
  // 이미 보이는 경우(사이드바에서 직접 클릭 등)는 움직이지 않는다.
  // userRole: ADMIN 메뉴는 세션 로드 후에 그려지므로 그때 다시 확인.
  // categories는 참조 대신 개수만 본다 — 재렌더마다 다시 실행되면 사용자가 스크롤해 둔 위치를 되돌리게 됨.
  const categoryCount = categories.length
  useEffect(() => {
    const viewport = menuViewportRef.current
    const active = viewport?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!viewport || !active) return
    const v = viewport.getBoundingClientRect()
    const a = active.getBoundingClientRect()
    const visible = a.top >= v.top + SCROLL_EDGE_FADE_SIZE && a.bottom <= v.bottom - SCROLL_EDGE_FADE_SIZE
    if (visible) return
    viewport.scrollTo({ top: viewport.scrollTop + (a.top - v.top) - (v.height - a.height) / 2 })
  }, [pathname, userRole, categoryCount])

  // 최신 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/profile/me')
          if (response.ok) {
            const data = await response.json()
            setUserName(data.user.name)
            setUserAvatar(data.user.avatar)
          } else {
            // API 실패 시 세션 정보 사용
            setUserName(session.user.name || null)
            setUserAvatar(session.user.image || null)
          }
        } catch (error) {
          console.error('Error fetching user info:', error)
          // 에러 시 세션 정보 사용
          setUserName(session.user.name || null)
          setUserAvatar(session.user.image || null)
        }
      }
    }

    fetchUserInfo()
    
    // 주기적인 세션 업데이트 제거
    // 프로필 업데이트는 프로필 페이지에서 저장 시 router.refresh()로 처리
  }, [session?.user?.id, session?.user?.image, session?.user?.name, pathname]) // pathname 변경 시에도 업데이트 (프로필 페이지 이동 시)

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // 섹션·메뉴 데이터 (순서·숨김·권한 규칙: lib/menus/sidebar-sections.ts)
  const sections = buildSidebarSections({
    categories,
    isAdmin: userRole === 'ADMIN',
    showDesignSystem: canAccessDesignSystem(session?.user?.email),
  })
  const isLoggedIn = !!session

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    if (isLoggingOut) return // 이미 로그아웃 중이면 무시
    
    setIsLoggingOut(true)
    try {
      // redirect: false로 설정하여 클라이언트에서 먼저 세션 제거
      await signOut({ 
        callbackUrl: '/',
        redirect: false 
      })
      // 즉시 전체 페이지 리로드하여 홈으로 이동 (이전 페이지가 보이지 않도록)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // 에러가 발생해도 홈으로 리다이렉트
      window.location.href = '/'
    }
    // window.location.href는 페이지를 완전히 리로드하므로 finally는 실행되지 않을 수 있음
  }

  return (
    <aside
      className={cn(
        'w-56 bg-background flex flex-col',
        className
      )}
    >
      {/* 상단: LAYERARY 제목 */}
      <div className="p-6">
        <Link 
          href={session?.user?.role === 'ADMIN' ? '/admin/home' : '/'} 
          className="flex items-center" 
          title={`${BRAND_KO} 홈`}
          onClick={onLinkClick}
        >
          <ThemeLogo
            width={160}
            height={40}
            className="h-[22px] w-auto"
            priority
          />
        </Link>
      </div>

      {/* 메뉴 영역 — 스크롤이 남은 쪽(위/아래) 가장자리에 그라데이션 막 표시 */}
      <ScrollEdgeFades
        orientation="vertical"
        edgeFadeVariant="background"
        viewportRef={menuViewportRef}
        className="flex-1"
        scrollClassName="h-full"
      >
        <div className="p-4 pt-0">
          <nav className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="space-y-1">
                {section.label && (
                  <div className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.label}
                  </div>
                )}
                {section.items.map((item) => (
                  <SidebarItemNode
                    key={item.key}
                    item={item}
                    pathname={pathname}
                    isLoggedIn={isLoggedIn}
                    onNavigate={onLinkClick}
                    expandedKeys={expandedCategories}
                    onToggle={toggleCategory}
                  />
                ))}
              </div>
            ))}
          </nav>
        </div>
      </ScrollEdgeFades>

      {/* 하단: 사용자 정보 또는 로그인 버튼 */}
      <div className="p-4">
        {session ? (
          <div className="flex items-center gap-2">
            {/* 좌측: 사용자 아바타와 이름 */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors flex-1 min-w-0">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={userAvatar || session.user.image || undefined} alt={userName || session.user.name || ''} />
                <AvatarFallback className="text-xs bg-white">
                  {getInitials(userName || session.user.name, session.user.email)}
                </AvatarFallback>
              </Avatar>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm font-medium truncate cursor-default">
                    {userName || session.user.name || '사용자'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session.user.email || '이메일 없음'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          
          {/* 중간: 프로필 설정 버튼 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profile"
                className="p-2 rounded-md hover:bg-accent transition-colors flex-shrink-0"
                onClick={onLinkClick}
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>프로필 설정</p>
            </TooltipContent>
          </Tooltip>
          
          {/* 우측: 로그아웃 버튼 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="p-2 rounded-md hover:bg-accent transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        ) : (
          <Button
            onClick={() => router.push('/login')}
            variant="default"
            className="w-full"
          >
            <LogIn className="h-4 w-4 mr-2" />
            로그인
          </Button>
        )}
      </div>
    </aside>
  )
}

