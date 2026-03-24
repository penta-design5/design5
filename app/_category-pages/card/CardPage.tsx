'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CardGallery } from '@/components/category-pages/CardCategory/CardGallery'
import { CardEditor } from '@/components/category-pages/CardCategory/CardEditor'
import { CardAdminDialog } from '@/components/category-pages/CardCategory/CardAdminDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { CardTemplate } from '@/lib/card-schemas'
import { cardPresetStorageUtils } from '@/lib/card-schemas'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface CardPageProps {
  category: Category
}

type ViewMode = 'gallery' | 'editor'

export function CardPage({ category }: CardPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [viewMode, setViewMode] = useState<ViewMode>('gallery')
  const [templates, setTemplates] = useState<CardTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/card-templates?status=PUBLISHED')
      if (!res.ok) throw new Error('템플릿 목록을 불러오는데 실패했습니다.')
      const data = await res.json()
      setTemplates(data.templates)
    } catch (e) {
      console.error(e)
      toast.error('템플릿 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    if (templates.length > 0) {
      const ids = templates.map((t) => t.id)
      cardPresetStorageUtils.cleanupOrphanedPresets(ids)
    }
  }, [templates])

  useEffect(() => {
    const templateId = searchParams.get('templateId')
    if (templateId && templates.length > 0) {
      const t = templates.find((x) => x.id === templateId)
      if (t) {
        setSelectedTemplate(t)
        setViewMode('editor')
        router.replace(`/${category.slug}`, { scroll: false })
      }
    }
  }, [searchParams, templates, category.slug, router])

  const handleSelectTemplate = useCallback((template: CardTemplate) => {
    setSelectedTemplate(template)
    setViewMode('editor')
  }, [])

  const handleBackToGallery = useCallback(() => {
    setSelectedTemplate(null)
    setViewMode('gallery')
  }, [])

  const handleEditTemplate = useCallback((template: CardTemplate) => {
    setEditingTemplate(template)
    setAdminDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((templateId: string) => {
    setDeletingTemplateId(templateId)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTemplateId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/card-templates/${deletingTemplateId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제에 실패했습니다.')
      setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplateId))
      setDeleteDialogOpen(false)
      setDeletingTemplateId(null)
      toast.success('템플릿이 삭제되었습니다.')
    } catch (e) {
      console.error(e)
      toast.error('템플릿 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }, [deletingTemplateId])

  const handleCloseAdminDialog = useCallback(() => {
    setAdminDialogOpen(false)
    setEditingTemplate(null)
  }, [])

  const handleSaveSuccess = useCallback(() => {
    fetchTemplates()
    handleCloseAdminDialog()
  }, [fetchTemplates, handleCloseAdminDialog])

  if (viewMode === 'editor' && selectedTemplate) {
    return <CardEditor template={selectedTemplate} onBack={handleBackToGallery} />
  }

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <div className="px-8 pt-0 pb-8">
        <div className="page-header-stack">
          <div>
            <h1 className="page-header-title">{category.name}</h1>
            <p className="text-muted-foreground mt-2 mb-2 md:mb-0">
              템플릿을 선택하여 감사/연말 카드를 제작하세요. 배경을 선택하고 제목·인사말·로고를 편집한 뒤 이미지 또는 PDF로 내보낼 수 있습니다.
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setAdminDialogOpen(true)}
              className="page-header-action-btn"
            >
              템플릿 추가
            </Button>
          )}
        </div>
        <CardGallery
          templates={templates}
          loading={loading}
          isAdmin={isAdmin}
          onSelectTemplate={handleSelectTemplate}
          onEditTemplate={isAdmin ? handleEditTemplate : undefined}
          onDeleteTemplate={isAdmin ? handleDeleteClick : undefined}
        />
      </div>

      {isAdmin && (
        <CardAdminDialog
          open={adminDialogOpen}
          onClose={handleCloseAdminDialog}
          onSuccess={handleSaveSuccess}
          template={editingTemplate}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>템플릿 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
