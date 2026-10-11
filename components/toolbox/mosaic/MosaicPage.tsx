'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/common/constants'
import { createCanvas } from '@/lib/toolbox/common/canvas'
import {
  DEFAULT_EXPORT_QUALITY,
  baseNameOf,
  downloadBlob,
  encodeCanvas,
  getExportFormat,
  sanitizeFileName,
  type ExportFormat,
} from '@/lib/toolbox/common/export'
import { ImageLoadError, decodeImageFile, getImageFileFromClipboard, validateImageFile } from '@/lib/toolbox/common/load'
import { renderWatermarked } from '@/lib/toolbox/common/watermark-render'
import { renderMosaicInto, updateMosaicInto } from '@/lib/toolbox/mosaic/compose'
import { dropOverlapping, faceRegionRect } from '@/lib/toolbox/mosaic/face'
import { DetectionError } from '@/lib/toolbox/mosaic/detection-engine'
import { createRegion, fullRect, normalizeRect, nudgeRect, sameRect, setRectField, type RectField } from '@/lib/toolbox/mosaic/regions'
import {
  DEFAULT_REGION_SETTINGS,
  clampStrength,
  type Rect,
  type Region,
  type RegionSettings,
} from '@/lib/toolbox/mosaic/types'
import { ImageUploadZone } from '@/components/toolbox/common/ImageUploadZone'
import { useWatermark } from '@/components/toolbox/common/use-watermark'
import { MosaicCanvas } from './MosaicCanvas'
import { MosaicSidePanel, type MosaicImageInfo, type MosaicScope } from './MosaicSidePanel'
import { MosaicShortcutDialog } from './MosaicShortcutDialog'
import { MosaicToolbar, type MosaicViewMode } from './MosaicToolbar'
import { useFaceDetection } from './use-face-detection'
import { usePlateDetection } from './use-plate-detection'
import { useMosaicRegions } from './use-mosaic-regions'

interface LoadedImage extends MosaicImageInfo {
  /** 불러온 원본(EXIF 보정 후) — 불변. 모든 영역 효과는 항상 여기서 계산한다 */
  original: HTMLCanvasElement
  /** 모자이크 결과 캔버스(원본과 같은 크기, 재사용) */
  result: HTMLCanvasElement
}

/** 결과를 만들거나 저장하는 중 캔버스를 만들지 못했을 때 — 모바일 Safari 등 캔버스 메모리 한도가 작은 환경 */
const MEMORY_ERROR = '메모리가 부족해 결과를 만들지 못했습니다. 되돌리기로 이전 상태로 돌아가거나 영역을 줄이거나 더 작은 이미지로 시도해 주세요.'

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** 다이얼로그·Sheet·열린 선택 목록 안에서는 편집 단축키를 쓰지 않음 */
const inOverlay = (target: EventTarget | null) =>
  target instanceof HTMLElement && !!target.closest('[role=dialog],[role=listbox],[role=option]')

/** 슬라이더·라디오·셀렉트 버튼은 방향키를 스스로 쓴다 — 방향키 이동만 양보하고, 되돌리기·삭제 등은 그대로 동작한다 */
const usesArrowKeys = (target: EventTarget | null) =>
  target instanceof HTMLElement && !!target.closest('[role=slider],[role=radio],[role=combobox]')

/**
 * TOOLBOX「이미지 모자이크」 — 모든 처리는 브라우저에서만 수행(서버 전송 없음).
 * 레이아웃: 좌측 작업 영역 + 우측 410px 속성 패널(xl 이상), xl 미만은 「편집 옵션」 Sheet(모바일 하단 / 태블릿 오른쪽) — 이미지 분할과 동일.
 * 사이드바 메뉴: 개발 중에는 노출하지 않는다(P6에서 TOOLBOX_MENU에 등록).
 * 구현 기록: docs/TOOLBOX_mosaic_handoff.md
 */
export function MosaicPage() {
  const isMobileViewport = useIsMobileViewport()
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const [image, setImage] = useState<LoadedImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { regions, canUndo, canRedo, commit, live, liveGrouped, endLive, undo, redo, reset } = useMosaicRegions()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<MosaicViewMode>('result')
  const [showOutlines, setShowOutlines] = useState(true)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  // 워터마크 — 히스토리 밖 설정값(실행취소 대상 아님). 텍스트 설정은 localStorage에 저장 — 이미지 편집과 공용(use-watermark.ts)
  const { settings: watermark, logo: watermarkLogo, change: changeWatermark, openLogo: openWatermarkLogo, removeLogo: removeWatermarkLogo, active: watermarkActive } = useWatermark()
  const canSave = regions.length > 0 || watermarkActive
  const coarse = useMediaQuery('(pointer: coarse)')
  // 터치 기기 화면 이동 모드 — 켜면 한 손가락 끌기가 화면 이동(꺼 두면 영역 그리기). 두 손가락 이동·확대/축소는 항상 가능
  const [panMode, setPanMode] = useState(false)
  // 얼굴 자동 감지 — 모델은 처음 감지할 때 내려받는다(0.23MB, 같은 출처). 설정(자동 적용·여백)은 localStorage에 저장
  const face = useFaceDetection()
  const cancelFaces = face.cancel
  // 번호판 자동 감지 — 모델(7.5MB)은 처음 감지할 때 내려받는다(같은 출처, 브라우저 캐시). 설정(여백·정밀 감지)은 localStorage에 저장
  const plate = usePlateDetection()
  const cancelPlates = plate.cancel
  const [defaults, setDefaults] = useState<RegionSettings>(DEFAULT_REGION_SETTINGS)
  const [baseName, setBaseName] = useState('')
  const [saving, setSaving] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState(DEFAULT_EXPORT_QUALITY)

  useEffect(() => {
    if (!isCompactViewport) setSheetOpen(false)
  }, [isCompactViewport])

  // 결과 = 원본 위에 영역 효과를 얹은 것. 영역이 바뀔 때마다 같은 결과 캔버스에 다시 그리고,
  // regions 객체를 stamp로 넘겨 캔버스가 다시 그려지게 한다.
  // 캔버스를 만들지 못하면(모바일 Safari 등 메모리 한도가 작은 환경) 페이지가 멈추지 않게 잡고, 저장을 막은 채 안내한다.
  // 결과 캔버스가 반쯤 그려진 상태일 수 있으므로 되돌리기·영역 수정으로 다시 그려질 때까지 저장하지 않는다.
  const renderFailed = useRef(false)
  /** 결과 캔버스에 마지막으로 그려 둔 영역 목록 — 다음 변경이 작으면 바뀐 부분만 다시 그린다(updateMosaicInto) */
  const rendered = useRef<{ image: LoadedImage; regions: readonly Region[] } | null>(null)
  const resultStamp = useMemo(() => {
    if (image) {
      try {
        const last = rendered.current
        const incremental =
          last !== null && last.image === image && updateMosaicInto(image.result, image.original, last.regions, regions)
        if (!incremental) renderMosaicInto(image.result, image.original, regions)
        rendered.current = { image, regions }
        renderFailed.current = false
      } catch (e) {
        rendered.current = null // 캔버스가 반쯤 그려졌을 수 있으니 다음에는 전체를 다시 그린다
        renderFailed.current = true
        console.error('[mosaic] 결과를 그리지 못했습니다:', e)
      }
    }
    return regions
  }, [image, regions])
  useEffect(() => {
    if (renderFailed.current) toast.error(MEMORY_ERROR)
  }, [resultStamp])

  /** 「이미지 전체」 모드면 이미지 전체 크기 영역 하나(whole)가 영역 목록에 들어 있다 */
  const whole = useMemo(() => regions.find((r) => r.whole) ?? null, [regions])
  const scope: MosaicScope = whole ? 'whole' : 'regions'
  const selected = useMemo(() => (whole ? null : (regions.find((r) => r.id === selectedId) ?? null)), [regions, selectedId, whole])
  /** 속성 컨트롤이 바꾸는 설정: 이미지 전체 → 전체 영역 / 영역 지정 → 선택 영역, 없으면 새 영역 기본값 */
  const active: RegionSettings = whole ?? selected ?? defaults
  const activeTarget: 'whole' | 'selected' | 'defaults' = whole ? 'whole' : selected ? 'selected' : 'defaults'
  const imageWidth = image?.width
  const imageHeight = image?.height
  const imageSize = useMemo(() => (imageWidth && imageHeight ? { width: imageWidth, height: imageHeight } : null), [imageWidth, imageHeight])

  // 영역이 있으면 페이지 이탈 경고(배경 편집 수동 보정과 동일)
  useEffect(() => {
    if (regions.length === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [regions.length])

  const openFile = useCallback(async (file: File) => {
    const error = validateImageFile(file)
    if (error) {
      toast.error(error)
      return
    }
    setLoading(true)
    try {
      cancelFaces() // 진행 중인 얼굴·번호판 감지는 이전 이미지 기준이므로 버린다
      cancelPlates()
      const original = await decodeImageFile(file)
      const { canvas: result } = createCanvas(original.width, original.height)
      const fileName = file.name || 'image.png'
      setImage({ original, result, width: original.width, height: original.height, fileName, fileSize: file.size })
      setBaseName(`${baseNameOf(fileName)}_mosaic`)
      // 영역·선택은 버리고, 새 영역 기본값·저장 형식은 유지한다
      reset()
      setSelectedId(null)
      setMode('result')
    } catch (e) {
      toast.error(e instanceof ImageLoadError ? e.message : '이미지를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [reset, cancelFaces, cancelPlates])

  // 클립보드 붙여넣기 (이미지가 있을 때만 가로챔 — 입력창 텍스트 붙여넣기는 그대로)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = getImageFileFromClipboard(e.clipboardData)
      if (!file) return
      e.preventDefault()
      void openFile(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [openFile])

  // 드래그 앤 드롭 — preventDefault로 브라우저가 파일을 새 탭에서 여는 기본 동작 차단
  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current += 1
      setDragActive(true)
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) setDragActive(false)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current = 0
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file && !loading) void openFile(file)
    },
  }

  const browse = () => fileInputRef.current?.click()

  /** 새 영역을 만들어 선택한다 — 「결과」 보기·윤곽 표시로 돌려놓는다(윤곽이 안 보이는 상태로 영역을 만들면 혼란스럽다) */
  const addRegion = useCallback(
    (rect: Rect) => {
      const region = createRegion(rect, defaults)
      commit((prev) => [...prev, region])
      setSelectedId(region.id)
      setMode('result')
      setShowOutlines(true)
    },
    [commit, defaults]
  )

  /**
   * 얼굴 자동 감지 — 찾은 얼굴마다 영역(얼굴 여백 적용)을 추가한다. 현재 새 영역 기본값의 모양·패턴·강도를 따르고,
   * 이미 있는 영역과 많이 겹치는 얼굴은 건너뛴다. 「이미지 전체」였다면 전체 영역은 지워진다. 추가는 되돌리기 1단계다.
   */
  const latestFace = useRef({ image, regions, defaults, margin: face.settings.margin, busy: face.busy || plate.busy })
  latestFace.current = { image, regions, defaults, margin: face.settings.margin, busy: face.busy || plate.busy }
  const faceDetect = face.detect
  const detectFaces = useCallback(async () => {
    const { image: target, busy } = latestFace.current
    if (!target || busy) return
    try {
      const boxes = await faceDetect(target.original)
      // 취소됐거나 그 사이 다른 이미지를 열었으면 버린다
      if (!boxes || latestFace.current.image?.original !== target.original) return
      const size = { width: target.width, height: target.height }
      const { margin, defaults: settings, regions: current } = latestFace.current
      const rects = boxes.map((b) => faceRegionRect(b, margin, size))
      if (rects.length === 0) {
        toast.info('감지된 얼굴이 없습니다. 영역을 직접 지정해 주세요.')
        return
      }
      const fresh = dropOverlapping(rects, current.filter((r) => !r.whole))
      if (fresh.length === 0) {
        toast.info('감지된 얼굴이 모두 이미 영역으로 지정되어 있습니다.')
        return
      }
      const added = fresh.map((rect) => createRegion(rect, settings))
      commit((prev) => [...prev.filter((r) => !r.whole), ...added])
      setSelectedId(null)
      setMode('result')
      setShowOutlines(true)
      toast.success(`얼굴 ${added.length}개를 영역으로 추가했습니다. 놓친 얼굴이 없는지 확인해 주세요.`)
    } catch (e) {
      toast.error(e instanceof DetectionError ? e.message : '얼굴 감지 중 오류가 발생했습니다.')
    }
  }, [faceDetect, commit])

  /**
   * 번호판 자동 감지 — 찾은 번호판마다 **사각형** 영역(번호판 여백 적용)을 추가한다. 패턴·강도는 현재 새 영역 기본값을 따른다.
   * 이미 있는 영역과 많이 겹치는 번호판은 건너뛰고, 「이미지 전체」였다면 전체 영역은 지워진다. 추가는 되돌리기 1단계다.
   */
  const latestPlate = useRef({ margin: plate.settings.margin })
  latestPlate.current = { margin: plate.settings.margin }
  const plateDetect = plate.detect
  const detectPlates = useCallback(async () => {
    const { image: target, busy } = latestFace.current
    if (!target || busy) return
    try {
      const boxes = await plateDetect(target.original)
      if (!boxes || latestFace.current.image?.original !== target.original) return
      const size = { width: target.width, height: target.height }
      const { defaults: settings, regions: current } = latestFace.current
      const rects = boxes.map((b) => faceRegionRect(b, latestPlate.current.margin, size))
      if (rects.length === 0) {
        toast.info('감지된 번호판이 없습니다. 영역을 직접 지정해 주세요.')
        return
      }
      const fresh = dropOverlapping(rects, current.filter((r) => !r.whole))
      if (fresh.length === 0) {
        toast.info('감지된 번호판이 모두 이미 영역으로 지정되어 있습니다.')
        return
      }
      const added = fresh.map((rect) => createRegion(rect, { ...settings, shape: 'rect' }))
      commit((prev) => [...prev.filter((r) => !r.whole), ...added])
      setSelectedId(null)
      setMode('result')
      setShowOutlines(true)
      toast.success(`번호판 ${added.length}개를 영역으로 추가했습니다. 놓친 번호판이 없는지 확인해 주세요.`)
    } catch (e) {
      toast.error(e instanceof DetectionError ? e.message : '번호판 감지 중 오류가 발생했습니다.')
    }
  }, [plateDetect, commit])

  // 「불러올 때 얼굴 자동 적용」 — 새 이미지가 표시되면 감지한다(켜는 순간에는 이미 열려 있는 이미지를 감지하지 않는다)
  const autoFaceRef = useRef(face.settings.auto)
  autoFaceRef.current = face.settings.auto
  const loadedOriginal = image?.original
  useEffect(() => {
    if (loadedOriginal && autoFaceRef.current) void detectFaces()
  }, [loadedOriginal, detectFaces])

  /**
   * 영역 작업 전환.
   * - 이미지 전체: 지정해 둔 영역을 지우고 이미지 전체 크기 영역 하나로 바꾼다(새 영역 기본값을 따름). 되돌리기로 복구할 수 있다.
   * - 같은 항목을 다시 누르면 「결과」 보기·윤곽 표시로 돌아온다.
   * - 영역 지정: 전체 영역을 지우고 빈 상태로 시작하며, 전체에서 조절한 패턴·강도는 새 영역 기본값으로 이어받는다.
   */
  const chooseScope = (next: MosaicScope) => {
    if (!imageSize) return
    // 같은 항목을 다시 누르면 「결과」 보기·윤곽 표시로 돌아온다(원본·비교 보기나 윤곽을 숨긴 상태에서 편집으로 복귀)
    setMode('result')
    setShowOutlines(true)
    if (next === scope) return
    setSelectedId(null)
    if (next === 'whole') {
      const discarded = regions.length
      commit(() => [createRegion(fullRect(imageSize), { ...defaults, shape: 'rect' }, true)])
      if (discarded > 0) {
        toast(`지정한 영역 ${discarded}개를 지우고 이미지 전체에 적용했습니다.`, {
          action: { label: '되돌리기', onClick: undo },
        })
      }
    } else {
      if (whole) setDefaults((prev) => ({ ...prev, pattern: whole.pattern, strength: whole.strength }))
      commit(() => [])
    }
  }

  const chooseMode = (next: MosaicViewMode) => {
    setMode(next)
    if (next !== 'result') setSelectedId(null)
  }

  /** 캔버스 이동·크기 조절 중 실시간 갱신 — 바뀐 게 없으면 같은 배열을 반환해 다시 그리지 않는다(기록은 endLive에서 1단계) */
  const changeRegionRect = useCallback(
    (id: string, rect: Rect) => {
      live((prev) => {
        const target = prev.find((r) => r.id === id)
        if (!target || sameRect(target, rect)) return prev
        return prev.map((r) => (r.id === id ? { ...r, ...rect } : r))
      })
    },
    [live]
  )

  const changeRectField = (field: RectField, value: number) => {
    if (!selected || !imageSize) return
    const rect = normalizeRect(setRectField(selected, field, value, imageSize), imageSize)
    commit((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...rect } : r)))
  }

  /**
   * 선택 영역이 있으면 그 영역을, 없으면 새 영역 기본값을 바꾼다.
   * 강도(슬라이더)는 연속 변경이라 끝날 때(onSettingsCommit) 1단계로 기록하고, 패턴·모양은 즉시 1단계다.
   */
  const changeSettings = (patch: Partial<RegionSettings>) => {
    const next = patch.strength === undefined ? patch : { ...patch, strength: clampStrength(patch.strength) }
    const targetId = whole?.id ?? selectedId
    if (targetId) {
      const update = (prev: Region[]) => prev.map((r) => (r.id === targetId ? { ...r, ...next } : r))
      if (patch.strength !== undefined) live(update)
      else commit(update)
    } else {
      setDefaults((prev) => ({ ...prev, ...next }))
    }
  }

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    commit((prev) => prev.filter((r) => r.id !== selectedId))
    setSelectedId(null)
  }, [commit, selectedId])

  const clearAll = () => {
    commit(() => [])
    setSelectedId(null)
  }

  /** 영역 추가 — 이미지 가운데에 짧은 변의 25% 크기 영역을 만든다(끌기 없이 키보드·터치로 영역을 만드는 방법) */
  const addDefaultRegion = useCallback(() => {
    if (!imageSize) return
    const side = Math.min(imageSize.width, imageSize.height)
    const w = Math.max(1, Math.round(side * 0.25))
    const rect = normalizeRect(
      { x: (imageSize.width - w) / 2, y: (imageSize.height - w) / 2, width: w, height: w },
      imageSize
    )
    addRegion(rect)
  }, [imageSize, addRegion])

  /** 영역 선택 이동 — 키보드로 영역을 고를 수 있게 한다(생성 순서대로 앞/뒤) */
  const stepSelection = useCallback(
    (direction: 1 | -1) => {
      const list = regions.filter((r) => !r.whole)
      if (list.length === 0) return
      const index = list.findIndex((r) => r.id === selectedId)
      const next = index === -1 ? (direction === 1 ? 0 : list.length - 1) : (index + direction + list.length) % list.length
      setSelectedId(list[next].id)
      setMode('result')
      setShowOutlines(true)
    },
    [regions, selectedId]
  )

  // ---------- 단축키: 되돌리기·다시 실행·삭제·선택 해제·방향키 이동 ----------
  const latestKeys = useRef({ imageSize, selected, mode, showOutlines })
  latestKeys.current = { imageSize, selected, mode, showOutlines }
  useEffect(() => {
    if (!image) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || isTypingTarget(e.target) || inOverlay(e.target)) return
      const key = e.key.toLowerCase()
      const mod = e.ctrlKey || e.metaKey
      if (mod && !e.altKey && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (e.ctrlKey && !e.altKey && !e.shiftKey && key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (mod || e.altKey) return
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen(true)
        return
      }
      const { imageSize: size, selected: sel, mode: m, showOutlines: outlines } = latestKeys.current
      if (key === 'escape') {
        setSelectedId(null)
        return
      }
      // 영역 고르기: [ 이전, ] 다음
      if (e.key === '[' || e.key === ']') {
        e.preventDefault()
        stepSelection(e.key === ']' ? 1 : -1)
        return
      }
      // 편집은 「결과」 보기에서 윤곽을 표시할 때만
      if (!sel || !size || m !== 'result' || !outlines) return
      if (key === 'delete' || key === 'backspace') {
        e.preventDefault()
        deleteSelected()
        return
      }
      if (usesArrowKeys(e.target)) return
      const step = e.shiftKey ? 10 : 1
      const delta: Record<string, [number, number]> = {
        arrowleft: [-step, 0],
        arrowright: [step, 0],
        arrowup: [0, -step],
        arrowdown: [0, step],
      }
      const d = delta[key]
      if (!d) return
      e.preventDefault()
      liveGrouped((prev) =>
        prev.map((r) => {
          if (r.id !== sel.id) return r
          const moved = nudgeRect(r, d[0], d[1], size)
          return sameRect(r, moved) ? r : { ...r, ...moved }
        })
      )
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [image, undo, redo, deleteSelected, liveGrouped, stepSelection])

  const save = async () => {
    if (!image || !canSave) return
    if (renderFailed.current) {
      toast.error(MEMORY_ERROR)
      return
    }
    setSaving(true)
    try {
      // 모자이크 결과 → 워터마크(원본 해상도) 순서로 합성한다. 워터마크가 꺼져 있으면 결과를 그대로 쓴다
      const blob = await encodeCanvas(renderWatermarked(image.result, watermark, watermarkLogo), format, quality)
      downloadBlob(blob, `${sanitizeFileName(baseName)}.${getExportFormat(format).ext}`)
      toast.success('모자이크 이미지를 저장했습니다.')
    } catch (e) {
      // 캔버스 생성 실패(RangeError 등)는 메모리 부족 안내, 그 밖(형식 미지원 등)은 원래 메시지
      toast.error(e instanceof RangeError ? MEMORY_ERROR : e instanceof Error ? e.message : '저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const panelProps = {
    image,
    regionCount: regions.length,
    canSave,
    selected,
    active,
    activeTarget,
    scope,
    baseName,
    format,
    quality,
    saving,
    onScopeChange: chooseScope,
    onRectFieldChange: changeRectField,
    onSettingsChange: changeSettings,
    onSettingsCommit: endLive,
    onFormatChange: setFormat,
    onQualityChange: setQuality,
    onBaseNameChange: setBaseName,
    onSave: save,
    face: {
      settings: face.settings,
      busy: face.busy,
      progress: face.progress,
      onDetect: () => void detectFaces(),
      onCancel: face.cancel,
      onAutoChange: face.setAuto,
      onMarginChange: face.setMargin,
    },
    plate: {
      settings: plate.settings,
      busy: plate.busy,
      progress: plate.progress,
      disabled: face.busy,
      onDetect: () => void detectPlates(),
      onCancel: plate.cancel,
      onPreciseChange: plate.setPrecise,
      onMarginChange: plate.setMargin,
    },
    watermark,
    watermarkLogo,
    onWatermarkChange: changeWatermark,
    onWatermarkLogoFile: (file: File) => void openWatermarkLogo(file),
    onWatermarkLogoRemove: removeWatermarkLogo,
  }

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50" {...dropHandlers}>
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        <div className="flex h-full flex-col px-8 pt-16 pb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="page-header-title">이미지 모자이크</h1>
              <p className="text-muted-foreground mt-2">
                가리고 싶은 영역을 지정해 모자이크를 적용하세요. 이미지는 서버로 전송되지 않고 브라우저에서 처리됩니다.
              </p>
            </div>
            {image && (
              <Button type="button" variant="outline" className="shrink-0 xl:hidden" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                편집 옵션
              </Button>
            )}
          </div>

          {image ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <MosaicToolbar
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                shape={active.shape}
                pattern={active.pattern}
                shapeDisabled={Boolean(whole)}
                onShapeChange={(shape) => changeSettings({ shape })}
                onPatternChange={(pattern) => changeSettings({ pattern })}
                faceBusy={face.busy}
                onDetectFaces={() => void detectFaces()}
                plateBusy={plate.busy}
                onDetectPlates={() => void detectPlates()}
                mode={mode}
                onModeChange={chooseMode}
                showOutlines={showOutlines}
                outlinesDisabled={Boolean(whole) || mode !== 'result'}
                onShowOutlinesChange={setShowOutlines}
                canAddRegion={!whole}
                onAddRegion={addDefaultRegion}
                showPanToggle={coarse}
                panMode={panMode}
                onPanModeChange={setPanMode}
                canDeleteSelected={Boolean(selected)}
                canClearAll={regions.length > 0 && !whole}
                onDeleteSelected={deleteSelected}
                onClearAll={clearAll}
                onOpenNew={browse}
                openNewDisabled={loading || saving}
                onShowShortcuts={() => setShortcutsOpen(true)}
              />
              <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-lg border bg-neutral-100">
                <MosaicCanvas
                  original={image.original}
                  result={image.result}
                  resultStamp={resultStamp}
                  width={image.width}
                  height={image.height}
                  fitKey={image.original}
                  regions={regions}
                  selectedId={selectedId}
                  whole={Boolean(whole)}
                  mode={mode}
                  showOutlines={showOutlines}
                  panMode={panMode}
                  drawShape={defaults.shape}
                  watermark={watermarkActive ? { settings: watermark, logo: watermarkLogo } : undefined}
                  onSelect={setSelectedId}
                  onRegionChange={changeRegionRect}
                  onChangeEnd={endLive}
                  onCreate={addRegion}
                />
                {dragActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
                    여기에 놓으면 새 이미지로 교체됩니다
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground" aria-live="polite">
                {whole
                  ? '이미지 전체에 모자이크가 적용됩니다.'
                  : regions.length === 0
                    ? '이미지의 빈 곳을 끌어 가릴 영역을 지정하세요. 영역 윤곽은 저장되지 않습니다.'
                    : `영역 ${regions.length}개 · 영역 윤곽은 저장되지 않습니다.`}
              </p>
            </div>
          ) : (
            <ImageUploadZone dragActive={dragActive} disabled={loading} onBrowse={browse} className="min-h-[320px] flex-1" />
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 xl:right-[410px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="hidden xl:block fixed right-0 top-0 bottom-0">
        <MosaicSidePanel {...panelProps} />
      </div>

      <Sheet open={Boolean(isCompactViewport && sheetOpen)} onOpenChange={setSheetOpen}>
        <SheetContent
          side={isMobileViewport ? 'bottom' : 'right'}
          className={isMobileViewport ? 'h-[70vh] overflow-y-auto p-0' : 'w-[410px] max-w-[90vw] overflow-y-auto p-0 sm:max-w-[410px]'}
        >
          <SheetTitle className="sr-only">편집 옵션</SheetTitle>
          <MosaicSidePanel variant="sheet" {...panelProps} />
        </SheetContent>
      </Sheet>

      <MosaicShortcutDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // 같은 파일을 다시 선택해도 change가 발생하도록
          if (file) void openFile(file)
        }}
      />
    </div>
  )
}
