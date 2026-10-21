import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { EdmEditorPage } from '@/app/_category-pages/edm/EdmEditorPage'
import { segmentPageMetadata } from '@/lib/segment-page-metadata'

export const metadata: Metadata = segmentPageMetadata('eDM 편집')

export default async function EditEdmPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return <EdmEditorPage edmId={params.id} />
}
