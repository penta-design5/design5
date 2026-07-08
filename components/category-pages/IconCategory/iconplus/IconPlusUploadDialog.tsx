'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type PointerEvent,
} from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadCloud, Loader2, File as FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clamp, formatCoordinate, getContainedRect } from './anchor-utils'
import type { IconPlusType } from './types'

interface IconPlusUploadDialogProps {
  open: boolean
  /** 업로드 대상 타입 (섹션별로 결정) */
  type: IconPlusType
  onClose: () => void
  onSuccess: () => void
}

const UPLOAD_COPY: Record<IconPlusType, { title: string; policy: string }> = {
  MAIN: {
    title: '메인 아이콘 업로드',
    policy: 'SVG 1개만 업로드할 수 있으며 최대 256KB까지 허용됩니다.',
  },
  MERGE_ICON: {
    title: '병합용 아이콘 업로드',
    policy: 'SVG 파일을 여러 개 업로드할 수 있으며 개별 최대 256KB까지 허용됩니다.',
  },
  MERGE_TEXT: {
    title: '병합용 텍스트 업로드',
    policy: 'SVG 파일을 여러 개 업로드할 수 있으며 개별 최대 256KB까지 허용됩니다.',
  },
}

/**
 * ICON+ 리소스 업로드 다이얼로그.
 * - MERGE_ICON/MERGE_TEXT: SVG 다중 업로드(anchor 없음).
 * - MAIN: SVG 단건 + anchorX/anchorY 필수(미리보기 위 클릭·드래그로 십자선 지정, 좌표 직접 입력 가능).
 *
 * 미리보기는 업로드 전 sanitize되지 않은 파일이므로 `dangerouslySetInnerHTML` 대신
 * object URL + `<img>`로 렌더한다(SVG를 이미지로 로드하면 스크립트가 실행되지 않음).
 * 서버(process-svg)에서 검증/sanitize 후 DB 저장한다.
 * @see docs/ICON_PLUS_개발계획.md §6
 */
export function IconPlusUploadDialog({
  open,
  type,
  onClose,
  onSuccess,
}: IconPlusUploadDialogProps) {
  const isMain = type === 'MAIN'
  const copy = UPLOAD_COPY[type]

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const [files, setFiles] = useState<File[]>([])
  const [anchorX, setAnchorX] = useState('')
  const [anchorY, setAnchorY] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 다이얼로그가 닫히거나 언마운트될 때 object URL 정리
  const clearPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }
  useEffect(() => clearPreview, [])

  // 열림 상태가 바뀔 때(닫힘) 폼 초기화
  useEffect(() => {
    if (!open) {
      clearPreview()
      setFiles([])
      setAnchorX('')
      setAnchorY('')
      setPreviewUrl(null)
      setPreviewSize(null)
      setErrorMessage(null)
      setIsDragging(false)
      setIsDraggingAnchor(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open])

  const anchorPosition = useMemo(() => {
    if (!previewSize) return null
    const x = Number(anchorX)
    const y = Number(anchorY)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    return {
      left: `${clamp((x / previewSize.width) * 100, 0, 100)}%`,
      top: `${clamp((y / previewSize.height) * 100, 0, 100)}%`,
    }
  }, [anchorX, anchorY, previewSize])

  const applyFiles = (fileList: FileList | File[]) => {
    const next = Array.from(fileList)
    if (next.length === 0) return

    const invalid = next.find((file) => !isClientSvgFile(file))
    if (invalid) {
      setErrorMessage(`${invalid.name}은(는) SVG 파일이 아닙니다. SVG 파일만 선택해 주세요.`)
      return
    }

    if (isMain && next.length > 1) {
      setErrorMessage('메인 아이콘은 SVG 1개만 선택할 수 있습니다.')
      return
    }

    const selected = isMain ? next.slice(0, 1) : next
    setFiles(selected)
    setErrorMessage(null)

    clearPreview()
    if (!isMain) {
      setPreviewUrl(null)
      setPreviewSize(null)
      return
    }

    const file = selected[0]
    const objectUrl = URL.createObjectURL(file)
    previewUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setAnchorX('')
    setAnchorY('')
    file.text().then((svg) => setPreviewSize(readClientSvgSize(svg)))
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) applyFiles(event.target.files)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    applyFiles(event.dataTransfer.files)
  }

  const updateAnchorFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!previewSize || !stageRef.current) return
    const imageRect =
      imageRef.current?.getBoundingClientRect() ??
      getContainedRect(stageRef.current.getBoundingClientRect(), previewSize)
    const x = clamp(
      ((event.clientX - imageRect.left) / imageRect.width) * previewSize.width,
      0,
      previewSize.width
    )
    const y = clamp(
      ((event.clientY - imageRect.top) / imageRect.height) * previewSize.height,
      0,
      previewSize.height
    )
    setAnchorX(formatCoordinate(x))
    setAnchorY(formatCoordinate(y))
    setErrorMessage(null)
  }

  const handleAnchorPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    updateAnchorFromPointer(event)
    setIsDraggingAnchor(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleAnchorPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isDraggingAnchor) updateAnchorFromPointer(event)
  }

  const handleAnchorPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    setIsDraggingAnchor(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (files.length === 0) {
      setErrorMessage('업로드할 SVG 파일을 선택해 주세요.')
      return
    }
    if (isMain && (!anchorX || !anchorY)) {
      setErrorMessage('메인 아이콘은 anchorX와 anchorY 좌표가 필요합니다.')
      return
    }

    const formData = new FormData()
    formData.append('type', type)
    files.forEach((file) => formData.append('files', file))
    if (isMain) {
      formData.append('anchorX', anchorX)
      formData.append('anchorY', anchorY)
    }

    setUploading(true)
    try {
      const response = await fetch('/api/icon-plus', { method: 'POST', body: formData })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setErrorMessage(data?.error ?? 'SVG 업로드에 실패했습니다.')
        return
      }
      onSuccess()
      onClose()
    } catch {
      setErrorMessage('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !uploading && onClose()}>
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto', isMain ? 'max-w-2xl' : 'max-w-xl')}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.policy}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 드롭존 */}
          <div
            role="button"
            tabIndex={0}
            className={cn(
              'flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
          >
            <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">파일을 드래그하거나 클릭하여 선택</p>
            <p className="mt-1 text-xs text-muted-foreground">{copy.policy}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              multiple={!isMain}
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* 선택된 파일 목록 */}
          {files.length > 0 && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  선택된 파일 ({files.length}개)
                </p>
              </div>
              <p className="mt-2 overflow-x-auto whitespace-nowrap text-sm text-foreground">
                {files.map((file) => file.name).join(', ')}
              </p>
            </div>
          )}

          {/* MAIN: anchor 지정 (미리보기 + 좌표 입력) */}
          {isMain && (
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <div
                ref={stageRef}
                role="presentation"
                className="relative flex min-h-56 touch-none select-none items-center justify-center overflow-hidden rounded-lg border border-border bg-muted p-4"
                style={{
                  cursor:
                    previewUrl && previewSize
                      ? isDraggingAnchor
                        ? 'grabbing'
                        : 'crosshair'
                      : 'default',
                }}
                onPointerDown={previewUrl && previewSize ? handleAnchorPointerDown : undefined}
                onPointerMove={previewUrl && previewSize ? handleAnchorPointerMove : undefined}
                onPointerUp={previewUrl && previewSize ? handleAnchorPointerUp : undefined}
                onPointerCancel={previewUrl && previewSize ? handleAnchorPointerUp : undefined}
              >
                {previewUrl && previewSize ? (
                  <div
                    ref={imageRef}
                    className="pointer-events-none relative h-48 max-w-full"
                    style={{ aspectRatio: `${previewSize.width} / ${previewSize.height}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="메인 아이콘 업로드 미리보기"
                      draggable={false}
                      className="absolute inset-0 h-full w-full select-none object-contain"
                    />
                    {anchorPosition && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow before:absolute before:left-1/2 before:top-[-10px] before:h-8 before:w-px before:-translate-x-1/2 before:bg-primary after:absolute after:left-[-10px] after:top-1/2 after:h-px after:w-8 after:-translate-y-1/2 after:bg-primary"
                        style={anchorPosition}
                      />
                    )}
                  </div>
                ) : previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="메인 아이콘 업로드 미리보기"
                    draggable={false}
                    className="h-48 w-full select-none object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    SVG 선택 시 미리보기가 표시됩니다.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="icon-plus-anchor-x" className="text-xs text-muted-foreground">
                    anchorX
                  </Label>
                  <Input
                    id="icon-plus-anchor-x"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={anchorX}
                    onChange={(e) => setAnchorX(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="icon-plus-anchor-y" className="text-xs text-muted-foreground">
                    anchorY
                  </Label>
                  <Input
                    id="icon-plus-anchor-y"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={anchorY}
                    onChange={(e) => setAnchorY(e.target.value)}
                  />
                </div>
                <p className="text-xs leading-4 text-muted-foreground">
                  미리보기 아이콘 위를 클릭하거나 드래그해 병합 시작 좌표를 설정할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              취소
            </Button>
            <Button type="submit" disabled={uploading || files.length === 0}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                '업로드'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ---- 업로드 전용 SVG 미리보기 헬퍼 (순수 함수). 공용 anchor 헬퍼는 ./anchor-utils ---- */

function parseSvgLength(value: string | undefined) {
  if (!value) return null
  const match = value.match(/^(\d+(?:\.\d+)?)(?:px)?$/i)
  return match ? Number(match[1]) : null
}

/** 업로드 전 클라이언트에서 SVG의 표시 크기(viewBox 우선)를 추출 */
function readClientSvgSize(svg: string): { width: number; height: number } | null {
  const viewBox = svg.match(/\sviewBox=["']([^"']+)["']/i)?.[1]
  if (viewBox) {
    const values = viewBox.trim().split(/[\s,]+/).map(Number)
    if (values.length === 4 && values.every(Number.isFinite)) {
      return { width: values[2], height: values[3] }
    }
  }
  const width = parseSvgLength(svg.match(/\swidth=["']([^"']+)["']/i)?.[1])
  const height = parseSvgLength(svg.match(/\sheight=["']([^"']+)["']/i)?.[1])
  if (width && height) return { width, height }
  return null
}

function isClientSvgFile(file: File) {
  return file.name.toLowerCase().endsWith('.svg') && file.type === 'image/svg+xml'
}
