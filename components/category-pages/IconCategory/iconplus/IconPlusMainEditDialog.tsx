'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { applyCornerCutToSvg, buildCutMaskId } from '@/lib/svg/corner-cut'
import {
  clampToExtendedRange,
  formatCoordinate,
  readViewBoxRect,
  STAGE_PADDING_RATIO,
} from './anchor-utils'
import {
  CUT_POSITION_LABELS,
  CUT_POSITION_ORDER,
  type IconPlusCutPosition,
  type IconPlusResource,
} from './types'

interface IconPlusMainEditDialogProps {
  /** 편집 대상 MAIN 리소스 (null이면 닫힘) */
  resource: IconPlusResource | null
  /** 참조 오버레이용 병합 리소스 목록(워크스페이스 state 재사용 — 추가 fetch 없음) */
  mergeResources?: IconPlusResource[]
  onClose: () => void
  onSuccess: () => void
}

/** 편집 중인 프리셋 값(저장 전 draft). null이면 해당 위치는 미설정 */
type PresetDraft = {
  cutX: number
  cutY: number
  cutRadius: number
  anchorX: number
  anchorY: number
}

type DraftMap = Record<IconPlusCutPosition, PresetDraft | null>

/** 편집 대상. 같은 스테이지에서 포인터를 공유하므로 모드로 분리한다(서로 겹칠 수 있음) */
type EditTarget = 'cut' | 'anchor'

const EMPTY_DRAFTS: DraftMap = { TOP_RIGHT: null, BOTTOM_RIGHT: null }

/** 지름 슬라이더 범위(짧은 변 대비 %) — 반경으로는 5~50% */
const MIN_DIAMETER_PERCENT = 10
const MAX_DIAMETER_PERCENT = 100

/** 위치별 신규 프리셋 기본값. 앵커는 원 좌상단에 맞춘다. */
function createDefaultDraft(
  position: IconPlusCutPosition,
  rect: { minX: number; minY: number; width: number; height: number }
): PresetDraft {
  const cutRadius = Math.min(rect.width, rect.height) * 0.22
  const cutX = rect.minX + rect.width * 0.85
  const cutY = position === 'TOP_RIGHT' ? rect.minY + rect.height * 0.15 : rect.minY + rect.height * 0.85
  return { cutX, cutY, cutRadius, anchorX: cutX - cutRadius, anchorY: cutY - cutRadius }
}

/**
 * MAIN 아이콘 마스킹 프리셋 편집 다이얼로그. 관리자 전용.
 * (기존 `IconPlusAnchorDialog`를 개명·확장 — anchor 한 쌍 → 위치별 (절단 원 + 앵커) 프리셋)
 *
 * - 상단 탭으로 **우측 상단 / 우측 하단** 두 프리셋을 전환하며 편집하고, 두 draft를 로컬 state에
 *   함께 보관한다(탭을 옮겨도 저장 전 편집값 유지). **저장은 PATCH 1회로 전체 교체**한다.
 * - 스테이지는 아이콘 주위에 25% 여백 프레임을 두어 원·앵커를 아이콘 **밖으로도** 끌어낼 수 있다.
 *   우측 상단 프리셋은 `anchorY`가 음수가 되는 것이 정상이다.
 * - 저장된 `svgContent`는 서버(process-svg)에서 sanitize된 값이라 `dangerouslySetInnerHTML`로 렌더한다.
 *
 * @see docs/ICON_PLUS_절단마스킹_구현계획.md §7.2
 */
export function IconPlusMainEditDialog({
  resource,
  mergeResources = [],
  onClose,
  onSuccess,
}: IconPlusMainEditDialogProps) {
  const open = resource !== null
  const frameRef = useRef<HTMLDivElement>(null)

  const [drafts, setDrafts] = useState<DraftMap>(EMPTY_DRAFTS)
  const [activePosition, setActivePosition] = useState<IconPlusCutPosition>('BOTTOM_RIGHT')
  const [editTarget, setEditTarget] = useState<EditTarget>('cut')
  const [referenceId, setReferenceId] = useState<string>('')
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 아이콘 좌표계(원본 viewBox). anchor·cut 값은 이 좌표계 기준으로 저장된다.
  const rect = useMemo(
    () =>
      resource
        ? readViewBoxRect(resource.viewBox, { width: resource.width, height: resource.height })
        : null,
    [resource]
  )

  // 대상이 바뀌면 저장된 프리셋으로 draft를 초기화한다
  useEffect(() => {
    if (!resource) return

    const next: DraftMap = { ...EMPTY_DRAFTS }
    for (const preset of resource.presets ?? []) {
      next[preset.position] = {
        cutX: preset.cutX,
        cutY: preset.cutY,
        cutRadius: preset.cutRadius,
        anchorX: preset.anchorX,
        anchorY: preset.anchorY,
      }
    }
    setDrafts(next)
    // 열 때 활성 탭: 설정된 프리셋 중 우측 하단 → 우측 상단 → (둘 다 없으면) 우측 하단의 '추가' 상태
    setActivePosition(next.BOTTOM_RIGHT ? 'BOTTOM_RIGHT' : next.TOP_RIGHT ? 'TOP_RIGHT' : 'BOTTOM_RIGHT')
    setEditTarget('cut')
    setErrorMessage(null)
    setDragging(false)
  }, [resource])

  const activeDraft = drafts[activePosition]
  const inactivePosition: IconPlusCutPosition =
    activePosition === 'TOP_RIGHT' ? 'BOTTOM_RIGHT' : 'TOP_RIGHT'
  const inactiveDraft = drafts[inactivePosition]

  const updateActiveDraft = useCallback(
    (patch: Partial<PresetDraft>) => {
      setDrafts((current) => {
        const draft = current[activePosition]
        if (!draft) return current
        return { ...current, [activePosition]: { ...draft, ...patch } }
      })
      setErrorMessage(null)
    },
    [activePosition]
  )

  /** 스테이지(여백 프레임) 좌표 → 아이콘 viewBox 좌표 */
  const toIconCoordinate = (event: PointerEvent<HTMLDivElement>) => {
    if (!rect || !frameRef.current) return null
    const frame = frameRef.current.getBoundingClientRect()
    if (frame.width === 0 || frame.height === 0) return null

    const span = 1 + STAGE_PADDING_RATIO * 2
    const rawX = rect.minX - rect.width * STAGE_PADDING_RATIO + ((event.clientX - frame.left) / frame.width) * rect.width * span
    const rawY = rect.minY - rect.height * STAGE_PADDING_RATIO + ((event.clientY - frame.top) / frame.height) * rect.height * span

    return {
      x: clampToExtendedRange(rawX, rect.minX, rect.width),
      y: clampToExtendedRange(rawY, rect.minY, rect.height),
    }
  }

  const applyPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!activeDraft) return
    const point = toIconCoordinate(event)
    if (!point) return

    const x = Number(formatCoordinate(point.x))
    const y = Number(formatCoordinate(point.y))
    updateActiveDraft(editTarget === 'cut' ? { cutX: x, cutY: y } : { anchorX: x, anchorY: y })
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!activeDraft) return
    applyPointer(event)
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) applyPointer(event)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleAddPreset = () => {
    if (!rect) return
    setDrafts((current) => ({ ...current, [activePosition]: createDefaultDraft(activePosition, rect) }))
    setEditTarget('cut')
    setErrorMessage(null)
  }

  const handleRemovePreset = () => {
    setDrafts((current) => ({ ...current, [activePosition]: null }))
    setErrorMessage(null)
  }

  const handleAlignAnchorToCircle = () => {
    if (!activeDraft) return
    updateActiveDraft({
      anchorX: Number(formatCoordinate(activeDraft.cutX - activeDraft.cutRadius)),
      anchorY: Number(formatCoordinate(activeDraft.cutY - activeDraft.cutRadius)),
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resource) return
    setErrorMessage(null)

    const presets = CUT_POSITION_ORDER.flatMap((position) => {
      const draft = drafts[position]
      return draft ? [{ position, ...draft }] : []
    })

    if (presets.some((preset) => preset.cutRadius <= 0)) {
      setErrorMessage('절단 원 지름은 0보다 커야 합니다.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/icon-plus/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // 전체 교체: 배열에서 빠진 위치는 서버에서 삭제된다(= 초기화)
        body: JSON.stringify({ presets }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setErrorMessage(data?.error ?? '마스킹 프리셋 저장에 실패했습니다.')
        return
      }
      onSuccess()
      onClose()
    } catch {
      setErrorMessage('마스킹 프리셋 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // --- 스테이지 표시 계산 (여백 프레임 기준 %) ---
  const span = 1 + STAGE_PADDING_RATIO * 2
  const toPercentX = (value: number) =>
    rect ? ((value - (rect.minX - rect.width * STAGE_PADDING_RATIO)) / (rect.width * span)) * 100 : 0
  const toPercentY = (value: number) =>
    rect ? ((value - (rect.minY - rect.height * STAGE_PADDING_RATIO)) / (rect.height * span)) * 100 : 0
  const toPercentW = (value: number) => (rect ? (value / (rect.width * span)) * 100 : 0)
  const toPercentH = (value: number) => (rect ? (value / (rect.height * span)) * 100 : 0)

  // 현재 탭 프리셋의 마스킹을 실시간 적용한 미리보기
  const maskedSvg = useMemo(() => {
    if (!resource) return ''
    if (!activeDraft) return resource.svgContent
    return applyCornerCutToSvg(
      resource.svgContent,
      { cutX: activeDraft.cutX, cutY: activeDraft.cutY, cutRadius: activeDraft.cutRadius },
      buildCutMaskId(resource.id, `${activePosition}-edit`)
    )
  }, [resource, activeDraft, activePosition])

  const shortSide = rect ? Math.min(rect.width, rect.height) : 0
  const diameterPercent =
    activeDraft && shortSide > 0
      ? Math.round(Math.min(Math.max(((activeDraft.cutRadius * 2) / shortSide) * 100, MIN_DIAMETER_PERCENT), MAX_DIAMETER_PERCENT))
      : MIN_DIAMETER_PERCENT

  const referenceResource = mergeResources.find((item) => item.id === referenceId) ?? null
  const isLegacyAnchorOnly =
    resource !== null &&
    (resource.presets ?? []).length === 0 &&
    resource.anchorX !== null &&
    resource.anchorY !== null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>마스킹 프리셋 편집</DialogTitle>
          <DialogDescription>
            {resource?.name} 아이콘의 절단 원과 병합 앵커를 위치별로 설정합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 프리셋 탭 */}
          <div className="flex items-center gap-2" role="tablist" aria-label="마스킹 프리셋 위치">
            {CUT_POSITION_ORDER.map((position) => (
              <Button
                key={position}
                type="button"
                role="tab"
                aria-selected={activePosition === position}
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 flex-1 text-xs',
                  activePosition === position
                    ? 'border-none bg-penta-sky/20 hover:bg-penta-sky/20 dark:bg-gray-50 dark:text-black'
                    : 'border bg-white dark:bg-penta-sky/20 dark:text-white'
                )}
                onClick={() => setActivePosition(position)}
              >
                {CUT_POSITION_LABELS[position]}
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {drafts[position] ? '설정됨' : '미설정'}
                </span>
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            {/* 좌측 스테이지 — 25% 여백 프레임 + 아이콘 bbox 점선 */}
            <div className="flex items-center justify-center rounded-lg border border-border bg-muted p-4">
              {rect && (
                <div
                  ref={frameRef}
                  role="presentation"
                  className="relative w-full max-w-sm touch-none select-none"
                  style={{
                    aspectRatio: `${rect.width * span} / ${rect.height * span}`,
                    cursor: !activeDraft ? 'not-allowed' : dragging ? 'grabbing' : 'crosshair',
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {/* 아이콘 bbox (여백 프레임 안쪽) */}
                  <div
                    className="pointer-events-none absolute border border-dashed border-border"
                    style={{
                      left: `${(STAGE_PADDING_RATIO / span) * 100}%`,
                      top: `${(STAGE_PADDING_RATIO / span) * 100}%`,
                      width: `${(1 / span) * 100}%`,
                      height: `${(1 / span) * 100}%`,
                    }}
                  >
                    <span
                      className="svg-line-preview flex h-full w-full items-center justify-center text-foreground [&_svg]:h-full [&_svg]:w-full"
                      // svgContent는 저장 시 서버에서 sanitize됨 (lib/svg/process-svg.ts)
                      dangerouslySetInnerHTML={{ __html: maskedSvg }}
                    />
                  </div>

                  {/* 참조 오버레이 — 앵커 위치에 native 크기·반투명으로 겹쳐 원 지름과의 정합을 확인 */}
                  {activeDraft && referenceResource && (
                    <span
                      aria-hidden="true"
                      className="svg-line-preview pointer-events-none absolute text-primary opacity-40 [&_svg]:h-full [&_svg]:w-full"
                      style={{
                        left: `${toPercentX(activeDraft.anchorX)}%`,
                        top: `${toPercentY(activeDraft.anchorY)}%`,
                        width: `${toPercentW(referenceResource.width)}%`,
                        height: `${toPercentH(referenceResource.height)}%`,
                      }}
                      dangerouslySetInnerHTML={{ __html: referenceResource.svgContent }}
                    />
                  )}

                  {/* 비활성 프리셋 — 비교용 연회색 점선 원(조작 대상 아님) */}
                  {inactiveDraft && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute rounded-full border border-dashed border-neutral-400/70"
                      style={{
                        left: `${toPercentX(inactiveDraft.cutX - inactiveDraft.cutRadius)}%`,
                        top: `${toPercentY(inactiveDraft.cutY - inactiveDraft.cutRadius)}%`,
                        width: `${toPercentW(inactiveDraft.cutRadius * 2)}%`,
                        height: `${toPercentH(inactiveDraft.cutRadius * 2)}%`,
                      }}
                    />
                  )}

                  {/* 절단 원 오버레이(빨간 실선 — 편집 표시용, 저장 결과에는 포함되지 않음) */}
                  {activeDraft && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute rounded-full border-2 border-red-500',
                        editTarget === 'cut' ? 'opacity-100' : 'opacity-60'
                      )}
                      style={{
                        left: `${toPercentX(activeDraft.cutX - activeDraft.cutRadius)}%`,
                        top: `${toPercentY(activeDraft.cutY - activeDraft.cutRadius)}%`,
                        width: `${toPercentW(activeDraft.cutRadius * 2)}%`,
                        height: `${toPercentH(activeDraft.cutRadius * 2)}%`,
                      }}
                    />
                  )}

                  {/* 앵커 십자선 마커 */}
                  {activeDraft && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow before:absolute before:left-1/2 before:top-[-10px] before:h-8 before:w-px before:-translate-x-1/2 before:bg-primary after:absolute after:left-[-10px] after:top-1/2 after:h-px after:w-8 after:-translate-y-1/2 after:bg-primary',
                        editTarget === 'anchor' ? 'opacity-100' : 'opacity-50'
                      )}
                      style={{
                        left: `${toPercentX(activeDraft.anchorX)}%`,
                        top: `${toPercentY(activeDraft.anchorY)}%`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* 우측 컨트롤 */}
            <div className="space-y-3">
              {!activeDraft ? (
                <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                  <p className="text-xs leading-4 text-muted-foreground">
                    {CUT_POSITION_LABELS[activePosition]} 프리셋이 없습니다. 추가하면 기본 원과 앵커가
                    생성됩니다.
                  </p>
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleAddPreset}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    프리셋 추가
                  </Button>
                </div>
              ) : (
                <>
                  {/* 편집 대상 모드 토글 — 원과 앵커가 겹칠 수 있어 포인터 대상을 분리한다 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">편집 대상</Label>
                    <div className="flex items-center gap-2" role="group" aria-label="편집 대상">
                      {(
                        [
                          { value: 'cut', label: '절단 원 지정' },
                          { value: 'anchor', label: '앵커 지정' },
                        ] as const
                      ).map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-pressed={editTarget === option.value}
                          className={cn(
                            'h-8 flex-1 text-xs',
                            editTarget === option.value
                              ? 'border-none bg-penta-sky/20 hover:bg-penta-sky/20 dark:bg-gray-50 dark:text-black'
                              : 'border bg-white dark:bg-penta-sky/20 dark:text-white'
                          )}
                          onClick={() => setEditTarget(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 지름 슬라이더 — 짧은 변의 10~100%, 저장은 반경 절대값 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">지름</Label>
                      <span className="text-xs text-muted-foreground">
                        {diameterPercent}% ({formatCoordinate(activeDraft.cutRadius * 2)})
                      </span>
                    </div>
                    <Slider
                      value={[diameterPercent]}
                      onValueChange={(value) =>
                        updateActiveDraft({ cutRadius: (shortSide * (value[0] / 100)) / 2 })
                      }
                      min={MIN_DIAMETER_PERCENT}
                      max={MAX_DIAMETER_PERCENT}
                      step={1}
                      variant="small"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <CoordinateInput
                      id="icon-plus-cut-x"
                      label="cutX"
                      value={activeDraft.cutX}
                      onChange={(value) => updateActiveDraft({ cutX: value })}
                    />
                    <CoordinateInput
                      id="icon-plus-cut-y"
                      label="cutY"
                      value={activeDraft.cutY}
                      onChange={(value) => updateActiveDraft({ cutY: value })}
                    />
                    <CoordinateInput
                      id="icon-plus-anchor-x"
                      label="anchorX"
                      value={activeDraft.anchorX}
                      onChange={(value) => updateActiveDraft({ anchorX: value })}
                    />
                    <CoordinateInput
                      id="icon-plus-anchor-y"
                      label="anchorY"
                      value={activeDraft.anchorY}
                      onChange={(value) => updateActiveDraft({ anchorY: value })}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleAlignAnchorToCircle}
                  >
                    앵커를 원 좌상단에 맞추기
                  </Button>

                  {/* 참조 오버레이 선택 — 목록은 워크스페이스 state 재사용 */}
                  {mergeResources.length > 0 && (
                    <div className="space-y-1">
                      <Label htmlFor="icon-plus-reference" className="text-xs text-muted-foreground">
                        참조 리소스(겹쳐 보기)
                      </Label>
                      <select
                        id="icon-plus-reference"
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        value={referenceId}
                        onChange={(event) => setReferenceId(event.target.value)}
                      >
                        <option value="">표시하지 않음</option>
                        {mergeResources.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-destructive hover:text-destructive"
                    onClick={handleRemovePreset}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    이 프리셋 삭제(초기화)
                  </Button>

                  <p className="text-xs leading-4 text-muted-foreground">
                    스테이지를 클릭·드래그해 {editTarget === 'cut' ? '절단 원' : '앵커'}을 옮깁니다.
                    아이콘 밖(여백)으로도 끌어낼 수 있어 <strong>우측 상단은 anchorY가 음수</strong>가 되는
                    것이 정상입니다.
                  </p>
                </>
              )}
            </div>
          </div>

          {isLegacyAnchorOnly && (
            <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              이 아이콘은 기존 방식(잘린 SVG + anchor 좌표)으로 동작 중입니다. 프리셋을 추가하고 저장하면
              프리셋 방식으로 전환됩니다.
            </p>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 좌표 수치 입력. 스테이지 드래그와 **양방향 동기화**한다.
 * 입력 중 문자열(`-`, `1.`)이 유효 숫자로 반올림되며 지워지지 않도록 로컬 텍스트를 유지하고,
 * 외부 값이 실제로 달라졌을 때만 표시를 갱신한다. 음수를 허용하므로 `min` 속성을 두지 않는다.
 */
function CoordinateInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(() => formatCoordinate(value))
  const textRef = useRef(text)

  const setBoth = (next: string) => {
    textRef.current = next
    setText(next)
  }

  // 드래그 등 외부 변경 반영. 입력 중인 문자열이 같은 값을 뜻하면 건드리지 않는다.
  useEffect(() => {
    const parsed = Number(textRef.current)
    if (textRef.current === '' || !Number.isFinite(parsed) || parsed !== value) {
      setBoth(formatCoordinate(value))
    }
  }, [value])

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        step="0.5"
        className="h-8"
        value={text}
        onChange={(event) => {
          const raw = event.target.value
          setBoth(raw)
          const parsed = Number(raw)
          if (raw !== '' && Number.isFinite(parsed)) onChange(parsed)
        }}
      />
    </div>
  )
}
