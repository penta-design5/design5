import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('텍스트추출(OCR)')

export default function TextExtractorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
