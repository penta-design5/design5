'use client'

import { useState, useEffect, useRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import type { DesktopWallpaperPost } from '@/lib/desktop-schemas'
import { getB2ImageSrc, isB2WorkerUrl } from '@/lib/b2-client-url'

const CARD_WIDTH = 320
const CARD_HEIGHT = 200

interface DesktopCardProps {
  wallpaper: DesktopWallpaperPost
  isSelected?: boolean
  onClick: (wallpaperId: string) => void
  onEdit?: (wallpaper: DesktopWallpaperPost) => void
  onDelete?: (wallpaperId: string) => void
  showActions?: boolean
  /** 모바일에서는 편집 유도 문구 숨김 */
  showHoverEditLabel?: boolean
}

export function DesktopCard({
  wallpaper,
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
  showHoverEditLabel = true,
}: DesktopCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageUrlRef = useRef<string | null>(null)
  const thumbnailUrl = wallpaper.thumbnailUrl || wallpaper.backgroundUrlWindows || wallpaper.backgroundUrlMac

  useEffect(() => {
    if (!thumbnailUrl) {
      setImageLoaded(false)
      imageUrlRef.current = null
      return
    }
    if (imageUrlRef.current !== thumbnailUrl) {
      imageUrlRef.current = thumbnailUrl
      setImageLoaded(false)
      const img = new window.Image()
      img.onload = () => setImageLoaded(true)
      img.onerror = () => setImageLoaded(true)
      img.src = getB2ImageSrc(thumbnailUrl)
      if (img.complete && img.naturalHeight > 0) setImageLoaded(true)
    }
  }, [thumbnailUrl])

  return (
    <div
      className={`
        relative group cursor-pointer
        bg-card border rounded-lg overflow-hidden
        transition-all duration-200
        ${isSelected ? 'border-penta-blue dark:border-penta-sky' : 'hover:shadow-md'}
        w-[${CARD_WIDTH}px] flex flex-col
      `}
      style={{ width: CARD_WIDTH }}
      onClick={() => onClick(wallpaper.id)}
    >
      <div
        className="relative bg-muted overflow-hidden"
        style={{ height: CARD_HEIGHT }}
      >
        {thumbnailUrl ? (
          <>
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <Image
              src={getB2ImageSrc(thumbnailUrl)}
              alt={wallpaper.title}
              fill
              unoptimized={isB2WorkerUrl(getB2ImageSrc(thumbnailUrl))}
              sizes={`${CARD_WIDTH}px`}
              className={`object-cover transition-opacity duration-300 ${
                !imageLoaded ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
            {showHoverEditLabel && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                <span className="text-white text-sm font-medium">편집하기</span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">이미지 없음</span>
          </div>
        )}

        {showActions && (onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-auto">
            {onEdit && (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(wallpaper)
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(wallpaper.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t">
        <span className="text-sm font-semibold block truncate">
          {wallpaper.title || 'N/A'}
        </span>
        <span className="text-xs text-muted-foreground truncate block mt-0.5">
          {wallpaper.description || '설명 없음'}
        </span>
      </div>
    </div>
  )
}
