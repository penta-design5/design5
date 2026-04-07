import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { EdmListPage } from '@/app/_category-pages/edm/EdmListPage'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('eDM')

export default async function EdmPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return <EdmListPage />
}
