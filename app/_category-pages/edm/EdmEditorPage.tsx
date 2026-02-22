'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EdmImageUpload } from '@/components/category-pages/EdmCategory/EdmImageUpload'
import { EdmGridCanvas } from '@/components/category-pages/EdmCategory/EdmGridCanvas'
import { EdmControlPanel } from '@/components/category-pages/EdmCategory/EdmControlPanel'
import { EdmLinkPanel } from '@/components/category-pages/EdmCategory/EdmLinkPanel'
import { EdmCodePanel } from '@/components/category-pages/EdmCategory/EdmCodePanel'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  generateHtmlCode,
  getDefaultGridConfig,
  parseGridToCells,
  canMergeCells,
  mergeCells,
} from '@/lib/edm-utils'
import type { GridConfig, CellLinks, Alignment } from '@/types/edm'

interface EdmEditorPageProps {
  edmId?: string
}

function getImageSrc(url: string) {
  if (!url) return ''
  if (url.startsWith('data:')) return url
  if (url.includes('supabase.co')) return url
  if (url.includes('cdn.layerary.com')) return url
  return url
}

function loadImage(
  url: string,
  crossOrigin: 'anonymous' | '' = 'anonymous'
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image()
    if (crossOrigin) i.crossOrigin = crossOrigin
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = getImageSrc(url)
  })
}

async function reconstructImageFromCells(
  cellImages: Record<string, string>,
  imageWidth: number,
  imageHeight: number,
  gridConfig: GridConfig
): Promise<string> {
  const cells = parseGridToCells(gridConfig)
  const canvas = document.createElement('canvas')
  canvas.width = imageWidth
  canvas.height = imageHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const firstCellUrl = cells[0] ? cellImages[cells[0].id] : ''

  const drawCells = async (useCrossOrigin: boolean): Promise<void> => {
    for (const cell of cells) {
      const url = cellImages[cell.id]
      if (!url) continue
      const img = await loadImage(url, useCrossOrigin ? 'anonymous' : '')
      const left = Math.round((cell.left / 100) * imageWidth)
      const top = Math.round((cell.top / 100) * imageHeight)
      const w = Math.round((cell.width / 100) * imageWidth)
      const h = Math.round((cell.height / 100) * imageHeight)
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, left, top, w, h)
    }
  }

  try {
    await drawCells(true)
    return canvas.toDataURL('image/png')
  } catch {
    // CORS 미설정 시 crossOrigin='anonymous'에서 이미지 로드 실패. crossOrigin 없이 재시도.
  }

  try {
    ctx.clearRect(0, 0, imageWidth, imageHeight)
    await drawCells(false)
    try {
      return canvas.toDataURL('image/png')
    } catch {
      return firstCellUrl || ''
    }
  } catch {
    return firstCellUrl || ''
  }
}

async function cropImageToCells(
  imageUrl: string,
  imageWidth: number,
  imageHeight: number,
  gridConfig: GridConfig
): Promise<Record<string, string>> {
  const cells = parseGridToCells(gridConfig)
  const result: Record<string, string> = {}

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.crossOrigin = 'anonymous'
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = imageUrl
  })

  const canvas = document.createElement('canvas')

  for (const cell of cells) {
    const w = Math.round((cell.width / 100) * imageWidth)
    const h = Math.round((cell.height / 100) * imageHeight)
    const left = Math.round((cell.left / 100) * imageWidth)
    const top = Math.round((cell.top / 100) * imageHeight)

    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    ctx.drawImage(img, left, top, w, h, 0, 0, w, h)
    result[cell.id] = canvas.toDataURL('image/png')
  }

  return result
}

export function EdmEditorPage({ edmId }: EdmEditorPageProps) {
  const router = useRouter()
  const [title, setTitle] = useState('제목 없는 eDM')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageWidth, setImageWidth] = useState(1920)
  const [imageHeight, setImageHeight] = useState(1080)
  const [gridConfig, setGridConfig] = useState<GridConfig>(getDefaultGridConfig())
  const [cellLinks, setCellLinks] = useState<CellLinks>({})
  const [selectedCellIds, setSelectedCellIds] = useState<string[]>([])
  const [zoom, setZoom] = useState(0.5)
  const [alignment, setAlignment] = useState<Alignment>('left')
  const [htmlCode, setHtmlCode] = useState('')
  const [cellImagesForPreview, setCellImagesForPreview] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(!!edmId)
  const [saving, setSaving] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  const imgRef = useRef<HTMLImageElement | null>(null)
  /** 다이얼로그 등에서 handleSave 호출 시 항상 최신 state를 쓰기 위한 ref */
  const saveStateRef = useRef({
    title: '',
    description: '',
    imagePreviewUrl: null as string | null,
    imageFile: null as File | null,
    gridConfig: getDefaultGridConfig(),
    cellLinks: {} as CellLinks,
    cellImagesForPreview: {} as Record<string, string>,
    imageWidth: 1920,
    imageHeight: 1080,
    alignment: 'left' as Alignment,
  })
  useEffect(() => {
    saveStateRef.current = {
      title,
      description,
      imagePreviewUrl,
      imageFile,
      gridConfig,
      cellLinks,
      cellImagesForPreview,
      imageWidth,
      imageHeight,
      alignment,
    }
  }, [
    title,
    description,
    imagePreviewUrl,
    imageFile,
    gridConfig,
    cellLinks,
    cellImagesForPreview,
    imageWidth,
    imageHeight,
    alignment,
  ])

  useEffect(() => {
    if (!edmId) return

    const fetchEdm = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/edm/${edmId}`)
        if (!res.ok) throw new Error('eDM을 불러오는데 실패했습니다.')

        const data = await res.json()
        const edm = data.edm

        setTitle(edm.title)
        setDescription(edm.description || '')
        setImageWidth(edm.imageWidth)
        setImageHeight(edm.imageHeight)
        setGridConfig(edm.gridConfig)
        setCellLinks(edm.cellLinks || {})
        setAlignment((edm.alignment as Alignment) || 'left')
        setHtmlCode(edm.htmlCode || '')
        setCellImagesForPreview(edm.cellImages || {})
        setHasUnsavedChanges(false)

        if (edm.cellImages && Object.keys(edm.cellImages).length > 0) {
          try {
            const reconstructed = await reconstructImageFromCells(
              edm.cellImages,
              edm.imageWidth,
              edm.imageHeight,
              edm.gridConfig
            )
            setImagePreviewUrl(reconstructed)
          } catch (err) {
            console.error('Failed to reconstruct image:', err)
            const firstUrl = Object.values(edm.cellImages)[0] as string
            setImagePreviewUrl(getImageSrc(firstUrl))
          }
        }
      } catch (err) {
        console.error(err)
        toast.error('eDM을 불러오는데 실패했습니다.')
        router.push('/edm')
      } finally {
        setLoading(false)
      }
    }

    fetchEdm()
  }, [edmId, router])

  const prevPreviewUrlRef = useRef<string | null>(null)

  const handleImageSelect = useCallback((file: File) => {
    if (prevPreviewUrlRef.current) {
      URL.revokeObjectURL(prevPreviewUrlRef.current)
    }
    setImageFile(file)
    const url = URL.createObjectURL(file)
    prevPreviewUrlRef.current = url
    setImagePreviewUrl(url)
    setZoom(0.5) // 이미지 업로드 시 화면에 맞춤(전체 보기)

    const img = new Image()
    img.onload = () => {
      setImageWidth(img.naturalWidth)
      setImageHeight(img.naturalHeight)
    }
    img.src = url
  }, [])

  useEffect(() => {
    return () => {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current)
      }
    }
  }, [])

  /** Code Panel "Code 생성" 클릭 시: Supabase Storage URL로 코드 생성, 표시, 복사 (저장 후에만 호출됨) */
  const handleCodeGenerateAndCopy = useCallback(async () => {
    if (!edmId || !cellImagesForPreview || Object.keys(cellImagesForPreview).length === 0) {
      toast.error('저장된 이미지가 없습니다.')
      return
    }

    try {
      const code = generateHtmlCode(
        gridConfig,
        cellImagesForPreview,
        cellLinks,
        alignment,
        imageWidth,
        imageHeight,
        false
      )
      setHtmlCode(code)
      await navigator.clipboard.writeText(code)
      toast.success('코드가 복사되었습니다.')
    } catch (err) {
      console.error(err)
      toast.error('코드 복사에 실패했습니다.')
    }
  }, [edmId, gridConfig, cellImagesForPreview, cellLinks, alignment, imageWidth, imageHeight])

  useEffect(() => {
    if (edmId && cellImagesForPreview && Object.keys(cellImagesForPreview).length > 0) {
      const code = generateHtmlCode(
        gridConfig,
        cellImagesForPreview,
        cellLinks,
        alignment,
        imageWidth,
        imageHeight
      )
      setHtmlCode(code)
    }
  }, [edmId, alignment, gridConfig, cellImagesForPreview, cellLinks, imageWidth, imageHeight])

  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    return new File([u8arr], filename, { type: mime })
  }

  const handleSave = useCallback(async (): Promise<boolean> => {
    const state = saveStateRef.current
    const titleToUse = state.title?.trim() ?? ''
    const hasTitle = titleToUse.length > 0

    if (!hasTitle && !edmId) {
      toast.error('제목을 입력해 주세요.')
      return false
    }
    // 기존 eDM에서 제목이 비어 있으면 서버에 빈 문자열로 덮어쓰지 않도록, 아래에서 title은 비우지 않고 보냄
    if (!hasTitle && edmId) {
      toast.error('제목을 입력해 주세요.')
      return false
    }

    // 새 eDM은 이미지 업로드 필수. 기존 eDM은 그리드/링크만 바꾼 경우에도 재구성해서 이미지 전송 시도
    if (!edmId && !state.imageFile) {
      toast.error('이미지를 업로드해 주세요.')
      return false
    }

    try {
      setSaving(true)

      const formData = new FormData()
      if (hasTitle) formData.append('title', titleToUse)
      formData.append('description', (state.description ?? '').trim())
      formData.append('gridConfig', JSON.stringify(state.gridConfig))
      formData.append('cellLinks', JSON.stringify(state.cellLinks))
      formData.append('alignment', state.alignment)

      let imageToSend: File | null = state.imageFile
      if (!imageToSend && state.imagePreviewUrl?.startsWith('data:')) {
        imageToSend = dataUrlToFile(state.imagePreviewUrl, 'edm-image.png')
      }
      // 기존 eDM인데 이미지가 아직 없으면, 셀 이미지로 전체 이미지 재구성 후 전송 시도(그리드 변경 시 R2 재저장 위해)
      if (!imageToSend && edmId && state.cellImagesForPreview && Object.keys(state.cellImagesForPreview).length > 0) {
        try {
          const dataUrl = await reconstructImageFromCells(
            state.cellImagesForPreview,
            state.imageWidth,
            state.imageHeight,
            state.gridConfig
          )
          if (dataUrl?.startsWith('data:')) {
            imageToSend = dataUrlToFile(dataUrl, 'edm-image.png')
          }
        } catch (e) {
          console.warn('Save: reconstruct image for PATCH failed', e)
        }
      }
      if (imageToSend) {
        formData.append('image', imageToSend)
      }

      if (edmId) {
        const res = await fetch(`/api/edm/${edmId}`, {
          method: 'PATCH',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          const msg = data.detail || data.error || '저장에 실패했습니다.'
          throw new Error(msg)
        }
        if (data.edm?.cellImages) {
          setCellImagesForPreview(data.edm.cellImages)
        }
        if (data.edm?.htmlCode) {
          setHtmlCode(data.edm.htmlCode)
        }
        setHasUnsavedChanges(false)
        toast.success('eDM이 저장되었습니다.')
        return true
      } else {
        if (!state.imageFile) {
          toast.error('이미지를 업로드해 주세요.')
          setSaving(false)
          return false
        }
        const res = await fetch('/api/edm', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          const msg = data.detail || data.error || '저장에 실패했습니다.'
          throw new Error(msg)
        }
        toast.success('eDM이 저장되었습니다.')
        router.push(`/edm/${data.edm.id}`)
        return true
      }
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.'
      toast.error(msg)
      return false
    } finally {
      setSaving(false)
    }
  }, [edmId, router])

  const handleMergeCells = useCallback(() => {
    const result = canMergeCells(gridConfig, selectedCellIds)
    if (!result.valid || !result.primaryId || !result.rowSpan || !result.colSpan) return
    const newConfig = mergeCells(gridConfig, result.primaryId, result.rowSpan, result.colSpan)
    setGridConfig(newConfig)
    setSelectedCellIds([result.primaryId])
    // 병합된 셀 중 primaryId 외 링크 제거 (primaryId 링크 유지)
    const toRemove = selectedCellIds.filter((id) => id !== result.primaryId)
    if (toRemove.some((id) => cellLinks[id])) {
      const next = { ...cellLinks }
      toRemove.forEach((id) => delete next[id])
      setCellLinks(next)
    }
    if (edmId) setHasUnsavedChanges(true)
  }, [gridConfig, selectedCellIds, cellLinks, edmId])

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setLeaveConfirmOpen(true)
    } else {
      router.push('/edm')
    }
  }, [hasUnsavedChanges, router])

  const handleLeaveWithoutSaving = useCallback(() => {
    setLeaveConfirmOpen(false)
    router.push('/edm')
  }, [router])

  const handleSaveAndLeave = useCallback(async () => {
    setLeaveConfirmOpen(false)
    const ok = await handleSave()
    if (ok && edmId) router.push('/edm')
  }, [edmId, handleSave, router])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden min-h-0">
      <div className="h-14 border-b flex items-center pl-4 pr-8 justify-between bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {editingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
              className="w-64"
              autoFocus
            />
          ) : (
            <h1
              className="text-lg font-semibold cursor-pointer hover:text-primary"
              onClick={() => setEditingTitle(true)}
            >
              {title}
            </h1>
          )}

          <Input
            placeholder="간단한 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-48"
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              저장
            </>
          )}
        </Button>
      </div>

      <div className="shrink-0">
        <EdmControlPanel
          gridConfig={gridConfig}
          zoom={zoom}
          onGridConfigChange={(config) => {
            setGridConfig(config)
            if (edmId) setHasUnsavedChanges(true)
          }}
          onZoomChange={setZoom}
          hasImage={!!imagePreviewUrl}
          selectedCellIds={selectedCellIds}
          onMergeCells={handleMergeCells}
        />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden min-w-0">
          {!imagePreviewUrl ? (
            <EdmImageUpload onImageSelect={handleImageSelect} />
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden">
              <EdmGridCanvas
              imageUrl={imagePreviewUrl}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              gridConfig={gridConfig}
              selectedCellIds={selectedCellIds}
              cellLinks={cellLinks}
              zoom={zoom}
              onGridConfigChange={(config) => {
                setGridConfig(config)
                if (edmId) setHasUnsavedChanges(true)
              }}
              onCellSelect={setSelectedCellIds}
              />
            </div>
          )}
        </div>

        <EdmLinkPanel
          selectedCellId={selectedCellIds.length === 1 ? selectedCellIds[0] : null}
          cellLinks={cellLinks}
          onCellLinksChange={(links) => {
            setCellLinks(links)
            if (edmId) setHasUnsavedChanges(true)
          }}
        />
      </div>

      <div className="min-h-[200px] shrink-0">
        <EdmCodePanel
          htmlCode={htmlCode}
          alignment={alignment}
          onAlignmentChange={(v) => {
            setAlignment(v)
            if (edmId) setHasUnsavedChanges(true)
          }}
          cellImages={cellImagesForPreview}
          cellLinks={cellLinks}
          canGenerateCode={!!edmId && !hasUnsavedChanges}
          canPreview={!!edmId && !hasUnsavedChanges}
          hasUnsavedCodeChanges={!!edmId && hasUnsavedChanges}
          onCodeGenerate={handleCodeGenerateAndCopy}
        />
      </div>

      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수정 사항을 저장할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              저장하지 않고 나가면 변경 사항이 사라집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-2 sm:justify-end">
            <AlertDialogCancel disabled={saving}>취소</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleLeaveWithoutSaving}
              disabled={saving}
            >
              저장하지 않고 나가기
            </Button>
            <Button onClick={handleSaveAndLeave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장하고 나가기'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
