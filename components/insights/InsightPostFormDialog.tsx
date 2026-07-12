'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Upload, X, FileCode2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  INSIGHT_HTML_MAX_BYTES,
  INSIGHT_CARD_COLOR_PRESETS,
  hasHtmlExtension,
  type InsightPostDTO,
} from '@/lib/insights-schemas'
import { Check } from 'lucide-react'

interface InsightPostFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** guide: 설명 필드 노출 / trend: 제목·HTML만 */
  variant: 'guide' | 'trend'
  /** 생성 시 필수 */
  categoryId?: string
  /** 수정 시 전달 */
  post?: InsightPostDTO | null
}

export function InsightPostFormDialog({
  open,
  onClose,
  onSuccess,
  variant,
  categoryId,
  post,
}: InsightPostFormDialogProps) {
  const isEditing = !!post
  const showGuideFields = variant === 'guide'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cardColor, setCardColor] = useState('') // '' = 기본 중립색
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const htmlInputRef = useRef<HTMLInputElement>(null)

  // 열릴 때 초기값 설정 / 닫힐 때 리셋
  useEffect(() => {
    if (open) {
      setTitle(post?.title || '')
      setDescription(post?.description || '')
      setCardColor(post?.cardColor || '')
      setHtmlFile(null)
    } else {
      setTitle('')
      setDescription('')
      setCardColor('')
      setHtmlFile(null)
    }
  }, [open, post])

  const handleHtmlSelect = useCallback((file: File) => {
    if (!hasHtmlExtension(file.name)) {
      toast.error('HTML 문서(.html) 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > INSIGHT_HTML_MAX_BYTES) {
      toast.error('HTML 문서는 5MB 이하만 업로드할 수 있습니다.')
      return
    }
    setHtmlFile(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!saving) setDragActive(true)
  }, [saving])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (saving) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleHtmlSelect(file)
  }, [saving, handleHtmlSelect])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    if (!isEditing && !htmlFile) {
      toast.error('HTML 문서를 첨부해주세요.')
      return
    }
    if (!isEditing && !categoryId) {
      toast.error('카테고리 정보가 없습니다.')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      if (showGuideFields) {
        fd.append('description', description.trim())
        fd.append('cardColor', cardColor) // '' = 기본 중립색
      }
      if (htmlFile) fd.append('htmlFile', htmlFile)
      if (!isEditing && categoryId) fd.append('categoryId', categoryId)

      const url = isEditing
        ? `/api/insights/posts/${post!.id}`
        : '/api/insights/posts'
      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        body: fd,
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '저장에 실패했습니다.')
      }
      toast.success(isEditing ? '수정되었습니다.' : '등록되었습니다.')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }, [
    title,
    description,
    cardColor,
    htmlFile,
    showGuideFields,
    isEditing,
    categoryId,
    post,
    onSuccess,
    onClose,
  ])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '게시물 수정' : '게시물 등록'}</DialogTitle>
          <DialogDescription>
            제목과 HTML 문서를 첨부하세요. HTML은 이미지/CSS/JS가 모두 포함된
            자기완결형 단일 파일이어야 합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="insight-title">제목 *</Label>
            <Input
              id="insight-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              disabled={saving}
            />
          </div>

          {showGuideFields && (
            <div className="space-y-2">
              <Label htmlFor="insight-description">설명</Label>
              <Textarea
                id="insight-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="카드에 표시할 간단한 설명 (선택)"
                rows={3}
                disabled={saving}
              />
            </div>
          )}

          {showGuideFields && (
            <div className="space-y-2">
              <Label>카드 하단 테두리 색</Label>
              <p className="text-xs text-muted-foreground">
                카드 배경은 흰색 그라데이션으로 고정되며, 하단 테두리(3px)
                색상만 선택합니다. 미선택 시 강조 없이 기본 테두리로 표시됩니다.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {/* 기본(강조 없음) — 실제 카드처럼 은은한 배경 미리보기 */}
                <button
                  type="button"
                  title="기본 (강조 없음)"
                  aria-label="기본 (강조 없음)"
                  disabled={saving}
                  onClick={() => setCardColor('')}
                  className={`relative h-10 w-14 rounded-md border bg-gradient-to-br from-white to-[#F7F8FA] transition-shadow ${
                    cardColor === ''
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'hover:shadow'
                  }`}
                >
                  {cardColor === '' && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-neutral-600" />
                  )}
                </button>
                {INSIGHT_CARD_COLOR_PRESETS.map((preset) => {
                  const selected = cardColor === preset.value
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      title={preset.label}
                      aria-label={preset.label}
                      disabled={saving}
                      onClick={() => setCardColor(preset.value)}
                      className={`relative h-10 w-14 rounded-md border bg-gradient-to-br from-white to-[#F7F8FA] transition-shadow ${
                        selected
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'hover:shadow'
                      }`}
                      style={{
                        borderBottomWidth: '3px',
                        borderBottomColor: preset.value,
                      }}
                    >
                      {selected && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-neutral-600" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* HTML 문서 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4" />
              HTML 문서 {isEditing ? '(교체 시에만 선택)' : '*'}
            </Label>
            <input
              ref={htmlInputRef}
              type="file"
              accept=".html,.htm,text/html"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleHtmlSelect(f)
                e.target.value = ''
              }}
            />
            {htmlFile ? (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="truncate">{htmlFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setHtmlFile(null)}
                  disabled={saving}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => htmlInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {dragActive
                    ? '여기에 .html 파일을 놓으세요'
                    : '클릭하거나 .html 파일을 드래그하여 업로드 (최대 5MB)'}
                </span>
              </div>
            )}
            {isEditing && !htmlFile && (
              <p className="text-xs text-muted-foreground">
                현재 문서: {post?.htmlFileName}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : isEditing ? (
              '수정'
            ) : (
              '등록'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
