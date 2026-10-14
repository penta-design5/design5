import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('파일명 일괄 변경')

export default function BatchRenameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
