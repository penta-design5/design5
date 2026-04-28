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
import { Loader2, Upload, X, Monitor, Laptop } from 'lucide-react'
import { toast } from 'sonner'
import type { DesktopWallpaperPost } from '@/lib/desktop-schemas'
import { getB2ImageSrc } from '@/lib/b2-client-url'
import { uploadWithPresignedEntry } from '@/lib/presigned-client-upload'

interface DesktopUploadDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  wallpaper?: DesktopWallpaperPost | null
}

const getImageSrc = (url: string) => (url ? getB2ImageSrc(url) : '')

async function uploadToB2(file: File, prefix: string): Promise<string> {
  const safeName = `wallpaper-${prefix}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')}`
  const res = await fetch('/api/posts/upload-presigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: [{ name: safeName, type: file.type, size: file.size }],
      categorySlug: 'wallpaper',
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

export function DesktopUploadDialog({
  open,
  onClose,
  onSuccess,
  wallpaper,
}: DesktopUploadDialogProps) {
  const isEditing = !!wallpaper
  const [title, setTitle] = useState(wallpaper?.title || '')
  const [description, setDescription] = useState(wallpaper?.description || '')
  const [windowsFile, setWindowsFile] = useState<File | null>(null)
  const [macFile, setMacFile] = useState<File | null>(null)
  const [windowsPreview, setWindowsPreview] = useState<string | null>(
    wallpaper?.backgroundUrlWindows || null
  )
  const [macPreview, setMacPreview] = useState<string | null>(
    wallpaper?.backgroundUrlMac || null
  )
  const [saving, setSaving] = useState(false)
  const winInputRef = useRef<HTMLInputElement>(null)
  const macInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (wallpaper && open) {
      setTitle(wallpaper.title || '')
      setDescription(wallpaper.description || '')
      setWindowsPreview(wallpaper.backgroundUrlWindows || null)
      setMacPreview(wallpaper.backgroundUrlMac || null)
      setWindowsFile(null)
      setMacFile(null)
    }
  }, [wallpaper, open])

  useEffect(() => {
    if (!open) {
      if (windowsPreview?.startsWith('blob:')) URL.revokeObjectURL(windowsPreview)
      if (macPreview?.startsWith('blob:')) URL.revokeObjectURL(macPreview)
      setTitle('')
      setDescription('')
      setWindowsFile(null)
      setMacFile(null)
      setWindowsPreview(null)
      setMacPreview(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleWindowsSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('파일 크기는 15MB 이하여야 합니다.')
      return
    }
    if (windowsPreview?.startsWith('blob:')) URL.revokeObjectURL(windowsPreview)
    setWindowsPreview(URL.createObjectURL(file))
    setWindowsFile(file)
  }, [windowsPreview])

  const handleMacSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('파일 크기는 15MB 이하여야 합니다.')
      return
    }
    if (macPreview?.startsWith('blob:')) URL.revokeObjectURL(macPreview)
    setMacPreview(URL.createObjectURL(file))
    setMacFile(file)
  }, [macPreview])

  const removeWindows = useCallback(() => {
    if (windowsPreview?.startsWith('blob:')) URL.revokeObjectURL(windowsPreview)
    setWindowsPreview(null)
    setWindowsFile(null)
  }, [windowsPreview])

  const removeMac = useCallback(() => {
    if (macPreview?.startsWith('blob:')) URL.revokeObjectURL(macPreview)
    setMacPreview(null)
    setMacFile(null)
  }, [macPreview])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    const hasWindows = windowsFile || (isEditing && wallpaper?.backgroundUrlWindows)
    const hasMac = macFile || (isEditing && wallpaper?.backgroundUrlMac)
    if (!hasWindows && !hasMac) {
      toast.error('배경 이미지를 최소 1개 이상 업로드해주세요.')
      return
    }

    setSaving(true)
    try {
      let urlWindows: string | null = null
      let urlMac: string | null = null
      if (windowsFile) urlWindows = await uploadToB2(windowsFile, 'win')
      else if (isEditing && wallpaper?.backgroundUrlWindows)
        urlWindows = wallpaper.backgroundUrlWindows
      if (macFile) urlMac = await uploadToB2(macFile, 'mac')
      else if (isEditing && wallpaper?.backgroundUrlMac) urlMac = wallpaper.backgroundUrlMac

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        backgroundUrlWindows: urlWindows,
        backgroundUrlMac: urlMac,
      }

      const url = isEditing
        ? `/api/desktop-wallpapers/${wallpaper!.id}`
        : '/api/desktop-wallpapers'
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
  }, [
    title,
    description,
    windowsFile,
    macFile,
    isEditing,
    wallpaper,
    onSuccess,
    onClose,
  ])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '바탕화면 수정' : '바탕화면 추가'}</DialogTitle>
          <DialogDescription>
            제목, 설명, 배경 이미지를 입력하세요. 윈도우용과 맥용을 각각 업로드할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명을 입력하세요 (여러 줄)"
              rows={4}
              disabled={saving}
            />
          </div>

          {/* 배경 이미지 1 - 윈도우용 16:9 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              배경 이미지 1 (윈도우용, 16:9, 2560×1440, 1920x1080)
            </Label>
            {windowsPreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageSrc(windowsPreview)}
                  alt="윈도우 배경"
                  className="max-h-32 rounded-lg border object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={removeWindows}
                  disabled={saving}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50"
                onClick={() => winInputRef.current?.click()}
              >
                <input
                  ref={winInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleWindowsSelect(f)
                    e.target.value = ''
                  }}
                />
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">클릭하여 업로드</span>
              </div>
            )}
          </div>

          {/* 배경 이미지 2 - 맥용 16:10 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              배경 이미지 2 (맥용, 16:10, 2560×1600, 1920x1200)
            </Label>
            {macPreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageSrc(macPreview)}
                  alt="맥 배경"
                  className="max-h-32 rounded-lg border object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={removeMac}
                  disabled={saving}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50"
                onClick={() => macInputRef.current?.click()}
              >
                <input
                  ref={macInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleMacSelect(f)
                    e.target.value = ''
                  }}
                />
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">클릭하여 업로드</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            배경 이미지는 최소 1개 이상 필요합니다. 썸네일은 윈도우용(없으면 맥용) 배경에서 자동 생성됩니다.
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
            ) : (
              isEditing ? '수정' : '추가'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
