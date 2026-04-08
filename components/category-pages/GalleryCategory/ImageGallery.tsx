'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getB2ImageSrc, isB2WorkerUrl } from '@/lib/b2-client-url'

interface PostImage {
  url: string
  thumbnailUrl?: string
  blurDataURL?: string
  name: string
  order: number
}

interface ImageGalleryProps {
  images: PostImage[]
  /** 다른 게시물로 이동 시 줌 상태 초기화 */
  postId?: string
  onImageZoomChange?: (zoomed: boolean) => void
}

const COLLAPSED_WIDTH = 600

const NO_ZOOM_HINT =
  '600px보다 큰 원본만 확대해서 볼 수 있어요. 이 이미지는 이미 원본 크기로 표시됩니다.'

export function ImageGallery({ images, postId, onImageZoomChange }: ImageGalleryProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(
    new Map()
  )
  let validImages: PostImage[] = []

  if (images) {
    if (Array.isArray(images)) {
      validImages = images as PostImage[]
    } else if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images)
        validImages = Array.isArray(parsed) ? parsed : []
      } catch {
        validImages = []
      }
    } else if (typeof images === 'object' && images !== null) {
      const parsed = images as any
      validImages = Array.isArray(parsed) ? parsed : []
    }
  }

  const sortedImages = [...validImages].sort((a, b) => (a.order || 0) - (b.order || 0))

  const getImageSrc = (url: string) => getB2ImageSrc(url)

  useEffect(() => {
    if (!sortedImages || sortedImages.length === 0) {
      return
    }

    sortedImages.forEach((image, index) => {
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions((prev) => {
          const newMap = new Map(prev)
          newMap.set(index, {
            width: img.naturalWidth,
            height: img.naturalHeight,
          })
          return newMap
        })
      }
      img.src = getImageSrc(image.url)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  useEffect(() => {
    onImageZoomChange?.(expandedIndex !== null)
  }, [expandedIndex, onImageZoomChange])

  useEffect(() => {
    setExpandedIndex(null)
  }, [postId])

  useEffect(() => {
    if (expandedIndex === null) return
    const d = imageDimensions.get(expandedIndex)
    if (d !== undefined && d.width <= COLLAPSED_WIDTH) {
      setExpandedIndex(null)
    }
  }, [expandedIndex, imageDimensions])

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index))
  }

  if (!validImages || validImages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">이미지가 없습니다.</div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center space-y-4 pt-20 pr-6 pb-6 pl-6 md:pt-6">
      {sortedImages.map((image, index) => {
        const isExpanded = expandedIndex === index
        const isLoaded = loadedImages.has(index)
        const blurDataURL = image.blurDataURL
        const dimensions = imageDimensions.get(index)
        const canExpand = Boolean(dimensions && dimensions.width > COLLAPSED_WIDTH)

        if (isExpanded && canExpand && dimensions && dimensions.width > COLLAPSED_WIDTH) {
          const src = getImageSrc(image.url)
          const unopt = isB2WorkerUrl(src)
          return (
            <div
              key={index}
              className="relative z-10 flex w-full max-w-full flex-col items-center justify-center overflow-visible"
            >
              <div className="w-full max-w-full overflow-x-auto">
                <div className="flex justify-center p-6">
                  <div
                    className="inline-block shrink-0 cursor-zoom-out"
                    style={{ cursor: 'zoom-out' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedIndex(null)
                    }}
                  >
                    <div
                      className="relative"
                      style={{
                        width: dimensions.width,
                        height: dimensions.height,
                      }}
                    >
                      <Image
                        src={src}
                        alt={image.name || `Image ${index + 1}`}
                        width={dimensions.width}
                        height={dimensions.height}
                        unoptimized={unopt}
                        className="h-auto w-full cursor-zoom-out object-contain"
                        style={{ cursor: 'zoom-out' }}
                        priority
                        sizes={`${dimensions.width}px`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        const imageBlock = (
          <div
            className={cn(
              'relative transition-all duration-300',
              canExpand ? 'cursor-zoom-in' : dimensions ? 'cursor-help' : 'cursor-default'
            )}
            style={{ width: COLLAPSED_WIDTH }}
            onClick={(e) => {
              e.stopPropagation()
              if (canExpand) setExpandedIndex(index)
            }}
          >
            {!isLoaded && !blurDataURL && (
              <Skeleton className={cn('absolute inset-0 w-full', 'h-[450px]')} />
            )}
            {blurDataURL && !isLoaded && (
              <div className="absolute inset-0">
                <Image
                  src={blurDataURL}
                  alt=""
                  fill
                  className="object-contain transition-opacity duration-300"
                  style={{
                    filter: 'blur(10px)',
                    transform: 'scale(1.1)',
                  }}
                  aria-hidden="true"
                  unoptimized
                />
              </div>
            )}
            {dimensions ? (
              <div
                className="relative w-full transition-all duration-300"
                style={{
                  aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                }}
              >
                <Image
                  src={getImageSrc(image.url)}
                  alt={image.name || `Image ${index + 1}`}
                  width={dimensions.width}
                  height={dimensions.height}
                  unoptimized={isB2WorkerUrl(getImageSrc(image.url))}
                  className={cn(
                    'h-auto w-full object-contain transition-opacity duration-300',
                    !isLoaded ? 'opacity-0' : 'opacity-100'
                  )}
                  style={{
                    cursor: canExpand ? 'zoom-in' : dimensions ? 'help' : 'default',
                  }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  priority={index === 0}
                  onLoad={() => handleImageLoad(index)}
                  sizes="600px"
                />
              </div>
            ) : (
              <div
                className="relative min-h-[300px] w-full transition-all duration-300"
                style={{ aspectRatio: '4 / 3' }}
              >
                <Image
                  src={getImageSrc(image.url)}
                  alt={image.name || `Image ${index + 1}`}
                  fill
                  unoptimized={isB2WorkerUrl(getImageSrc(image.url))}
                  className={cn(
                    'object-contain transition-opacity duration-300',
                    !isLoaded ? 'opacity-0' : 'opacity-100'
                  )}
                  style={{ cursor: 'default' }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  priority={index === 0}
                  onLoad={() => handleImageLoad(index)}
                  sizes="600px"
                />
              </div>
            )}
          </div>
        )

        return (
          <div key={index} className="relative flex w-full justify-center overflow-visible">
            {dimensions && !canExpand ? (
              <Tooltip>
                <TooltipTrigger asChild>{imageBlock}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-center">
                  {NO_ZOOM_HINT}
                </TooltipContent>
              </Tooltip>
            ) : (
              imageBlock
            )}
          </div>
        )
      })}
    </div>
  )
}
