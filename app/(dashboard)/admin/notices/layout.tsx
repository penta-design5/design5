import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('공지사항 관리')

export default function AdminNoticesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
