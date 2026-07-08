'use client'

import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { mergeSvgsByAnchor, type MergedSvgResult } from '@/lib/svg/merge-svg'
import { applyIconPlusProperties, type ResourceKind } from '@/lib/svg/icon-plus-properties'
import {
  createDownloadBlob,
  createMergedFilename,
  downloadBlob,
  type DownloadFormat,
} from '@/lib/svg/icon-plus-download'
import type { IconPlusResource } from './types'

interface IconPlusPropertyPanelProps {
  selectedMain: IconPlusResource | null
  selectedResource: IconPlusResource | null
  /**
   * 렌더 위치.
   * - `sidebar`(기본): 데스크톱 우측 고정 패널(화면 전체 높이).
   * - `sheet`: 모바일 우측 슬라이딩 시트 내부(부모 Sheet가 위치/애니메이션 담당).
   */
  variant?: 'sidebar' | 'sheet'
}

/** 문서 기준 색상 10종(§7). 흰색(#FFFFFF)은 별도 처리(다운로드 포맷/카드 배경). */
const COLOR_OPTIONS = [
  '#0060A9',
  '#302BCF',
  '#0C73EF',
  '#2DA6FA',
  '#5DD6D5',
  '#DD524C',
  '#FECC09',
  '#999B9E',
  '#000000',
  '#FFFFFF',
]

const DEFAULT_COLOR = '#000000'
const DEFAULT_STROKE_WIDTH = 1
const DEFAULT_SIZE = 24
const DEFAULT_FORMAT: DownloadFormat = 'svg'

const FORMAT_OPTIONS: { label: string; value: DownloadFormat }[] = [
  { label: 'SVG', value: 'svg' },
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpg' },
]

function isWhite(color: string): boolean {
  const c = color.toLowerCase()
  return c === '#ffffff' || c === '#fff' || c === 'white'
}

function formatDimension(value: number): number {
  return Math.round(value)
}

/** IconPlusResource → mergeSvgsByAnchor 입력 형태 */
function toMergeIcon(resource: IconPlusResource) {
  return {
    svgContent: resource.svgContent,
    width: resource.width,
    height: resource.height,
  }
}

/**
 * ICON+ 속성 패널.
 *
 * Phase 5: 선택된 (메인 + 병합용 리소스) 조합을 `mergeSvgsByAnchor`로 실시간 병합해 "결과" 슬롯에 렌더.
 * Phase 6: 색상 10종 / 선 두께 / 크기 / 포맷 / 초기화 컨트롤과 SVG·PNG·JPG 다운로드.
 * - 선 두께는 라인 획([stroke]:not([fill]))에만 적용, fill 부분은 색상만 반영(선결요건 a).
 * - 결과/입력 미리보기 타일은 밝은 배경을 고정해 다크 모드에서도 가시성 확보(선결요건 b, 흰색 선택 시 결과 타일만 검정).
 * @see docs/ICON_PLUS_개발계획.md §3.3, §7
 */
export function IconPlusPropertyPanel({
  selectedMain,
  selectedResource,
  variant = 'sidebar',
}: IconPlusPropertyPanelProps) {
  const isSheet = variant === 'sheet'
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH)
  const [size, setSize] = useState(DEFAULT_SIZE)
  const [format, setFormat] = useState<DownloadFormat>(DEFAULT_FORMAT)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const whiteSelected = isWhite(color)
  const resourceKind: ResourceKind = selectedResource?.type === 'MERGE_TEXT' ? 'text' : 'icon'

  // 흰색 선택 시 JPG(불투명 흰 배경)는 의미가 없으므로 PNG로 전환
  useEffect(() => {
    if (whiteSelected && format === 'jpg') setFormat('png')
  }, [whiteSelected, format])

  // 원본 병합 결과(속성 미적용). 메인 anchor가 없으면 null.
  const merged: MergedSvgResult | null = useMemo(() => {
    if (!selectedMain || !selectedResource) return null
    return mergeSvgsByAnchor(
      { ...toMergeIcon(selectedMain), anchorX: selectedMain.anchorX, anchorY: selectedMain.anchorY },
      toMergeIcon(selectedResource)
    )
  }, [selectedMain, selectedResource])

  // 미리보기 표시 높이(px). 크기 컨트롤을 반영해 작게 시작 → 최대 64px까지 커진다(설명글과 일치).
  const previewDisplaySize = Math.min(Math.max(size * 1.5, 24), 64)

  const previewSvg = useMemo(() => {
    if (!merged) return null
    return applyIconPlusProperties(merged, {
      color,
      strokeWidth,
      outputHeight: previewDisplaySize,
      resourceKind,
      mode: 'preview',
    })
  }, [merged, color, strokeWidth, previewDisplaySize, resourceKind])

  const downloadSvg = useMemo(() => {
    if (!merged) return null
    return applyIconPlusProperties(merged, {
      color,
      strokeWidth,
      outputHeight: size,
      resourceKind,
      mode: 'download',
    })
  }, [merged, color, strokeWidth, size, resourceKind])

  const isMissingSelection = !selectedMain || !selectedResource
  const isMissingAnchor = !isMissingSelection && !merged
  const canDownload = Boolean(downloadSvg && selectedMain && selectedResource)

  const handleReset = () => {
    setColor(DEFAULT_COLOR)
    setStrokeWidth(DEFAULT_STROKE_WIDTH)
    setSize(DEFAULT_SIZE)
    setFormat(DEFAULT_FORMAT)
    setDownloadError(null)
  }

  const handleDownload = async () => {
    if (!downloadSvg || !selectedMain || !selectedResource) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const filename = createMergedFilename({
        format,
        mainName: selectedMain.name,
        resourceName: selectedResource.name,
        size,
      })
      const blob = await createDownloadBlob({
        format,
        svgContent: downloadSvg.svgContent,
        width: downloadSvg.width,
        height: downloadSvg.height,
      })
      downloadBlob(blob, filename)
    } catch {
      setDownloadError('다운로드 파일을 만드는 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    // sidebar: ICON 탭 속성 패널과 동일(화면 전체 높이 고정 + 테두리 없음, 배경색 차이로 구분)
    // sheet: 모바일 우측 슬라이딩 시트 내부 — 위치/높이는 부모 Sheet가 담당하므로 폭만 채운다
    <div
      className={cn(
        'flex flex-col gap-6 overflow-y-auto bg-background',
        isSheet
          ? 'h-full w-full px-6 pb-8 pt-6'
          : 'fixed bottom-0 right-0 top-0 h-full w-[410px] px-8 pb-8 pt-14'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">아이콘 속성</h2>
          <p className="mt-1 text-sm text-muted-foreground">색상, 선 두께, 크기를 조정할 수 있습니다.</p>
        </div>
        <Button variant="outline" size="icon" aria-label="기본값으로 초기화" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* 대표 미리보기 (메인 + 리소스 = 결과) */}
      <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
        <p className="text-sm font-medium text-foreground">대표 미리보기</p>
        {selectedMain || selectedResource ? (
          <p className="mt-1 truncate text-sm font-medium text-foreground">
            {selectedMain?.name ?? '메인 미선택'} + {selectedResource?.name ?? '리소스 미선택'}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">선택된 대표 조합 없음</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <PreviewSlot label="메인" resource={selectedMain} />
          <span className="text-muted-foreground">+</span>
          <PreviewSlot label="리소스" resource={selectedResource} />
          <span className="text-muted-foreground">=</span>
          <ResultSlot
            svg={previewSvg?.svgContent ?? null}
            displayHeight={previewDisplaySize}
            whiteSelected={whiteSelected}
          />
        </div>

        {isMissingSelection ? (
          <p className="mt-3 text-xs text-muted-foreground">
            메인 아이콘 1개와 병합용 아이콘 또는 병합용 텍스트 1개를 선택하면 병합 결과가 표시됩니다.
          </p>
        ) : isMissingAnchor ? (
          <p className="mt-3 text-xs text-destructive">
            선택한 메인 아이콘에 anchor 좌표가 없어 병합 미리보기를 만들 수 없습니다.
          </p>
        ) : downloadSvg ? (
          <p className="mt-3 text-xs text-muted-foreground">
            다운로드 크기 {formatDimension(downloadSvg.width)} x {formatDimension(downloadSvg.height)}
          </p>
        ) : null}
      </div>

      {/* 색상 10종 */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">색상</Label>
        <div className="grid w-[70%] grid-cols-5 gap-2">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`색상 선택: ${option}`}
              aria-pressed={color === option}
              className={cn(
                'box-border h-8 w-8 shrink-0 appearance-none rounded border border-solid p-0 transition-[box-shadow,border-color]',
                color === option
                  ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'border-border hover:border-primary/50'
              )}
              style={{
                backgroundColor: option,
                borderColor: isWhite(option) ? '#e5e7eb' : option,
              }}
              onClick={() => setColor(option)}
            />
          ))}
        </div>
      </div>

      {/* 선 두께 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">선 두께</Label>
          <span className="text-sm text-muted-foreground">{strokeWidth}px</span>
        </div>
        <Slider
          value={[strokeWidth]}
          onValueChange={(v) => setStrokeWidth(v[0])}
          min={0.5}
          max={3}
          step={0.5}
          variant="small"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.5px</span>
          <span>3px</span>
        </div>
      </div>

      {/* 크기 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">크기</Label>
          <span className="text-sm text-muted-foreground">{size}px</span>
        </div>
        <Slider
          value={[size]}
          onValueChange={(v) => setSize(v[0])}
          min={16}
          max={256}
          step={4}
          variant="small"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>16px</span>
          <span>256px</span>
        </div>
        <p className="text-xs text-muted-foreground">
          * 다운로드 높이 기준이며, 미리보기 표시 크기는 최대 64px입니다.
        </p>
      </div>

      {/* 다운로드 포맷 */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">FORMAT</Label>
        {/* 포맷 버튼 스타일은 ICON 탭 속성 패널(IconPropertyPanel)과 일관되게 유지 */}
        <div className="flex items-center gap-2" role="group" aria-label="다운로드 포맷">
          {FORMAT_OPTIONS.map((option) => {
            // 흰색 선택 시 JPG(불투명) 숨김
            if (option.value === 'jpg' && whiteSelected) return null
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={format === option.value}
                className={
                  format === option.value
                    ? 'text-xs dark:text-black bg-penta-sky/20 dark:bg-gray-50 hover:bg-penta-sky/20 border-none flex-1 h-8'
                    : 'text-xs bg-white dark:bg-penta-sky/20 dark:hover:bg-penta-sky/30 flex-1 h-8 dark:text-white dark:hover:text-white border'
                }
                onClick={() => {
                  setFormat(option.value)
                  setDownloadError(null)
                }}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
        <p className="text-xs font-light text-muted-foreground">
          <span className="mr-1 font-semibold">SVG</span>: 벡터
          <span className="ml-3 mr-1 font-semibold">PNG</span>: 배경투명
          {!whiteSelected && (
            <>
              <span className="ml-3 mr-1 font-semibold">JPG</span>: 배경불투명
            </>
          )}
        </p>
      </div>

      {/* 다운로드 */}
      <div className="mt-auto border-t border-border pt-6">
        {downloadError && (
          <p
            role="alert"
            className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {downloadError}
          </p>
        )}
        <Button className="w-full" disabled={!canDownload || downloading} onClick={handleDownload}>
          {downloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              다운로드 준비 중...
            </>
          ) : (
            '다운로드'
          )}
        </Button>
      </div>
    </div>
  )
}

/** 입력 미리보기 슬롯(메인/리소스). 밝은 배경 고정으로 다크 모드 가시성 확보. */
function PreviewSlot({ label, resource }: { label: string; resource: IconPlusResource | null }) {
  // MAIN·MERGE_ICON은 라인으로, 병합용 텍스트(MERGE_TEXT)는 채움 그대로 표시
  const isLine = resource ? resource.type !== 'MERGE_TEXT' : false
  return (
    <div className="flex aspect-square flex-1 items-center justify-center rounded-lg bg-white p-2">
      {resource ? (
        <span
          className={cn(
            'flex h-full w-full items-center justify-center text-neutral-900 [&_svg]:h-full [&_svg]:w-full',
            isLine && 'svg-line-preview'
          )}
          // svgContent는 업로드 시 서버에서 sanitize됨
          dangerouslySetInnerHTML={{ __html: resource.svgContent }}
        />
      ) : (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  )
}

/**
 * 결과 슬롯(병합 결과). 속성이 bake된 SVG를 크기 컨트롤에 맞춘 표시 높이(px)로 렌더한다.
 * 입력 타일과 달리 꽉 채우지 않고 `displayHeight`로 렌더 → 크기 변경이 미리보기에 보인다(최대 64px).
 * 흰색 선택 시에만 검정 배경(다크 가시성, 선결요건 b).
 */
function ResultSlot({
  svg,
  displayHeight,
  whiteSelected,
}: {
  svg: string | null
  displayHeight: number
  whiteSelected: boolean
}) {
  return (
    <div
      className={cn(
        'flex aspect-square flex-1 items-center justify-center overflow-hidden rounded-lg border border-primary p-2',
        whiteSelected ? 'bg-neutral-900' : 'bg-white'
      )}
    >
      {svg ? (
        <span
          className="flex items-center justify-center [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full"
          style={{ height: displayHeight }}
          // 병합 결과는 sanitize된 원본 + 속성 bake 결과. dangerouslySetInnerHTML 렌더(계획 §13)
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <span className="text-xs text-muted-foreground">결과</span>
      )}
    </div>
  )
}
