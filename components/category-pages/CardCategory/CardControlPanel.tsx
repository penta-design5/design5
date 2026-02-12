'use client'

import { useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Type, Image as ImageIcon, Upload, X, RotateCcw, Save, FolderOpen, Settings2, Check, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { toast } from 'sonner'
import type { CardTemplate, CardUserEditData, CardTemplateConfig, SavedCardPreset } from '@/lib/card-schemas'

interface CardControlPanelProps {
  template: CardTemplate
  userEditData: CardUserEditData
  activeElementId: string | null
  onTextChange: (elementId: string, value: string) => void
  onLogoChange: (logoUrl: string | null) => void
  onLogoAlignChange: (align: 'left' | 'center' | 'right') => void
  onBackgroundIndexChange: (index: number) => void
  onElementSelect: (elementId: string | null) => void
  onReset: () => void
  activePresetName: string | null
  currentTemplatePresets: SavedCardPreset[]
  activePresetId: string | null
  onSavePreset: () => void
  onLoadPreset: (preset: SavedCardPreset) => void
  onDeletePreset: (presetId: string, e: React.MouseEvent) => void
  onManagePresets: () => void
}

export function CardControlPanel({
  template,
  userEditData,
  activeElementId,
  onTextChange,
  onLogoChange,
  onLogoAlignChange,
  onBackgroundIndexChange,
  onElementSelect,
  onReset,
  activePresetName,
  currentTemplatePresets,
  activePresetId,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onManagePresets,
}: CardControlPanelProps) {
  const config = template.config as CardTemplateConfig
  const fileInputRef = useRef<HTMLInputElement>(null)
  const images = Array.isArray(template.backgroundImages) ? template.backgroundImages : []
  const selectedIndex = Math.min(Math.max(0, userEditData.selectedBackgroundIndex ?? 0), Math.max(0, images.length - 1))

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('파일 크기는 5MB 이하여야 합니다.')
        return
      }
      onLogoChange(URL.createObjectURL(file))
      e.target.value = ''
    },
    [onLogoChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
        onLogoChange(URL.createObjectURL(file))
      } else if (file) {
        toast.error('이미지 파일만 5MB 이하로 업로드해주세요.')
      }
    },
    [onLogoChange]
  )

  const handleRemoveLogo = useCallback(() => {
    if (userEditData.logoUrl) URL.revokeObjectURL(userEditData.logoUrl)
    onLogoChange(null)
  }, [userEditData.logoUrl, onLogoChange])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">편집 설정</h2>
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1">
            {activePresetName && (
              <span className="text-xs text-muted-foreground truncate max-w-[100px] mr-1">{activePresetName}</span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>템플릿 기본값으로 초기화</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onSavePreset}>
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>설정 저장</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>저장된 설정 불러오기</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>저장된 설정</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {currentTemplatePresets.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">저장된 설정이 없습니다.</div>
                ) : (
                  <>
                    {currentTemplatePresets.map((preset) => (
                      <DropdownMenuItem
                        key={preset.id}
                        className={`flex items-center justify-between cursor-pointer ${activePresetId === preset.id ? 'bg-accent' : ''}`}
                        onClick={() => onLoadPreset(preset)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {activePresetId === preset.id ? (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <div className="h-4 w-4 flex-shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm">{preset.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(preset.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
                          onClick={(e) => onDeletePreset(preset.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-primary" onClick={onManagePresets}>
                      <Settings2 className="h-4 w-4" />
                      저장된 설정 관리
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </div>

      {/* 배경 선택 */}
      {images.length > 1 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">배경 이미지</Label>
          <div className="flex flex-wrap gap-2">
            {images.map((item, i) => (
              <Button
                key={i}
                variant={selectedIndex === i ? 'default' : 'outline'}
                size="sm"
                onClick={() => onBackgroundIndexChange(i)}
              >
                {item.label || `이미지 ${i + 1}`}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 텍스트 편집 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Type className="h-4 w-4" />
          텍스트 편집
        </div>
        <div className="space-y-3">
          {config.textElements.map((element) => (
            <div key={element.id} className="space-y-1.5">
              <Label
                htmlFor={`text-${element.id}`}
                className={`text-sm ${activeElementId === element.id ? 'text-penta-blue font-medium' : ''}`}
              >
                {element.label}
              </Label>
              {element.multiline ? (
                <Textarea
                  id={`text-${element.id}`}
                  value={userEditData.textValues[element.id] ?? element.defaultValue}
                  onChange={(e) => onTextChange(element.id, e.target.value)}
                  onFocus={() => onElementSelect(element.id)}
                  placeholder={element.defaultValue}
                  rows={4}
                  className={activeElementId === element.id ? 'border-penta-blue ring-1 ring-penta-blue' : ''}
                />
              ) : (
                <Input
                  id={`text-${element.id}`}
                  value={userEditData.textValues[element.id] ?? element.defaultValue}
                  onChange={(e) => onTextChange(element.id, e.target.value)}
                  onFocus={() => onElementSelect(element.id)}
                  placeholder={element.defaultValue}
                  className={activeElementId === element.id ? 'border-penta-blue ring-1 ring-penta-blue' : ''}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 로고/서명 */}
      {config.logoArea && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            로고 또는 서명
          </div>
          {userEditData.logoUrl ? (
            <div className="space-y-3">
              <div className="relative">
                <div className="relative aspect-[2.5/1] bg-muted rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={userEditData.logoUrl} alt="로고" className="w-full h-full object-contain p-4" />
                </div>
                <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={handleRemoveLogo}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">정렬:</span>
                <div className="flex rounded-md border p-0.5">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={(userEditData.logoAlign ?? 'center') === 'left' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onLogoAlignChange('left')}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>좌측 정렬</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={(userEditData.logoAlign ?? 'center') === 'center' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onLogoAlignChange('center')}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>중앙 정렬</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={(userEditData.logoAlign ?? 'center') === 'right' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onLogoAlignChange('right')}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>우측 정렬</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                activeElementId === 'logo'
                  ? 'border-penta-blue bg-penta-blue/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onClick={() => {
                onElementSelect('logo')
                fileInputRef.current?.click()
              }}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">클릭하거나 파일을 드래그하여 업로드</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG (최대 5MB)</p>
            </div>
          )}
        </div>
      )}

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          제목·부제목·인사말·발신자·로고를 편집한 뒤 아래에서 PNG, JPG, PDF로 내보낼 수 있습니다.<br />
          로고 또는 서명 이미지는 편집 상태에서만 유효합니다.
        </p>
      </div>
    </div>
  )
}
