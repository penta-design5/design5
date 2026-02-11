'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Loader2,
  ZoomIn,
  ZoomOut,
  Save,
  FolderOpen,
  RotateCcw,
  Check,
  Trash2,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider'
import { DesktopCanvas } from '@/components/category-pages/DesktopCategory/DesktopCanvas'
import { DesktopLeftToolbar } from '@/components/category-pages/DesktopCategory/DesktopLeftToolbar'
import { DesktopPropertyPanel } from '@/components/category-pages/DesktopCategory/DesktopPropertyPanel'
import { DesktopExport } from '@/components/category-pages/DesktopCategory/DesktopExport'
import type {
  DesktopEditorData,
  DesktopElement,
  SelectedBackground,
  SavedDesktopPreset,
} from '@/lib/desktop-schemas'
import { CALENDAR_COLOR_PRESETS, desktopStorageUtils, getDesktopElementBounds } from '@/lib/desktop-schemas'
import type { DesktopWallpaperPost } from '@/lib/desktop-schemas'

interface Category {
  id: string
  name: string
  slug: string
}

interface DesktopEditorPageProps {
  category: Category
  wallpaperId: string
}

const createNewElement = (type: 'title' | 'description' | 'calendar'): DesktopElement => {
  const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const base = { id, type, x: 100, y: 100 }
  if (type === 'title') {
    return { ...base, value: '제목', width: 400, textStyle: { fontSize: 32, color: '#333', fontFamily: 'Pretendard, sans-serif', fontWeight: 'bold' } }
  }
  if (type === 'description') {
    return { ...base, value: '설명을 입력하세요', width: 400, textStyle: { fontSize: 18, color: '#555', fontFamily: 'Pretendard, sans-serif', fontWeight: 'normal' } }
  }
  const now = new Date()
  const classic = CALENDAR_COLOR_PRESETS.classic
  return {
    ...base,
    width: 220,
    height: 200,
    calendarStyle: {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      fontSize: 14,
      theme: 'classic',
      ...classic,
    },
  }
}

export function DesktopEditorPage({ category, wallpaperId }: DesktopEditorPageProps) {
  const router = useRouter()
  const { confirm } = useConfirmDialog()
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [wallpaper, setWallpaper] = useState<DesktopWallpaperPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [editorData, setEditorData] = useState<DesktopEditorData>({
    selectedBackground: 'windows',
    elements: [],
  })
  const [activeElementId, setActiveElementId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [autoScale, setAutoScale] = useState(1)
  const [manualZoom, setManualZoom] = useState<number | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [savedPresets, setSavedPresets] = useState<SavedDesktopPreset[]>([])
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  const scale = manualZoom ?? autoScale

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/desktop-wallpapers/${wallpaperId}`)
        if (!res.ok) throw new Error('바탕화면을 불러올 수 없습니다.')
        const data = await res.json()
        setWallpaper(data)
        const autosave = desktopStorageUtils.getAutosave(wallpaperId)
        if (autosave) {
          setEditorData(autosave)
        }
      } catch (e) {
        toast.error('바탕화면을 불러오는데 실패했습니다.')
        router.push(`/${category.slug}`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [wallpaperId, category.slug, router])

  useEffect(() => {
    setSavedPresets(desktopStorageUtils.getPresetsByWallpaperId(wallpaperId))
  }, [wallpaperId])

  useEffect(() => {
    desktopStorageUtils.saveAutosave(wallpaperId, editorData)
  }, [wallpaperId, editorData])

  const calculateScale = useCallback(() => {
    if (!containerRef.current || !wallpaper) return
    const w = containerRef.current.offsetWidth - 48
    const h = containerRef.current.offsetHeight - 48
    const sw = editorData.selectedBackground === 'windows' ? wallpaper.widthWindows : wallpaper.widthMac
    const sh = editorData.selectedBackground === 'windows' ? wallpaper.heightWindows : wallpaper.heightMac
    const sx = w / sw
    const sy = h / sh
    setAutoScale(Math.min(sx, sy, 1))
  }, [wallpaper, editorData.selectedBackground])

  useEffect(() => {
    calculateScale()
    const onResize = () => calculateScale()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calculateScale])

  const handleBack = useCallback(() => {
    router.push(`/${category.slug}`)
  }, [category.slug, router])

  const handleBackgroundChange = useCallback((bg: SelectedBackground) => {
    setEditorData((prev) => ({ ...prev, selectedBackground: bg }))
  }, [])

  const handleAddElement = useCallback((type: 'title' | 'description' | 'calendar') => {
    const el = createNewElement(type)
    setEditorData((prev) => ({
      ...prev,
      elements: [...prev.elements, el],
    }))
    setActiveElementId(el.id)
    setSelectedIds([el.id])
  }, [])

  const handleElementClick = useCallback((id: string, addToSelection?: boolean) => {
    if (addToSelection) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
      setActiveElementId(id)
    } else {
      setActiveElementId(id)
      setSelectedIds([id])
    }
  }, [])

  const handleElementDrag = useCallback((id: string, x: number, y: number) => {
    setEditorData((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, x: Math.max(0, x), y: Math.max(0, y) } : el
      ),
    }))
  }, [])

  const handleAlign = useCallback(
    (align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      const ids = selectedIds.length > 0 ? selectedIds : activeElementId ? [activeElementId] : []
      if (ids.length === 0) return
      const els = editorData.elements.filter((e) => ids.includes(e.id))
      if (els.length === 0) return
      const canvasW = wallpaper
        ? editorData.selectedBackground === 'windows'
          ? wallpaper.widthWindows
          : wallpaper.widthMac
        : 2560
      const canvasH = wallpaper
        ? editorData.selectedBackground === 'windows'
          ? wallpaper.heightWindows
          : wallpaper.heightMac
        : 1440

      const getBounds = (el: DesktopElement) => getDesktopElementBounds(el, canvasW, canvasH)

      setEditorData((prev) => {
        const next = { ...prev, elements: [...prev.elements] }
        const sel = els.map((e) => prev.elements.find((x) => x.id === e.id)).filter(Boolean) as DesktopElement[]

        if (align === 'left') {
          const targetX = ids.length === 1 ? 0 : Math.min(...sel.map((s) => getBounds(s).x))
          next.elements = next.elements.map((s) => {
            if (!ids.includes(s.id)) return s
            const b = getBounds(s)
            return { ...s, x: s.x + (targetX - b.x), y: s.y }
          })
        } else if (align === 'center') {
          const centerXs = sel.map((s) => {
            const b = getBounds(s)
            return b.x + b.width / 2
          })
          const targetCx = ids.length === 1 ? canvasW / 2 : centerXs.reduce((a, c) => a + c, 0) / centerXs.length
          next.elements = next.elements.map((s) => {
            if (!ids.includes(s.id)) return s
            const b = getBounds(s)
            const cx = b.x + b.width / 2
            return { ...s, x: s.x + (targetCx - cx), y: s.y }
          })
        } else if (align === 'right') {
          const rights = sel.map((s) => {
            const b = getBounds(s)
            return b.x + b.width
          })
          const targetRight = ids.length === 1 ? canvasW : Math.max(...rights)
          next.elements = next.elements.map((s) => {
            if (!ids.includes(s.id)) return s
            const b = getBounds(s)
            return { ...s, x: s.x + (targetRight - (b.x + b.width)), y: s.y }
          })
        } else if (align === 'top') {
          const targetY = ids.length === 1 ? 0 : Math.min(...sel.map((s) => getBounds(s).y))
          next.elements = next.elements.map((s) => {
            if (!ids.includes(s.id)) return s
            const b = getBounds(s)
            return { ...s, x: s.x, y: s.y + (targetY - b.y) }
          })
        } else if (align === 'middle') {
          const centerYs = sel.map((s) => {
            const b = getBounds(s)
            return b.y + b.height / 2
          })
          const targetCy = ids.length === 1 ? canvasH / 2 : centerYs.reduce((a, c) => a + c, 0) / centerYs.length
          next.elements = next.elements.map((s) => {
            if (!ids.includes(s.id)) return s
            const b = getBounds(s)
            const cy = b.y + b.height / 2
            return { ...s, x: s.x, y: s.y + (targetCy - cy) }
          })
        } else if (align === 'bottom') {
          const bottoms = sel.map((s) => {
            const b = getBounds(s)
            return b.y + b.height
          })
          const targetBottom = ids.length === 1 ? canvasH : Math.max(...bottoms)
          next.elements = next.elements.map((s) => {
            if (!ids.includes(s.id)) return s
            const b = getBounds(s)
            return { ...s, x: s.x, y: s.y + (targetBottom - (b.y + b.height)) }
          })
        }
        return next
      })
    },
    [selectedIds, activeElementId, editorData.elements, editorData.selectedBackground, wallpaper]
  )

  const handleUpdateElement = useCallback((updates: Partial<DesktopElement>) => {
    if (!activeElementId) return
    setEditorData((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === activeElementId ? { ...el, ...updates } : el
      ),
    }))
  }, [activeElementId])

  const handleElementUpdate = useCallback((id: string, updates: Partial<DesktopElement>) => {
    setEditorData((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }))
  }, [])

  const handleDeleteElement = useCallback(() => {
    if (!activeElementId && selectedIds.length === 0) return
    const toRemove = selectedIds.length > 0 ? selectedIds : [activeElementId!]
    setEditorData((prev) => ({
      ...prev,
      elements: prev.elements.filter((e) => !toRemove.includes(e.id)),
    }))
    setActiveElementId(null)
    setSelectedIds([])
  }, [activeElementId, selectedIds])

  const activeElement = editorData.elements.find((e) => e.id === activeElementId) || null

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      toast.error('프리셋 이름을 입력해주세요.')
      return
    }
    const preset: SavedDesktopPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      createdAt: new Date().toISOString(),
      wallpaperId,
      wallpaperTitle: wallpaper?.title || '',
      data: editorData,
    }
    desktopStorageUtils.savePreset(preset)
    setSavedPresets((prev) => [...prev.filter((p) => p.id !== preset.id), preset])
    setActivePresetId(preset.id)
    setSaveDialogOpen(false)
    setPresetName('')
    toast.success('설정이 저장되었습니다.')
  }, [presetName, wallpaperId, wallpaper?.title, editorData])

  const handleLoadPreset = useCallback((p: SavedDesktopPreset) => {
    setEditorData(p.data)
    setActivePresetId(p.id)
  }, [])

  const handleDeletePreset = useCallback(
    async (presetId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!(await confirm('이 프리셋을 삭제하시겠습니까?'))) return
      const ok = desktopStorageUtils.deletePreset(presetId)
      if (ok) {
        setSavedPresets((prev) => prev.filter((p) => p.id !== presetId))
        if (activePresetId === presetId) setActivePresetId(null)
        toast.success('설정이 삭제되었습니다.')
      }
    },
    [activePresetId, confirm]
  )

  const handleReset = useCallback(async () => {
    if (!(await confirm('편집 내용을 초기화하시겠습니까?'))) return
    setEditorData({ selectedBackground: 'windows', elements: [] })
    setActiveElementId(null)
    setSelectedIds([])
  }, [confirm])

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement
      if (target?.closest('input') || target?.closest('textarea')) return
      const toRemove = selectedIds.length > 0 ? selectedIds : activeElementId ? [activeElementId] : []
      if ((ev.key === 'Delete' || ev.key === 'Backspace') && toRemove.length > 0) {
        ev.preventDefault()
        setEditorData((prev) => ({
          ...prev,
          elements: prev.elements.filter((el) => !toRemove.includes(el.id)),
        }))
        setActiveElementId(null)
        setSelectedIds([])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeElementId, selectedIds])

  if (loading || !wallpaper) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const canAlign = selectedIds.length >= 1 || activeElementId != null

  return (
    <div className="fixed inset-0 bg-neutral-50 dark:bg-neutral-900 flex flex-col z-50">
      {/* 상단 헤더 - 제목(목록으로 우측), 배경/줌/정렬 */}
      <div className="h-14 border-b flex items-center px-4 justify-between bg-background shrink-0">
        <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>목록으로</TooltipContent>
          </Tooltip>
          <h2 className="text-lg font-semibold">{wallpaper.title}</h2>
          <div className="flex gap-2 ml-2">
            <Button
              variant={editorData.selectedBackground === 'windows' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBackgroundChange('windows')}
            >
              윈도우 (16:9)
            </Button>
            <Button
              variant={editorData.selectedBackground === 'mac' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBackgroundChange('mac')}
            >
              맥 (16:10)
            </Button>
          </div>
        </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setManualZoom((z) => Math.max((z ?? scale) - 0.1, 0.2))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>축소</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setManualZoom(1)}>
                  {Math.round(scale * 100)}%
                </Button>
              </TooltipTrigger>
              <TooltipContent>원본 크기</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setManualZoom((z) => Math.min((z ?? scale) + 0.1, 1.5))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>확대</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-2" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAlign('left')} disabled={!canAlign}>
                  <AlignHorizontalJustifyStart className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>좌측 정렬</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAlign('center')} disabled={!canAlign}>
                  <AlignHorizontalJustifyCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>수평 중앙 정렬</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAlign('right')} disabled={!canAlign}>
                  <AlignHorizontalJustifyEnd className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>우측 정렬</TooltipContent>
            </Tooltip>
            <div className="w-px h-6 bg-border mx-2" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAlign('top')} disabled={!canAlign}>
                  <AlignVerticalJustifyStart className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>상단 정렬</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAlign('middle')} disabled={!canAlign}>
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>수직 중앙 정렬</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAlign('bottom')} disabled={!canAlign}>
                  <AlignVerticalJustifyEnd className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>하단 정렬</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* 메인 영역: 좌측 툴바 | 캔버스 | 우측 패널 */}
      <div className="flex flex-1 overflow-hidden">
        <DesktopLeftToolbar onAddElement={handleAddElement} />
        <div
          ref={containerRef}
          className="flex-1 min-w-0 overflow-x-auto overflow-y-auto"
        >
          <div className="min-w-full min-h-full flex items-center p-4">
            <div className="shadow-lg rounded-lg overflow-hidden flex-shrink-0 mx-auto">
              <DesktopCanvas
              ref={canvasRef}
              wallpaper={wallpaper}
              editorData={editorData}
              scale={scale}
              activeElementId={activeElementId}
              selectedIds={selectedIds}
              onElementClick={handleElementClick}
              onElementDrag={handleElementDrag}
              onElementUpdate={handleElementUpdate}
              onCanvasClick={() => { setActiveElementId(null); setSelectedIds([]); }}
            />
            </div>
          </div>
        </div>

        <div className="w-[410px] border-l bg-card flex flex-col shrink-0 overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between gap-1 shrink-0">
            <div>
              <h2 className="text-lg font-semibold">속성</h2>
            </div>

            <div>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>초기화</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSaveDialogOpen(true)}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>저장</TooltipContent>
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
                    <TooltipContent>불러오기</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>저장된 설정</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {savedPresets.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground">저장된 설정이 없습니다.</div>
                    ) : (
                      savedPresets.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          className={`flex items-center justify-between cursor-pointer ${activePresetId === p.id ? 'bg-accent' : ''}`}
                          onClick={() => handleLoadPreset(p)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {activePresetId === p.id ? (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : null}
                            <span className="truncate">{p.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => handleDeletePreset(p.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>

            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <DesktopPropertyPanel
              element={activeElement}
              onUpdate={handleUpdateElement}
              onDelete={handleDeleteElement}
            />
            <DesktopExport
              wallpaper={wallpaper}
              editorData={editorData}
              canvasRef={canvasRef}
            />
          </div>
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>설정 저장</DialogTitle>
            <DialogDescription>현재 편집 설정을 저장합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>프리셋 이름</Label>
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="예: 2월 바탕화면"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>취소</Button>
            <Button onClick={handleSavePreset}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
