'use client'

import { Sparkles } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface IconPlusWorkspaceProps {
  category: Category
}

/**
 * ICON+ 워크스페이스.
 *
 * Phase 1 에서는 탭 골격만 도입하므로 안내 플레이스홀더를 렌더링한다.
 * 3영역(메인 아이콘 / 병합용 리소스 / 속성 패널) 레이아웃과 병합·업로드 기능은
 * Phase 3 이후에 이 컴포넌트를 확장하여 구현한다.
 * @see docs/ICON_PLUS_개발계획.md §3.3, §11
 */
export function IconPlusWorkspace(_props: IconPlusWorkspaceProps) {
  return (
    <div className="w-full h-full flex absolute inset-0 items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="flex flex-col items-center gap-3 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-base font-medium text-foreground">ICON+ 준비 중</p>
        <p className="max-w-md text-sm text-muted-foreground">
          메인 아이콘과 병합용 리소스를 합성해 새 아이콘을 만드는 기능을 준비하고 있습니다.
          곧 이 탭에서 사용할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
