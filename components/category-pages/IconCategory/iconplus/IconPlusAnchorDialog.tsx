'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react'
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
import { Loader2 } from 'lucide-react'
import { clamp, formatCoordinate, getContainedRect } from './anchor-utils'
import type { IconPlusResource } from './types'

interface IconPlusAnchorDialogProps {
  /** 편집 대상 MAIN 리소스 (null이면 닫힘) */
  resource: IconPlusResource | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * 기존 MAIN 아이콘의 anchor(병합 시작 좌표) 재편집 다이얼로그. 관리자 전용.
 *
 * 저장된 svgContent는 서버(process-svg)에서 sanitize된 값이라 `dangerouslySetInnerHTML`로 렌더한다
 * (업로드 전 파일이 아니므로 object URL/`<img>`가 필요 없다). 좌표 지정 로직과 십자선 마커는
 * 업로드 다이얼로그와 동일하며 anchor 헬퍼(`./anchor-utils`)를 공유한다.
 * 저장 시 `PATCH /api/icon-plus/[id]` 호출.
 * @see docs/ICON_PLUS_개발계획.md §3.3
 */
export function IconPlusAnchorDialog({ resource, onClose, onSuccess }: IconPlusAnchorDialogProps) {
  const open = resource !== null
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const [anchorX, setAnchorX] = useState('')
  const [anchorY, setAnchorY] = useState('')
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const previewSize = useMemo(
    () => (resource ? { width: resource.width, height: resource.height } : null),
    [resource]
  )

  // 대상이 바뀌면 저장된 anchor로 초기화
  useEffect(() => {
    if (resource) {
      setAnchorX(resource.anchorX != null ? String(resource.anchorX) : '')
      setAnchorY(resource.anchorY != null ? String(resource.anchorY) : '')
      setErrorMessage(null)
      setIsDraggingAnchor(false)
    }
  }, [resource])

  const anchorPosition = useMemo(() => {
    if (!previewSize) return null
    const x = Number(anchorX)
    const y = Number(anchorY)
    if (!anchorX || !anchorY || !Number.isFinite(x) || !Number.isFinite(y)) return null
    return {
      left: `${clamp((x / previewSize.width) * 100, 0, 100)}%`,
      top: `${clamp((y / previewSize.height) * 100, 0, 100)}%`,
    }
  }, [anchorX, anchorY, previewSize])

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
    if (!resource) return
    setErrorMessage(null)

    const x = Number(anchorX)
    const y = Number(anchorY)
    if (!anchorX || !anchorY || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
      setErrorMessage('anchorX와 anchorY는 0 이상의 숫자여야 합니다.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/icon-plus/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anchorX: x, anchorY: y }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setErrorMessage(data?.error ?? 'anchor 좌표 저장에 실패했습니다.')
        return
      }
      onSuccess()
      onClose()
    } catch {
      setErrorMessage('anchor 좌표 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>anchor 좌표 편집</DialogTitle>
          <DialogDescription>
            {resource?.name} 아이콘의 병합 시작 좌표를 다시 지정합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div
              ref={stageRef}
              role="presentation"
              className="relative flex min-h-56 touch-none select-none items-center justify-center overflow-hidden rounded-lg border border-border bg-muted p-4"
              style={{ cursor: isDraggingAnchor ? 'grabbing' : 'crosshair' }}
              onPointerDown={handleAnchorPointerDown}
              onPointerMove={handleAnchorPointerMove}
              onPointerUp={handleAnchorPointerUp}
              onPointerCancel={handleAnchorPointerUp}
            >
              {previewSize && (
                <div
                  ref={imageRef}
                  className="pointer-events-none relative h-48 max-w-full"
                  style={{ aspectRatio: `${previewSize.width} / ${previewSize.height}` }}
                >
                  <span
                    className="svg-line-preview flex h-full w-full items-center justify-center text-foreground [&_svg]:h-full [&_svg]:w-full"
                    // svgContent는 저장 시 서버에서 sanitize됨 (lib/svg/process-svg.ts)
                    dangerouslySetInnerHTML={{ __html: resource!.svgContent }}
                  />
                  {anchorPosition && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow before:absolute before:left-1/2 before:top-[-10px] before:h-8 before:w-px before:-translate-x-1/2 before:bg-primary after:absolute after:left-[-10px] after:top-1/2 after:h-px after:w-8 after:-translate-y-1/2 after:bg-primary"
                      style={anchorPosition}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="icon-plus-edit-anchor-x" className="text-xs text-muted-foreground">
                  anchorX
                </Label>
                <Input
                  id="icon-plus-edit-anchor-x"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={anchorX}
                  onChange={(e) => setAnchorX(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="icon-plus-edit-anchor-y" className="text-xs text-muted-foreground">
                  anchorY
                </Label>
                <Input
                  id="icon-plus-edit-anchor-y"
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

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
