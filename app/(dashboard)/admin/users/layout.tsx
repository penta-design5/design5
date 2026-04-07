import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('회원 관리')

export default function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
