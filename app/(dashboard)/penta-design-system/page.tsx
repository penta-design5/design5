import type { Metadata } from 'next'
import { BRAND_KO } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Penta Design System',
  description: `Penta Design System 가이드. ${BRAND_KO}에서 제공합니다.`,
}

// public/penta-design-system/penta-design-system.html(자체 완결형 문서)을
// 스타일 충돌 없이 "그대로" 표시하기 위해 iframe으로 렌더링한다.
// 본문 풀-블리드 처리는 MainLayout의 isPentaDesignSystemPage 분기 참조.
export default function PentaDesignSystemPage() {
  return (
    <iframe
      src="/penta-design-system/penta-design-system.html"
      title="Penta Design System"
      className="w-full h-full border-0"
    />
  )
}
