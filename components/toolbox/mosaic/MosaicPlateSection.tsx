'use client'

import { Car, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PLATE_MARGIN_MAX, PLATE_MARGIN_MIN, type PlateSettings } from '@/lib/toolbox/mosaic/plate'
import { NumberField } from './MosaicNumberField'

export interface MosaicPlateSectionProps {
  idPrefix: string
  settings: PlateSettings
  /** 감지 진행 상태 — busy면 버튼이 「취소」가 된다. progress는 0~1(모델 준비 중이면 null) */
  busy: boolean
  progress: number | null
  /** 다른 감지(얼굴)가 진행 중이면 시작할 수 없다 */
  disabled: boolean
  onDetect: () => void
  onCancel: () => void
  onPreciseChange: (precise: boolean) => void
  onMarginChange: (margin: number) => void
}

/**
 * 번호판 자동 감지 — 차량 번호판을 찾아 영역으로 추가한다(이미지는 서버로 전송되지 않고 브라우저에서 처리).
 * 감지된 번호판은 사각형 영역이고 패턴·강도는 지금 새 영역 기본값을 따른다.
 */
export function MosaicPlateSection({ idPrefix, settings, busy, progress, disabled, onDetect, onCancel, onPreciseChange, onMarginChange }: MosaicPlateSectionProps) {
  const label = busy ? (progress === null ? '모델 준비 중… · 취소' : `감지 중… ${Math.round(progress * 100)}% · 취소`) : '번호판 자동 감지'
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">번호판 자동 감지</h3>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={busy ? onCancel : onDetect}
        disabled={!busy && disabled}
        data-testid="mosaic-plate-detect"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Car className="mr-2 h-4 w-4" />}
        {label}
      </Button>
      <div className="flex items-center justify-between gap-3">
        <Label>작은 번호판까지 정밀 감지</Label>
        <Switch aria-label="작은 번호판까지 정밀 감지" checked={settings.precise} onCheckedChange={onPreciseChange} />
      </div>
      <p className="text-xs font-medium text-foreground/80" data-testid="mosaic-plate-precise-hint">
        {settings.precise
          ? '켜 두면 먼 번호판까지 더 찾지만 3~4배 오래 걸리고 오탐이 늘 수 있어요(긴 변 1280px 이하 이미지).'
          : '꺼 두면 빠르지만 먼 번호판·작은 번호판을 놓칠 수 있어요. 먼 번호판까지 꼼꼼히 가리려면 켜 주세요(긴 변 1280px 이하 이미지).'}
      </p>
      <NumberField
        id={`${idPrefix}-plate-margin`}
        label={`번호판 여백 · % (${PLATE_MARGIN_MIN}~${PLATE_MARGIN_MAX})`}
        value={settings.margin}
        disabled={false}
        onCommit={onMarginChange}
      />
      <p className="text-xs text-muted-foreground">
        자동 감지는 번호판을 놓치거나 번호판이 아닌 곳(간판·표지판 등)을 잡을 수 있어요. 결과를 직접 확인하고 필요한 영역을 추가·삭제하세요. 감지된 번호판은 사각형 영역으로 추가됩니다.
      </p>
    </section>
  )
}
