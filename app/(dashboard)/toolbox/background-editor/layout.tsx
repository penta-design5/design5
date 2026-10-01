import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('배경 편집')

export default function BackgroundEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
