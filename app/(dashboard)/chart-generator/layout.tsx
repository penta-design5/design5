import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('Chart Generator')

export default function ChartGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
