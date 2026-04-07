import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { EdmEditorPage } from '@/app/_category-pages/edm/EdmEditorPage'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('eDM 편집')

export default async function EditEdmPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return <EdmEditorPage edmId={params.id} />
}
