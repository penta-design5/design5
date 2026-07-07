'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { RotateCcw, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface IconPropertyPanelProps {
  color: string
  strokeWidth: number
  size: number
  selectedCount: number
  onColorChange: (color: string) => void
  onStrokeWidthChange: (strokeWidth: number) => void
  onSizeChange: (size: number) => void
  onReset: () => void
  onDownload: (format: 'png' | 'jpg' | 'svg') => Promise<void>
  variant?: 'sidebar' | 'sheet'
}

/** 아이콘 프리셋 붉은색 (삭제 버튼 등과 맞춤, globals.css `--destructive` 라이트 테마와 동일 HSL) */
const ICON_PRESET_DESTRUCTIVE_HEX = '#DD524C' // 실제 색상 박스에는 #CD5C52 로 보임 

// 선택 가능한 색상 목록
const COLOR_OPTIONS = [
  '#0060A9',
  '#302BCF',
  '#0C73EF',
  '#2DA6FA',
  '#5DD6D5',
  ICON_PRESET_DESTRUCTIVE_HEX,
  '#FECC09',
  '#999B9E',
  '#000000',
  '#FFFFFF',
]

const DEFAULT_COLOR = '#000000'
const DEFAULT_STROKE_WIDTH = 1
const DEFAULT_SIZE = 24

export function IconPropertyPanel({
  color,
  strokeWidth,
  size,
  selectedCount,
  onColorChange,
  onStrokeWidthChange,
  onSizeChange,
  onReset,
  onDownload,
  variant = 'sidebar',
}: IconPropertyPanelProps) {
  const isSheet = variant === 'sheet'
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg' | 'svg'>('svg')
  const [downloading, setDownloading] = useState(false)

  // 흰색 선택 여부 확인
  const isWhiteSelected = color === '#FFFFFF' || color === '#FFF' || color?.toLowerCase() === 'white'

  // 흰색으로 변경되고 JPG가 선택되어 있으면 PNG로 변경
  useEffect(() => {
    if (isWhiteSelected && downloadFormat === 'jpg') {
      setDownloadFormat('png')
    }
  }, [isWhiteSelected, downloadFormat])

  const isSingleSelected = selectedCount === 1
  const isMultipleSelected = selectedCount > 1

  // 리셋 핸들러 (FORMAT도 함께 리셋)
  const handleReset = () => {
    setDownloadFormat('svg')
    onReset()
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
        {/* 제목 */}
        <div className="space-y-2 pb-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">아이콘 속성</h2>
              <p className="text-sm text-muted-foreground">
                아이콘의 색상, 선 두께, 크기를 조정할 수 있습니다.
              </p>
            </div>
              {/* 리셋 버튼 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="pb-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>기본값으로 리셋</p>
                </TooltipContent>
              </Tooltip>
          </div>

        </div>

        {/* 색상 선택 */}
        <div className="space-y-4 pb-6">
          <Label className="text-xs text-muted-foreground">색상</Label>
          <div className="grid grid-cols-5 w-[70%] gap-2">
            {COLOR_OPTIONS.map((colorOption) => (
              <button
                key={colorOption}
                type="button"
                className={cn(
                  'box-border h-8 w-8 shrink-0 appearance-none rounded border border-solid p-0',
                  'transition-[box-shadow,border-color]',
                  color === colorOption
                    ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'border-border hover:border-primary/50',
                )}
                style={{
                  backgroundColor: colorOption,
                  borderColor:
                    colorOption === '#FFFFFF' ? '#e5e7eb' : colorOption,
                }}
                onClick={() => onColorChange(colorOption)}
                aria-label={`색상 선택: ${colorOption}`}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width 슬라이더 */}
        <div className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">선 두께</Label>
            <span className="text-sm text-muted-foreground">{strokeWidth}px</span>
          </div>
          <Slider
            value={[strokeWidth]}
            onValueChange={(values) => onStrokeWidthChange(values[0])}
            min={0.5}
            max={3}
            step={0.25}
            variant="small"
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5px</span>
            <span>3px</span>
          </div>
        </div>

        {/* Size 슬라이더 */}
        <div className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">크기</Label>
            <span className="text-sm text-muted-foreground">{size}px</span>
          </div>
          <Slider
            value={[size]}
            onValueChange={(values) => onSizeChange(values[0])}
            min={16}
            max={256}
            step={4}
            variant="small"
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>16px</span>
            <span>256px</span>
          </div>
          <p className="text-xs text-muted-foreground">
            * 목록에서 보이는 아이콘의 크기는 최대 56px 입니다.
          </p>
        </div>

        {/* 다운로드 - FORMAT 섹션 */}
        <div className="space-y-3 pb-6">
          <Label className='text-xs text-muted-foreground'>FORMAT</Label>
          <div className="space-y-2">
            {/* 아이콘 선택 없을 경우 표시 */}
            {!isSingleSelected && !isMultipleSelected && (
                <div className='pb-4'>
                  <p className='text-xs font-light text-muted-foreground'>
                    아이콘을 선택하세요.
                  </p>
                </div>
              )
            }

            {/* 포맷 선택 버튼 - 단일/다중 선택 시 표시 */}
            {(isSingleSelected || isMultipleSelected) && (
              <>
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
                  {!isWhiteSelected && (
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
                  )}
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
                <div className='pb-4'>
                  <p className='text-xs font-light text-muted-foreground'>
                    {isSingleSelected ? (
                      <>
                        <span className='font-semibold mr-1'>PNG </span>: 배경투명
                        <span className='font-semibold ml-4 mr-1'>JPG </span>: 배경불투명
                        <span className='font-semibold ml-4'>SVG </span>: 벡터 (ai 파일대체)
                      </>
                    ) : (
                      <>여러 아이콘 선택 시 선택한 포맷(PNG, JPG, SVG)으로 ZIP 파일로 다운로드됩니다.</>
                    )}
                  </p>
                </div>
              </>
            )}

            <div className='pt-10 border-t'>
              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    setDownloading(true)
                    // 단일/다중 모두 선택한 포맷으로 다운로드 (다중 시 ZIP)
                    await onDownload(downloadFormat)
                  } catch (error) {
                    console.error('Download error:', error)
                  } finally {
                    setDownloading(false)
                  }
                }}
                disabled={downloading || selectedCount === 0}
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    다운로드 중...
                  </>
                ) : (
                  <>
                    {isMultipleSelected ? `다운로드 (${selectedCount})` : '다운로드'}
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

export { DEFAULT_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_SIZE, COLOR_OPTIONS }
