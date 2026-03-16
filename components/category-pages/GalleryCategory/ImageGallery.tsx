'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { cn } from '@/lib/utils'
import { ZoomIn } from 'lucide-react'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
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
}

const COLLAPSED_WIDTH = 600

export function ImageGallery({ images }: ImageGalleryProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // images가 JSON 타입일 수 있으므로 타입 확인 및 변환
  let validImages: PostImage[] = []
  
  if (images) {
    // 이미 배열인 경우 (Prisma가 이미 파싱한 경우)
    if (Array.isArray(images)) {
      validImages = images as PostImage[]
    } 
    // 문자열인 경우 (JSON 문자열)
    else if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images)
        validImages = Array.isArray(parsed) ? parsed : []
      } catch {
        validImages = []
      }
    }
    // 객체인 경우 (Prisma JsonValue 타입)
    else if (typeof images === 'object' && images !== null) {
      // Prisma가 반환하는 JsonValue는 이미 파싱된 배열일 수 있음
      const parsed = images as any
      if (Array.isArray(parsed)) {
        validImages = parsed
      } else {
        validImages = []
      }
    }
  }

  // order로 정렬
  const sortedImages = [...validImages].sort((a, b) => (a.order || 0) - (b.order || 0))

  // Backblaze B2 URL인 경우 프록시를 통해 제공
  const getImageSrc = (url: string) => getB2ImageSrc(url)

  // 이미지 크기 미리 로드 - early return 이전에 배치
  useEffect(() => {
    // sortedImages가 비어있으면 실행하지 않음
    if (!sortedImages || sortedImages.length === 0) {
      return
    }

    // sortedImages를 기반으로 이미지 크기 로드
    sortedImages.forEach((image, index) => {
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions(prev => {
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
  }, [images]) // images prop이 변경될 때만 실행

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index))
  }

  // 확대/축소 시 중앙 기준으로 하기 위해 컨테이너 너비 측정
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // early return은 useEffect 이후에 배치
  if (!validImages || validImages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        이미지가 없습니다.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-4 pt-20 pr-6 pb-6 pl-6 md:pt-6 flex flex-col items-center w-full">
      {sortedImages.map((image, index) => {
        const isExpanded = expandedIndex === index
        const isLoaded = loadedImages.has(index)
        const blurDataURL = image.blurDataURL
        const dimensions = imageDimensions.get(index)
        const scale = containerWidth > 0 ? containerWidth / COLLAPSED_WIDTH : 1
        // 확대 시 레이아웃 상의 높이 (origin-top이므로 아래로만 커짐). 아래 이미지가 겹치지 않도록 여백 계산
        const layoutHeight = dimensions
          ? COLLAPSED_WIDTH * (dimensions.height / dimensions.width)
          : 450 // fallback 4:3
        const expandMarginBottom = isExpanded && scale > 1 ? layoutHeight * (scale - 1) : 0

        return (
          <div
            key={index}
            className="relative group w-full flex justify-center overflow-visible transition-[margin-bottom] duration-300"
            style={{
              marginBottom: expandMarginBottom,
              zIndex: isExpanded ? 10 : undefined,
            }}
          >
            <div
              className={cn(
                'relative transition-all duration-300 origin-top',
                isExpanded ? 'cursor-zoom-out' : 'cursor-zoom-in'
              )}
              style={{
                width: COLLAPSED_WIDTH,
                transform: isExpanded ? `scale(${scale})` : 'scale(1)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                setExpandedIndex(isExpanded ? null : index)
              }}
            >
              {/* Skeleton Placeholder - blur보다 먼저 표시 */}
              {!isLoaded && !blurDataURL && (
                <Skeleton className={cn(
                  'absolute inset-0 w-full',
                  isExpanded ? 'h-full' : 'h-[450px]'
                )} />
              )}
              {/* Blur-up Placeholder */}
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
                    unoptimized // blur placeholder는 최적화 불필요
                  />
                </div>
              )}
              {/* 메인 이미지 (원본) */}
              {dimensions ? (
                <div
                  className="relative transition-all duration-300 w-full"
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
                      'object-contain transition-opacity duration-300 w-full h-auto',
                      !isLoaded ? 'opacity-0' : 'opacity-100'
                    )}
                    style={{ cursor: isExpanded ? 'zoom-out' : 'zoom-in' }}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    priority={index === 0}
                    onLoad={() => handleImageLoad(index)}
                    sizes={isExpanded ? '100vw' : '600px'}
                  />
                </div>
              ) : (
                // 이미지 크기를 아직 모를 때는 fill 사용
                <div
                  className="relative transition-all duration-300 w-full"
                  style={{ aspectRatio: '4 / 3', minHeight: '300px' }}
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
                    style={{ cursor: isExpanded ? 'zoom-out' : 'zoom-in' }}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    priority={index === 0}
                    onLoad={() => handleImageLoad(index)}
                    sizes={isExpanded ? '100vw' : '600px'}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

