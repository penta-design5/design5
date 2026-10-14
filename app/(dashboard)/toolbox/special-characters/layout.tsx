import type { Metadata } from 'next'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('특수 문자 및 이모티콘')

export default function SpecialCharactersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
