'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RotateCcw, Link as LinkIcon, Loader2 } from 'lucide-react'
import { getB2ImageSrc } from '@/lib/b2-client-url'

interface Post {
  id: string
  title: string
  concept?: string | null // 캐릭터 타입
  images?: Array<{ url: string; thumbnailUrl?: string; name: string; order: number }> | null | any
}

interface CharacterPropertyPanelProps {
  post: Post | null
  onSizeChange: (width?: number, height?: number) => void
  onDownload: (format: 'png' | 'jpg' | 'svg') => Promise<void>
  variant?: 'sidebar' | 'sheet'
}

const SIZE_PRESETS = [
  { label: '300w', width: 300 },
  { label: '500w', width: 500 },
  { label: '800w', width: 800 },
  { label: '1000w', width: 1000 },
  { label: '1500w', width: 1500 },
]

export function CharacterPropertyPanel({
  post,
  onSizeChange,
  onDownload,
  variant = 'sidebar',
}: CharacterPropertyPanelProps) {
  const isSheet = variant === 'sheet'
  const [width, setWidth] = useState<number | undefined>(undefined)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg' | 'svg'>('png')
  const [originalWidth, setOriginalWidth] = useState<number | undefined>(undefined)
  const [originalHeight, setOriginalHeight] = useState<number | undefined>(undefined)
  const [isSizeFieldFocused, setIsSizeFieldFocused] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const getImageSrc = (url: string) => getB2ImageSrc(url)

  // SVG 포맷 선택 시 원본 크기로 되돌리기
  useEffect(() => {
    if (downloadFormat === 'svg' && originalWidth !== undefined && originalHeight !== undefined) {
      setWidth(originalWidth)
      setHeight(originalHeight)
      onSizeChange(originalWidth, originalHeight)
    }
  }, [downloadFormat, originalWidth, originalHeight, onSizeChange])

  // post가 변경될 때 width, height 초기화
  useEffect(() => {
    if (post) {
      setWidth(undefined)
      setHeight(undefined)
    }
  }, [post])

  // 이미지 정보 추출 (비율 계산용)
  useEffect(() => {
    if (!post?.images) {
      setAspectRatio(null)
      setWidth(undefined)
      setHeight(undefined)
      return
    }

    let images: Array<{ url: string; thumbnailUrl?: string; name: string; order: number }> = []
    if (Array.isArray(post.images)) {
      images = post.images
    } else if (typeof post.images === 'string') {
      try {
        images = JSON.parse(post.images)
      } catch {
        images = []
      }
    }

    if (images.length > 0) {
      const firstImage = images[0]
      const rawImageUrl = firstImage.thumbnailUrl || firstImage.url
      const imageUrl = getImageSrc(rawImageUrl)

      // 이미지 로드하여 비율 계산
      const img = new window.Image()
      img.onload = () => {
        const ratio = img.width / img.height
        setAspectRatio(ratio)
        // 원본 크기 저장
        setOriginalWidth(img.width)
        setOriginalHeight(img.height)
        // 초기 크기를 원본 이미지 크기로 설정 (다운로드 시 기본 크기)
        setWidth(img.width)
        setHeight(img.height)
        // 부모 컴포넌트에 초기 크기 전달
        onSizeChange(img.width, img.height)
      }
      img.onerror = (error) => {
        console.error('[CharacterPropertyPanel] 이미지 로드 실패:', error, imageUrl)
        setAspectRatio(null)
      }
      img.src = imageUrl
    }
  }, [post, onSizeChange])

  // 너비 변경 시 높이 자동 조정 (정비율)
  const handleWidthChange = (value: string) => {
    const numValue = value.trim()
    
    if (!numValue) {
      // 빈 값이면 가로만 undefined로 설정
      setWidth(undefined)
      onSizeChange(undefined, height)
      return
    }

    const newWidth = parseFloat(numValue)
    if (isNaN(newWidth) || newWidth <= 0) {
      return
    }

    setWidth(newWidth)
    
    // aspectRatio가 있으면 높이 자동 계산
    if (aspectRatio) {
      const newHeight = newWidth / aspectRatio
      setHeight(newHeight)
      onSizeChange(newWidth, newHeight)
    } else {
      // aspectRatio가 없으면 가로만 설정
      onSizeChange(newWidth, height)
    }
  }

  // 높이 변경 시 너비 자동 조정 (정비율)
  const handleHeightChange = (value: string) => {
    const numValue = value.trim()
    
    if (!numValue) {
      // 빈 값이면 세로만 undefined로 설정
      setHeight(undefined)
      onSizeChange(width, undefined)
      return
    }

    const newHeight = parseFloat(numValue)
    if (isNaN(newHeight) || newHeight <= 0) {
      return
    }

    setHeight(newHeight)
    
    // aspectRatio가 있으면 너비 자동 계산
    if (aspectRatio) {
      const newWidth = newHeight * aspectRatio
      setWidth(newWidth)
      onSizeChange(newWidth, newHeight)
    } else {
      // aspectRatio가 없으면 세로만 설정
      onSizeChange(width, newHeight)
    }
  }

  // 프리셋 너비 선택
  const handlePresetClick = (presetWidth: number) => {
    // 항상 너비 설정
    setWidth(presetWidth)
    
    if (aspectRatio) {
      // aspectRatio가 있으면 높이도 계산하여 설정 (반올림)
      const presetHeight = Math.round(presetWidth / aspectRatio)
      setHeight(presetHeight)
      onSizeChange(presetWidth, presetHeight)
    } else {
      // aspectRatio가 없으면 너비만 설정
      setHeight(undefined)
      onSizeChange(presetWidth, undefined)
    }
  }

  // 원본 크기로 초기화
  const handleResetSize = () => {
    if (originalWidth !== undefined && originalHeight !== undefined) {
      setWidth(originalWidth)
      setHeight(originalHeight)
      onSizeChange(originalWidth, originalHeight)
    }
  }

  if (!post) {
    return (
      <div
        className={
          isSheet
            ? 'flex min-h-[200px] w-full items-center justify-center bg-background'
            : 'fixed bottom-0 right-0 top-0 flex h-full w-[410px] items-center justify-center bg-background'
        }
      >
        <p className="text-muted-foreground">게시물을 선택하세요</p>
      </div>
    )
  }

  return (
    <div
      className={
        isSheet
          ? 'w-full min-h-0 overflow-y-auto bg-background'
          : 'fixed bottom-0 right-0 top-0 h-full w-[410px] overflow-y-auto bg-background'
      }
    >
      <div className={isSheet ? 'space-y-6 px-6 pb-8 pt-6' : 'space-y-6 px-8 pb-8 pt-14'}>
        {/* 제목 및 타입 */}
        <div className="space-y-5 pb-8 border-b">
          <h2 className="text-xl font-bold">{post.title}</h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
              {post.concept || '캐릭터'}
            </span>
          </div>
        </div>

        {/* 사이즈 조정 */}
        <div className="space-y-3 pt-4">
          <Label className='text-xs text-muted-foreground'>SIZE</Label>
          
          <div className="flex justify-between items-center gap-3">
            <div className='flex items-center gap-2'>
              <span className='text-sm'>W</span>
              <Input
                id="width"
                type="number"
                value={width !== undefined ? Math.round(width).toString() : ''}
                onChange={(e) => {
                  handleWidthChange(e.target.value)
                }}
                onFocus={() => {
                  setIsSizeFieldFocused(true)
                }}
                onBlur={() => {
                  setIsSizeFieldFocused(false)
                }}
                placeholder="자동"
                className='h-8'
                style={{
                  backgroundColor: isSizeFieldFocused ? '#D7EDFF80' : undefined,
                }}
              />
              <span className='text-sm'>px</span>
            </div>
            <LinkIcon className="h-6 w-6 text-muted-foreground" />
            <div className='flex items-center gap-2'>
              <span className='text-sm'>H</span>
              <Input
                id="height"
                type="number"
                value={height !== undefined ? Math.round(height).toString() : ''}
                onChange={(e) => {
                  handleHeightChange(e.target.value)
                }}
                onFocus={() => {
                  setIsSizeFieldFocused(true)
                }}
                onBlur={() => {
                  setIsSizeFieldFocused(false)
                }}
                placeholder="자동"
                className='h-8'
                style={{
                  backgroundColor: isSizeFieldFocused ? '#D7EDFF80' : undefined,
                }}
              />
              <span className='text-sm'>px</span>
            </div>
            <div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetSize}
                disabled={originalWidth === undefined || originalHeight === undefined}
                className="h-8 w-8"
                title="원본 크기로 초기화"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 프리셋 버튼 */}
          <div className="pt-2 pb-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              {SIZE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handlePresetClick(preset.width)
                  }}
                  className={width === preset.width ? 'text-xs dark:text-black bg-penta-sky/20 dark:bg-gray-50 hover:bg-penta-sky/20 border-none flex-1 h-8' : 'text-xs dark:text-gray-50 dark:hover:text-white bg-gray-50 dark:bg-penta-sky/20 dark:hover:bg-penta-sky/30 border-none flex-1 h-8'}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 다운로드 */}
        <div className="space-y-3 pt-4">
          <Label className='text-xs text-muted-foreground'>FORMAT</Label>
          <div className="space-y-2">
            {/* 포맷 선택 버튼 */}
            <div className="flex justify-between items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDownloadFormat('png')
                }}
                className={downloadFormat === 'png' 
                  ? 'text-xs dark:text-black bg-penta-sky/20 dark:bg-gray-50 hover:bg-penta-sky/20 border-none flex-1 h-8' 
                  : 'text-xs bg-white dark:bg-penta-sky/20 dark:hover:bg-penta-sky/30 flex-1 h-8 dark:text-white dark:hover:text-white border'}
              >
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDownloadFormat('jpg')
                }}
                className={downloadFormat === 'jpg' 
                  ? 'text-xs dark:text-black bg-penta-sky/20 dark:bg-gray-50 hover:bg-penta-sky/20 border-none flex-1 h-8' 
                  : 'text-xs bg-white dark:bg-penta-sky/20 dark:hover:bg-penta-sky/30 flex-1 h-8 dark:text-white dark:hover:text-white border'}
              >
                JPG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDownloadFormat('svg')
                }}
                className={downloadFormat === 'svg' 
                  ? 'text-xs dark:text-black bg-penta-sky/20 dark:bg-gray-50 hover:bg-penta-sky/20 border-none flex-1 h-8' 
                  : 'text-xs bg-white dark:bg-penta-sky/20 dark:hover:bg-penta-sky/30 flex-1 h-8 dark:text-white dark:hover:text-white border'}
              >
                SVG
              </Button>
            </div>
            <div className='pb-12 border-b'>
              <p className='text-xs font-light text-muted-foreground'>
                <span className='font-semibold mr-1'>PNG </span>: 배경투명
                <span className='font-semibold ml-4 mr-1'>JPG </span>: 배경불투명
                <span className='font-semibold ml-4'>SVG </span>: 벡터 (ai 파일대체)
              </p>
            </div>
            <div className='pt-10'>
              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    setDownloading(true)
                    await onDownload(downloadFormat)
                  } catch (error) {
                    console.error('Download error:', error)
                  } finally {
                    setDownloading(false)
                  }
                }}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    다운로드 중...
                  </>
                ) : (
                  <>
                    다운로드
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
