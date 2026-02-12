'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Upload, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CardElementEditor } from './CardElementEditor'
import type { CardTemplate, CardTemplateConfig, BackgroundImageItem, CardTextElement, CardLogoArea } from '@/lib/card-schemas'
import { DEFAULT_CARD_CONFIG } from '@/lib/card-schemas'

interface CardAdminDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  template?: CardTemplate | null
}

type BackgroundItemState = { url: string; width: number; height: number; label?: string; file?: File }

function getImageSrc(url: string) {
  if (!url) return ''
  if (url.startsWith('http') && url.includes('backblazeb2.com')) {
    return `/api/posts/images?url=${encodeURIComponent(url)}`
  }
  return url
}

export function CardAdminDialog({ open, onClose, onSuccess, template }: CardAdminDialogProps) {
  const isEditing = !!template
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [backgroundItems, setBackgroundItems] = useState<BackgroundItemState[]>(() => {
    const arr = Array.isArray(template?.backgroundImages) ? template.backgroundImages : []
    return arr.length > 0
      ? arr.map((item) => ({
          url: item.url,
          width: item.width,
          height: item.height,
          label: item.label,
        }))
      : []
  })
  const [config, setConfig] = useState<CardTemplateConfig>(
    (template?.config as CardTemplateConfig) ?? DEFAULT_CARD_CONFIG
  )
  const [saving, setSaving] = useState(false)
  const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedBackground = backgroundItems[selectedBackgroundIndex]
  const width = selectedBackground?.width ?? 0
  const height = selectedBackground?.height ?? 0

  useEffect(() => {
    if (template && open) {
      setName(template.name ?? '')
      setDescription(template.description ?? '')
      const arr = Array.isArray(template.backgroundImages) ? template.backgroundImages : []
      setBackgroundItems(
        arr.length > 0
          ? arr.map((item) => ({
              url: item.url,
              width: item.width,
              height: item.height,
              label: item.label,
            }))
          : []
      )
      setSelectedBackgroundIndex(0)
      setConfig((template.config as CardTemplateConfig) ?? DEFAULT_CARD_CONFIG)
    }
  }, [template, open])

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setBackgroundItems([])
      setConfig(DEFAULT_CARD_CONFIG)
      setSelectedBackgroundIndex(0)
    }
  }, [open])

  const uploadOneToB2 = useCallback(async (file: File): Promise<string> => {
    const safeName = `card-bg-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')}`
    const res = await fetch('/api/posts/upload-presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ name: safeName, type: file.type, size: file.size }],
        categorySlug: 'card',
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '업로드 URL 생성 실패')
    }
    const data = await res.json()
    const { uploadUrl, authorizationToken, fileName, fileUrl } = data.presignedUrls[0]
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: file,
      headers: {
        Authorization: authorizationToken,
        'Content-Type': 'b2/x-auto',
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'X-Bz-Content-Sha1': 'do_not_verify',
      },
    })
    if (!uploadRes.ok) throw new Error('파일 업로드 실패')
    return fileUrl
  }, [])

  const loadImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => resolve({ width: 1080, height: 1920 })
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const addBackgroundFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다.')
        return
      }
      const dims = await loadImageDimensions(file)
      const previewUrl = URL.createObjectURL(file)
      setBackgroundItems((prev) => [
        ...prev,
        { url: previewUrl, width: dims.width, height: dims.height, label: undefined, file },
      ])
    },
    [loadImageDimensions]
  )

  const handleAddBackground = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) await addBackgroundFile(file)
      e.target.value = ''
    },
    [addBackgroundFile]
  )

  const removeBackgroundAt = useCallback((index: number) => {
    setBackgroundItems((prev) => {
      const item = prev[index]
      if (item?.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
      return prev.filter((_, i) => i !== index)
    })
    setSelectedBackgroundIndex((prev) => {
      if (prev === index) return 0
      if (prev > index) return prev - 1
      return prev
    })
  }, [])

  const handleConfigChange = useCallback((newConfig: CardTemplateConfig) => {
    setConfig(newConfig)
  }, [])

  const handleAddTextElement = useCallback(() => {
    const newEl: CardTextElement = {
      id: `text-${Date.now()}`,
      label: '새 텍스트',
      defaultValue: '텍스트를 입력하세요',
      x: 50,
      y: 50,
      width: 60,
      fontSize: 24,
      fontWeight: 'normal',
      color: '#333333',
      textAlign: 'center',
      verticalAlign: 'middle',
      editable: true,
      multiline: false,
    }
    setConfig((prev) => ({
      ...prev,
      textElements: [...prev.textElements, newEl],
    }))
  }, [])

  const handleRemoveTextElement = useCallback((elementId: string) => {
    setConfig((prev) => ({
      ...prev,
      textElements: prev.textElements.filter((el) => el.id !== elementId),
    }))
  }, [])

  const handleUpdateTextElement = useCallback((elementId: string, updates: Partial<CardTextElement>) => {
    setConfig((prev) => ({
      ...prev,
      textElements: prev.textElements.map((el) => {
        if (el.id !== elementId) return el
        const next = { ...el }
        Object.entries(updates).forEach(([k, v]) => {
          if (v !== undefined) (next as Record<string, unknown>)[k] = v
        })
        return next
      }),
    }))
  }, [])

  const handleUpdateLogoArea = useCallback((updates: Partial<CardLogoArea> | null) => {
    if (updates === null) {
      setConfig((prev) => ({ ...prev, logoArea: undefined }))
    } else {
      setConfig((prev) => {
        const base = prev.logoArea ?? { x: 50, y: 78, width: 200, height: 80, placeholder: '로고 또는 서명', align: 'center' as const }
        const merged = { ...base, ...updates, align: (updates.align ?? base.align) ?? 'center' }
        return { ...prev, logoArea: merged }
      })
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      toast.error('템플릿 이름을 입력해주세요.')
      return
    }
    if (backgroundItems.length === 0) {
      toast.error('배경 이미지를 1개 이상 업로드해주세요.')
      return
    }

    setSaving(true)
    try {
      const uploaded: BackgroundImageItem[] = []
      for (let i = 0; i < backgroundItems.length; i++) {
        const item = backgroundItems[i]
        if (item.file) {
          const fileUrl = await uploadOneToB2(item.file)
          uploaded.push({
            url: fileUrl,
            width: item.width,
            height: item.height,
            label: item.label,
          })
        } else {
          uploaded.push({
            url: item.url,
            width: item.width,
            height: item.height,
            label: item.label,
          })
        }
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        backgroundImages: uploaded,
        width,
        height,
        config,
        status: 'PUBLISHED',
      }

      const url = isEditing ? `/api/card-templates/${template!.id}` : '/api/card-templates'
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '저장에 실패했습니다.')
      }

      backgroundItems.forEach((item) => {
        if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : '템플릿 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }, [
    name,
    description,
    backgroundItems,
    config,
    isEditing,
    template,
    onSuccess,
    onClose,
    uploadOneToB2,
  ])

  const selectedBackgroundUrl = backgroundItems[selectedBackgroundIndex]?.url ?? backgroundItems[0]?.url ?? null

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) addBackgroundFile(file)
    },
    [addBackgroundFile]
  )
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => e.preventDefault(), [])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-48px)] w-[calc(100vw-48px)] max-h-[calc(100vh-48px)] h-[calc(100vh-48px)] p-0 gap-0 rounded-lg overflow-hidden">
        <div className="flex flex-col h-full w-full overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0 w-full">
            <DialogTitle>{isEditing ? '템플릿 수정' : '새 템플릿 만들기'}</DialogTitle>
            <DialogDescription>
              감사/연말 카드 템플릿의 기본 정보와 요소를 설정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col w-full">
            {/* 상단: 기본 정보 영역 (웰컴보드와 동일 배치) */}
            <div className="px-6 py-4 border-b bg-muted/30 flex-shrink-0 w-full overflow-x-auto">
              <div className="flex flex-wrap gap-4 justify-between items-end min-w-0">
                <div className="flex flex-wrap gap-4 items-center min-w-0">
                  <div className="space-y-1 flex-shrink-0 w-48">
                    <Label htmlFor="name" className="text-xs">템플릿 이름 *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 신년 카드"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1 flex-shrink-0 w-56">
                    <Label htmlFor="description" className="text-xs">설명</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="템플릿에 대한 간단한 설명"
                      className="h-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="space-y-1 w-24">
                      <Label htmlFor="width" className="text-xs">너비 (px)</Label>
                      <Input id="width" type="number" value={width} readOnly className="h-9 bg-muted" />
                    </div>
                    <div className="space-y-1 w-24">
                      <Label htmlFor="height" className="text-xs">높이 (px)</Label>
                      <Input id="height" type="number" value={height} readOnly className="h-9 bg-muted" />
                    </div>
                  </div>
                  {/* 배경 이미지 * (여러 장 업로드 시 선택 가능) */}
                  <div className="space-y-1">
                    <Label className="text-xs">배경 이미지 *</Label>
                    {backgroundItems.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {backgroundItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedBackgroundIndex(idx)}
                              className={`relative h-9 w-16 bg-muted rounded overflow-hidden border flex-shrink-0 transition-all ${
                                selectedBackgroundIndex === idx ? 'ring-2 ring-penta-blue ring-offset-1' : 'hover:opacity-90'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={getImageSrc(item.url)} alt={`배경 ${idx + 1}`} className="w-full h-full object-contain" />
                            </button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 flex-shrink-0"
                              onClick={() => removeBackgroundAt(idx)}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div
                          className="h-9 px-2 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddBackground} />
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="h-9 px-3 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddBackground} />
                        <Upload className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">클릭 또는 드래그</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={onClose} disabled={saving} className="h-9">취소</Button>
                  <Button onClick={handleSubmit} disabled={saving} className="h-9">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : isEditing ? '수정' : '생성'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden w-full">
              <CardElementEditor
                config={config}
                width={width}
                height={height}
                firstBackgroundUrl={selectedBackgroundUrl}
                onAddTextElement={handleAddTextElement}
                onRemoveTextElement={handleRemoveTextElement}
                onUpdateTextElement={handleUpdateTextElement}
                onUpdateLogoArea={handleUpdateLogoArea}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
