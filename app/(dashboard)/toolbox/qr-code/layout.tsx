import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('QR 코드 생성')

export default function QrCodeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
