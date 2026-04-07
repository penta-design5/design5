import type { Metadata } from 'next'
import { BRAND_KO, DEFAULT_DESCRIPTION } from '@/lib/brand'

/**
 * `app/(dashboard)/[slug]/page.tsx`의 generateMetadata와 동일한 패턴:
 * - 탭 제목: `title` + 루트 `title.template` → `{title} | Desing5`
 * - OG/Twitter 제목: `{title} | 디자인5`
 */
export function segmentPageMetadata(segmentTitle: string): Metadata {
  const description = `${segmentTitle}. ${DEFAULT_DESCRIPTION}`
  const ogTitle = `${segmentTitle} | ${BRAND_KO}`
  return {
    title: segmentTitle,
    description,
    openGraph: {
      title: ogTitle,
      description,
    },
    twitter: {
      title: ogTitle,
      description,
    },
  }
}
