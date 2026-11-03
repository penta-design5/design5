import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('메뉴 관리')

export default function AdminMenusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
