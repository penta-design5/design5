import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('디자인 시스템')

export default function AdminDesignSystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
