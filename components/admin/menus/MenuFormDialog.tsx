'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getHtmlFileError } from '@/lib/html-document'
import {
  MENU_HTML_MAX_BYTES,
  MENU_SECTION_TYPES,
  createHtmlMenuSchema,
  menuNameSchema,
  type AdminMenu,
  type MenuSectionType,
} from '@/lib/menus/schemas'

/** API 오류 응답의 `{ error }` 메시지 */
export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

interface MenuFormDialogProps {
  /** null이면 HTML 메뉴 추가, 있으면 해당 메뉴 수정 */
  menu: AdminMenu | null
  defaultType: MenuSectionType
  onClose: () => void
  onSaved: () => void
}

/**
 * 메뉴 추가·수정 다이얼로그. 열 때마다 key로 다시 마운트되어 입력값이 초기화된다.
 * 기존 메뉴는 이름만, HTML 메뉴는 이름·섹션·HTML 교체를 수정한다. 계획: docs/MENU_ADMIN_구현계획.md §3.8
 */
export function MenuFormDialog({ menu, defaultType, onClose, onSaved }: MenuFormDialogProps) {
  const isCreate = menu === null
  const canEditHtml = isCreate || menu.isHtml

  const [name, setName] = useState(menu?.name ?? '')
  const [slug, setSlug] = useState(menu?.slug ?? '')
  const [type, setType] = useState<MenuSectionType>(menu?.type ?? defaultType)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setError(selected ? getHtmlFileError(selected, MENU_HTML_MAX_BYTES) : null)
  }

  const create = async () => {
    const parsed = createHtmlMenuSchema.safeParse({ name, slug, type })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.')
      return false
    }
    if (!file) {
      setError('HTML 파일을 첨부해주세요.')
      return false
    }
    const body = new FormData()
    body.append('name', parsed.data.name)
    body.append('slug', parsed.data.slug)
    body.append('type', parsed.data.type)
    body.append('file', file)
    const response = await fetch('/api/admin/menus', { method: 'POST', body })
    if (!response.ok) {
      setError(await readApiError(response, '메뉴를 추가하지 못했습니다.'))
      return false
    }
    toast.success(`'${parsed.data.name}' 메뉴를 추가했습니다.`)
    return true
  }

  const update = async (current: AdminMenu) => {
    const patch: { name?: string; type?: MenuSectionType } = {}
    const parsedName = menuNameSchema.safeParse(name)
    if (!parsedName.success) {
      setError(parsedName.error.errors[0]?.message ?? '메뉴 이름을 확인해주세요.')
      return false
    }
    if (parsedName.data !== current.name) patch.name = parsedName.data
    if (current.isHtml && type !== current.type) patch.type = type

    if (Object.keys(patch).length > 0) {
      const response = await fetch(`/api/admin/menus/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!response.ok) {
        setError(await readApiError(response, '메뉴를 수정하지 못했습니다.'))
        return false
      }
    }

    if (file) {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch(`/api/admin/menus/${current.id}/html`, { method: 'PUT', body })
      if (!response.ok) {
        setError(await readApiError(response, 'HTML 파일을 교체하지 못했습니다.'))
        return false
      }
    }

    toast.success(`'${parsedName.data}' 메뉴를 수정했습니다.`)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      const fileError = getHtmlFileError(file, MENU_HTML_MAX_BYTES)
      if (fileError) {
        setError(fileError)
        return
      }
    }
    setError(null)
    setSubmitting(true)
    try {
      const saved = isCreate ? await create() : await update(menu)
      if (saved) {
        onSaved()
        onClose()
      }
    } catch (err) {
      console.error('Error saving menu:', err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isCreate ? 'HTML 메뉴 추가' : '메뉴 수정'}</DialogTitle>
            <DialogDescription>
              {isCreate
                ? '첨부한 HTML이 메뉴 페이지에 그대로 표시됩니다. 로그인한 사용자만 볼 수 있습니다.'
                : menu.isHtml
                  ? '이름·섹션을 바꾸거나 HTML 파일을 교체할 수 있습니다.'
                  : '기존 메뉴는 이름만 바꿀 수 있습니다.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="menu-type">섹션</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as MenuSectionType)}
              disabled={!canEditHtml || submitting}
            >
              <SelectTrigger id="menu-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MENU_SECTION_TYPES.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="menu-name">메뉴 이름</Label>
            <Input
              id="menu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 브랜드 가이드"
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="menu-slug">주소(slug)</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="menu-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="brand-guide"
                disabled={!isCreate || submitting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isCreate
                ? '영문 소문자·숫자·하이픈(-)만 사용할 수 있고, 만든 뒤에는 바꿀 수 없습니다.'
                : '주소는 바꿀 수 없습니다.'}
            </p>
          </div>

          {canEditHtml && (
            <div className="space-y-2">
              <Label htmlFor="menu-file">{isCreate ? 'HTML 파일' : 'HTML 파일 교체 (선택)'}</Label>
              <Input
                id="menu-file"
                type="file"
                accept=".html,.htm,text/html"
                onChange={handleFileChange}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                {!isCreate && menu.html ? `현재 파일: ${menu.html.fileName} · ` : ''}
                이미지·CSS·JS가 HTML 안에 들어 있는 단일 .html 파일만 지원합니다(최대 {MENU_HTML_MAX_BYTES / 1024 / 1024}MB).
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreate ? '추가' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
