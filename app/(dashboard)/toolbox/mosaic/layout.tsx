import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('이미지 모자이크')

export default function MosaicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
