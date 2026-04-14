import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { isSiteNoticeMode } from "@/lib/site-notice"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /** 공지 모드: `/notice` 및 Next 내부 자원만 허용, 그 외는 `/notice`로 리다이렉트 */
  if (isSiteNoticeMode()) {
    if (pathname === "/notice" || pathname.startsWith("/notice/")) {
      return NextResponse.next()
    }
    if (pathname.startsWith("/_next")) {
      return NextResponse.next()
    }
    if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
      return NextResponse.next()
    }
    // Auth.js 세션 등 JSON 응답 — 리다이렉트 시 SessionProvider가 HTML을 JSON으로 파싱하며 오류 발생
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/notice", request.url))
  }

  const session = await auth()

  // 루트 경로는 항상 접근 가능 (리다이렉트 처리됨)
  if (pathname === '/') {
    return NextResponse.next()
  }

  // 로그인/회원가입/에러 페이지는 항상 접근 가능
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/error')) {
    return NextResponse.next()
  }

  // 다이어그램 기능 비공개 (페이지)
  if (pathname === '/diagram' || pathname.startsWith('/diagram/')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // API 라우트는 별도 처리
  if (pathname.startsWith('/api/auth/register')) {
    return NextResponse.next()
  }

  // 다이어그램 API 비공개
  if (pathname.startsWith('/api/diagrams')) {
    return NextResponse.json(
      { error: '다이어그램 기능은 현재 사용할 수 없습니다.' },
      { status: 403 }
    )
  }

  // API 라우트는 별도 처리 (인증 필요 시)
  if (pathname.startsWith('/api/')) {
    // 인증이 필요한 API는 각각에서 처리
    return NextResponse.next()
  }

  // 관리자 라우트는 관리자만 접근 가능
  if (pathname.startsWith('/admin')) {
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 그 외의 모든 페이지는 로그인 여부와 관계없이 접근 가능
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

