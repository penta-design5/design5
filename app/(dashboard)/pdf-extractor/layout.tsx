import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('PDF Extractor')

export default function PdfExtractorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
