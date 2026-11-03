interface HtmlMenuViewerProps {
  slug: string
  title: string
  /** config.html.updatedAt — HTML 교체 시 iframe 주소가 바뀌어 브라우저 캐시를 우회 */
  version: string
  isHidden: boolean
}

/**
 * 관리자 업로드 HTML 메뉴 뷰어. 자기완결형 HTML을 iframe으로 "그대로" 표시한다.
 * allow-same-origin을 주지 않아 HTML 안 스크립트가 사이트 쿠키·API에 접근할 수 없다.
 * 본문 풀-블리드 처리는 MainLayout의 isHtmlMenuPage 분기 참조. 계획: docs/MENU_ADMIN_구현계획.md §3.5
 */
export function HtmlMenuViewer({ slug, title, version, isHidden }: HtmlMenuViewerProps) {
  const src = `/api/menu-pages/${encodeURIComponent(slug)}/view?v=${encodeURIComponent(version)}`

  return (
    <div className="flex h-full w-full flex-col">
      {isHidden && (
        <div className="shrink-0 border-b bg-muted px-4 py-2 text-xs text-muted-foreground">
          숨김 상태의 메뉴입니다. 관리자에게만 보입니다.
        </div>
      )}
      <iframe
        src={src}
        title={title}
        className="w-full flex-1 border-0"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="clipboard-write"
      />
    </div>
  )
}
