import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('이미지 편집')

export default function ImageEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
