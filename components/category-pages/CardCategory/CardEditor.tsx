'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, ZoomIn, ZoomOut, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider'
import { CardCanvas } from './CardCanvas'
import { CardControlPanel } from './CardControlPanel'
import { CardExport } from './CardExport'
import type {
  CardTemplate,
  CardUserEditData,
  CardTemplateConfig,
  SavedCardPreset,
} from '@/lib/card-schemas'
import { cardPresetStorageUtils } from '@/lib/card-schemas'

interface CardEditorProps {
  template: CardTemplate
  onBack: () => void
}

export function CardEditor({ template, onBack }: CardEditorProps) {
  const { confirm } = useConfirmDialog()
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const config = template.config as CardTemplateConfig
  const images = Array.isArray(template.backgroundImages) ? template.backgroundImages : []
  // 편집 화면 진입 시 항상 템플릿 기본값으로 초기화 (웰컴보드와 동일)
  const [userEditData, setUserEditData] = useState<CardUserEditData>(() => {
    const initialTextValues: Record<string, string> = {}
    config.textElements.forEach((el) => {
      initialTextValues[el.id] = el.defaultValue
    })
    return {
      selectedBackgroundIndex: 0,
      textValues: initialTextValues,
      logoUrl: null,
      logoAlign: 'center',
    }
  })

  const [autoScale, setAutoScale] = useState(1)
  const [manualZoom, setManualZoom] = useState<number | null>(null)
  const [activeElementId, setActiveElementId] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [savedPresets, setSavedPresets] = useState<SavedCardPreset[]>([])
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  const idx = Math.min(Math.max(0, userEditData.selectedBackgroundIndex ?? 0), Math.max(0, images.length - 1))
  const bgItem = images[idx]
  const canvasWidth = bgItem ? bgItem.width : template.width
  const canvasHeight = bgItem ? bgItem.height : template.height

  const scale = manualZoom ?? autoScale

  useEffect(() => {
    setSavedPresets(cardPresetStorageUtils.getAllPresets())
  }, [])

  useEffect(() => {
    cardPresetStorageUtils.saveAutosave(template.id, userEditData)
  }, [template.id, userEditData])

  const calculateScale = useCallback(() => {
    if (!containerRef.current) return
    const w = containerRef.current.offsetWidth - 48
    const h = containerRef.current.offsetHeight - 48
    const sx = w / canvasWidth
    const sy = h / canvasHeight
    setAutoScale(Math.min(sx, sy, 1))
  }, [canvasWidth, canvasHeight])

  useEffect(() => {
    calculateScale()
    const onResize = () => calculateScale()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calculateScale])

  const handleTextChange = useCallback((elementId: string, value: string) => {
    setUserEditData((prev) => ({
      ...prev,
      textValues: { ...prev.textValues, [elementId]: value },
    }))
  }, [])

  const handleLogoChange = useCallback((logoUrl: string | null) => {
    setUserEditData((prev) => ({ ...prev, logoUrl }))
  }, [])

  const handleLogoAlignChange = useCallback((logoAlign: 'left' | 'center' | 'right') => {
    setUserEditData((prev) => ({ ...prev, logoAlign }))
  }, [])

  const handleBackgroundIndexChange = useCallback((index: number) => {
    setUserEditData((prev) => ({ ...prev, selectedBackgroundIndex: index }))
  }, [])

  const handleReset = useCallback(async () => {
    if (!(await confirm('템플릿 기본값으로 초기화하시겠습니까?'))) return
    const initialTextValues: Record<string, string> = {}
    config.textElements.forEach((el) => {
      initialTextValues[el.id] = el.defaultValue
    })
    setUserEditData({
      selectedBackgroundIndex: userEditData.selectedBackgroundIndex,
      textValues: initialTextValues,
      logoUrl: null,
      logoAlign: 'center',
    })
    setActiveElementId(null)
    setActivePresetId(null)
  }, [config, userEditData.selectedBackgroundIndex, confirm])

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      toast.error('프리셋 이름을 입력해주세요.')
      return
    }
    const newPreset: SavedCardPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      createdAt: new Date().toISOString(),
      templateId: template.id,
      templateName: template.name,
      userEditData,
    }
    if (cardPresetStorageUtils.savePreset(newPreset)) {
      setSavedPresets((prev) => [...prev, newPreset])
      setActivePresetId(newPreset.id)
      setSaveDialogOpen(false)
      setPresetName('')
      toast.success('설정이 저장되었습니다.')
    } else {
      toast.error('저장 중 오류가 발생했습니다.')
    }
  }, [presetName, template.id, template.name, userEditData])

  const handleLoadPreset = useCallback((preset: SavedCardPreset) => {
    setUserEditData(preset.userEditData)
    setActivePresetId(preset.id)
  }, [])

  const handleDeletePreset = useCallback(
    async (presetId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!(await confirm('이 프리셋을 삭제하시겠습니까?'))) return
      if (cardPresetStorageUtils.deletePreset(presetId)) {
        setSavedPresets((prev) => prev.filter((p) => p.id !== presetId))
        if (activePresetId === presetId) setActivePresetId(null)
      }
    },
    [activePresetId, confirm]
  )

  const currentTemplatePresets = useMemo(
    () => savedPresets.filter((p) => p.templateId === template.id),
    [savedPresets, template.id]
  )
  const activePresetName = useMemo(
    () => (activePresetId ? savedPresets.find((p) => p.id === activePresetId)?.name ?? null : null),
    [activePresetId, savedPresets]
  )

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50 dark:bg-neutral-900 z-50">
      <div className="flex-1 pr-[410px] overflow-hidden">
        <div className="h-full flex flex-col pt-8">
          <div className="px-8 pt-4 pb-4 flex items-center gap-4">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>목록으로</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-semibold">{template.name}</h2>
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
            </div>
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setManualZoom((z) => Math.max(0.1, (z ?? scale) - 0.1))}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>축소</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setManualZoom(1)}>
                      {Math.round(scale * 100)}%
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>원본 크기</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setManualZoom((z) => Math.min(1.5, (z ?? scale) + 0.1))}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>확대</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
          <div ref={containerRef} className="flex-1 flex mx-8 mb-8 rounded-lg overflow-auto p-4">
            <div
              className="shadow-lg rounded-lg overflow-hidden flex-shrink-0 m-auto"
              style={{ width: canvasWidth * scale, height: canvasHeight * scale }}
            >
              <CardCanvas
                ref={canvasRef}
                template={template}
                userEditData={userEditData}
                scale={scale}
                showEditHighlight={true}
                activeElementId={activeElementId}
                onElementClick={setActiveElementId}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed right-0 top-0 bottom-0 w-[410px] border-l bg-card overflow-y-auto z-50">
        <div className="p-6 space-y-6">
          <CardControlPanel
            template={template}
            userEditData={userEditData}
            activeElementId={activeElementId}
            onTextChange={handleTextChange}
            onLogoChange={handleLogoChange}
            onLogoAlignChange={handleLogoAlignChange}
            onBackgroundIndexChange={handleBackgroundIndexChange}
            onElementSelect={setActiveElementId}
            onReset={handleReset}
            activePresetName={activePresetName}
            currentTemplatePresets={currentTemplatePresets}
            activePresetId={activePresetId}
            onSavePreset={() => setSaveDialogOpen(true)}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={handleDeletePreset}
            onManagePresets={() => setManageDialogOpen(true)}
          />
          <CardExport template={template} userEditData={userEditData} canvasRef={canvasRef} />
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>설정 저장</DialogTitle>
            <DialogDescription>현재 편집 설정을 저장합니다. 나중에 불러와 재사용할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-preset-name">프리셋 이름</Label>
              <Input
                id="card-preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="예: 신년 카드 기본"
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                설정은 브라우저 로컬 저장소에 저장됩니다. 다른 기기나 시크릿 모드에서는 사용할 수 없을 수 있습니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>취소</Button>
            <Button onClick={handleSavePreset}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>저장된 설정 관리</DialogTitle>
            <DialogDescription>저장된 설정을 관리할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {savedPresets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">저장된 설정이 없습니다.</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  savedPresets.reduce((acc, p) => {
                    if (!acc[p.templateId]) acc[p.templateId] = []
                    acc[p.templateId].push(p)
                    return acc
                  }, {} as Record<string, SavedCardPreset[]>)
                ).map(([templateId, presets]) => (
                  <div key={templateId} className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {presets[0]?.templateName ?? templateId}
                      <span className="text-xs text-muted-foreground">({presets.length}개)</span>
                    </h4>
                    <div className="space-y-1 pl-4">
                      {presets.map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent"
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium truncate">{preset.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(preset.createdAt).toLocaleString('ko-KR')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setManageDialogOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
