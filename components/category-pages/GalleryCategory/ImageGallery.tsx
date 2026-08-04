'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Play, Youtube } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CursorFollowHint } from '@/components/category-pages/GalleryCategory/CursorFollowHint'
import {
  MediaPlayerDialog,
  type PlayableMedia,
} from '@/components/category-pages/GalleryCategory/MediaPlayerDialog'
import { getB2ImageSrc, isB2WorkerUrl } from '@/lib/b2-client-url'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/lib/youtube'
import type { MediaType } from '@/lib/media-schemas'

interface PostImage {
  type?: MediaType
  url: string
  thumbnailUrl?: string
  blurDataURL?: string
  videoId?: string
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
  '원본 이미지가 600px보다 클 경우에만 확대되며,\n이 이미지는 이미 원본 크기로 표시되고 있습니다.'

export function ImageGallery({ images, postId, onImageZoomChange }: ImageGalleryProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [playerMedia, setPlayerMedia] = useState<PlayableMedia | null>(null)
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
      // 동영상/유튜브는 크기 프로빙 불필요(고정 16:9). image.url을 이미지로 로드하면 실패함
      if ((image.type ?? 'image') !== 'image') return
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
    setPlayerMedia(null)
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
        const mediaType: MediaType = image.type ?? 'image'

        // 동영상/유튜브: 썸네일 + ▶ 오버레이. 클릭 시 재생 다이얼로그
        if (mediaType === 'video' || mediaType === 'youtube') {
          return (
            <div key={index} className="relative flex w-full justify-center overflow-visible">
              <button
                type="button"
                aria-label={`${mediaType === 'youtube' ? '유튜브' : '동영상'} 재생: ${image.name || ''}`}
                className="group relative block overflow-hidden rounded-lg bg-muted"
                style={{ width: COLLAPSED_WIDTH, maxWidth: '100%' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setPlayerMedia({
                    type: mediaType,
                    url: image.url,
                    videoId: image.videoId ?? extractYouTubeId(image.url) ?? undefined,
                    name: image.name,
                  })
                }}
              >
                <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                  <MediaThumbnail image={image} type={mediaType} />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 transition-transform duration-200 group-hover:scale-110">
                      <Play className="h-7 w-7 fill-white text-white" />
                    </span>
                  </span>
                </div>
              </button>
            </div>
          )
        }

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
              <CursorFollowHint content={NO_ZOOM_HINT}>{imageBlock}</CursorFollowHint>
            ) : (
              imageBlock
            )}
          </div>
        )
      })}

      {/*
        재생 다이얼로그 — 래퍼에서 전파 차단(2차 방어).
        React 포털은 DOM이 아니라 React 트리를 따라 전파되므로, 팝업(overlay/콘텐츠) 클릭이
        상위 GalleryDetailPage의 배경 핸들러(handleBackdropClick=목록 이동)까지 도달한다.
        여기서 한 번에 끊어 두면 다이얼로그 내부 구조가 바뀌어도 이탈이 재발하지 않는다.
        (GalleryDetailPage가 PostUploadDialog를 감싸는 것과 동일한 패턴)
      */}
      {/* className="contents" — 부모 flex(space-y-4)에 빈 박스가 끼어 여백이 생기지 않게 함.
          display:contents는 CSS 박스만 없애며 React 트리 전파 차단에는 영향이 없다. */}
      <div
        className="contents"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MediaPlayerDialog media={playerMedia} onClose={() => setPlayerMedia(null)} />
      </div>
    </div>
  )
}

/**
 * 동영상/유튜브 썸네일.
 * - video: 캡처 프레임(thumbnailUrl). 없으면 회색 배경.
 * - youtube: maxresdefault → hqdefault → 자체 유튜브풍 카드 순으로 폴백(사내망 썸네일 차단 대응).
 */
function MediaThumbnail({ image, type }: { image: PostImage; type: MediaType }) {
  // youtube: 0=maxres, 1=hq, 2=자체 카드
  const [ytStage, setYtStage] = useState(0)

  if (type === 'youtube') {
    const videoId = image.videoId ?? extractYouTubeId(image.url) ?? undefined

    if (ytStage >= 2 || !videoId) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-900 text-white">
          <Youtube className="h-12 w-12 text-red-600" />
          <span className="line-clamp-2 px-4 text-center text-sm text-white/80">
            {image.name || 'YouTube 동영상'}
          </span>
        </div>
      )
    }

    const src =
      ytStage === 0
        ? image.thumbnailUrl ?? youTubeThumbnailUrl(videoId, 'maxresdefault')
        : youTubeThumbnailUrl(videoId, 'hqdefault')

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={image.name || 'YouTube 동영상'}
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setYtStage((s) => s + 1)}
      />
    )
  }

  // video
  if (!image.thumbnailUrl) {
    return <div className="absolute inset-0 bg-neutral-800" />
  }
  const src = getB2ImageSrc(image.thumbnailUrl)
  return (
    <Image
      src={src}
      alt={image.name || '동영상'}
      fill
      unoptimized={isB2WorkerUrl(src)}
      className="object-cover"
      sizes="600px"
    />
  )
}
