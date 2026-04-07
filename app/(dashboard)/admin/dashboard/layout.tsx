import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('대시보드')

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
