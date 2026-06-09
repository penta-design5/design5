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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload, X, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { HardwareProductPost } from '@/lib/hardware-schemas'
import { HARDWARE_TYPES } from '@/lib/hardware-schemas'
import { getB2ImageSrc } from '@/lib/b2-client-url'
import { uploadWithPresignedEntry } from '@/lib/presigned-client-upload'

interface HardwareUploadDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  product?: HardwareProductPost | null
}

const getImageSrc = (url: string) => (url ? getB2ImageSrc(url) : '')

async function uploadToStorage(file: File): Promise<string> {
  const safeName = `hw-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')}`
  const res = await fetch('/api/posts/upload-presigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: [{ name: safeName, type: file.type, size: file.size }],
      categorySlug: 'hw',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '업로드 URL 생성에 실패했습니다.')
  }
  const { presignedUrls } = await res.json()
  const presigned = presignedUrls[0]
  const uploadRes = await uploadWithPresignedEntry(presigned, file)
  if (!uploadRes.ok) throw new Error('파일 업로드에 실패했습니다.')
  return presigned.fileUrl
}

export function HardwareUploadDialog({
  open,
  onClose,
  onSuccess,
  product,
}: HardwareUploadDialogProps) {
  const isEditing = !!product
  const [title, setTitle] = useState(product?.title || '')
  const [description, setDescription] = useState(product?.description || '')
  const [type, setType] = useState<string>(product?.type || HARDWARE_TYPES[0])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl || null
  )
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (product && open) {
      setTitle(product.title || '')
      setDescription(product.description || '')
      setType(product.type || HARDWARE_TYPES[0])
      setImagePreview(product.imageUrl || null)
      setImageFile(null)
    }
  }, [product, open])

  useEffect(() => {
    if (!open) {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setTitle('')
      setDescription('')
      setType(HARDWARE_TYPES[0])
      setImageFile(null)
      setImagePreview(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다.')
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error('파일 크기는 15MB 이하여야 합니다.')
        return
      }
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImagePreview(URL.createObjectURL(file))
      setImageFile(file)
    },
    [imagePreview]
  )

  const removeImage = useCallback(() => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setImageFile(null)
  }, [imagePreview])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    const hasImage = imageFile || (isEditing && product?.imageUrl)
    if (!hasImage) {
      toast.error('제품 이미지를 업로드해주세요.')
      return
    }

    setSaving(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) imageUrl = await uploadToStorage(imageFile)
      else if (isEditing && product?.imageUrl) imageUrl = product.imageUrl

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        imageUrl,
      }

      const url = isEditing ? `/api/hardware/${product!.id}` : '/api/hardware'
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '저장에 실패했습니다.')
      }
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }, [title, description, type, imageFile, isEditing, product, onSuccess, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '제품 수정' : '제품 추가'}</DialogTitle>
          <DialogDescription>
            제목, 설명, 제품 이미지를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hw-title">제목 *</Label>
            <Input
              id="hw-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hw-type">타입 *</Label>
            <Select value={type} onValueChange={setType} disabled={saving}>
              <SelectTrigger id="hw-type">
                <SelectValue placeholder="타입을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {HARDWARE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hw-description">설명</Label>
            <Textarea
              id="hw-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명을 입력하세요 (여러 줄)"
              rows={4}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              제품 이미지 *
            </Label>
            {imagePreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageSrc(imagePreview)}
                  alt="제품 이미지"
                  className="max-h-48 rounded-lg border object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={removeImage}
                  disabled={saving}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50"
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleSelect(f)
                    e.target.value = ''
                  }}
                />
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">클릭하여 업로드</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            썸네일은 업로드한 이미지에서 자동 생성됩니다. (최대 15MB)
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : isEditing ? (
              '수정'
            ) : (
              '추가'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
