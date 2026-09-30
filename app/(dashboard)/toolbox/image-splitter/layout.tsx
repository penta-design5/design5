import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('이미지 분할')

export default function ImageSplitterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
