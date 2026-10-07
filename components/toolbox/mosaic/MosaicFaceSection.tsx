'use client'

import { Loader2, ScanFace } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FACE_MARGIN_MAX, FACE_MARGIN_MIN, type FaceSettings } from '@/lib/toolbox/mosaic/face'
import { NumberField } from './MosaicNumberField'

export interface MosaicFaceSectionProps {
  idPrefix: string
  settings: FaceSettings
  /** 감지 진행 상태 — busy면 버튼이 「취소」가 된다. progress는 0~1(모델 준비 중이면 null) */
  busy: boolean
  progress: number | null
  onDetect: () => void
  onCancel: () => void
  onAutoChange: (auto: boolean) => void
  onMarginChange: (margin: number) => void
}

/**
 * 얼굴 자동 감지 — 사진 속 얼굴을 찾아 영역으로 추가한다(이미지는 서버로 전송되지 않고 브라우저에서 처리).
 * 감지된 얼굴은 지금 새 영역 기본값(모양·패턴·강도)으로 만들어진다.
 */
export function MosaicFaceSection({ idPrefix, settings, busy, progress, onDetect, onCancel, onAutoChange, onMarginChange }: MosaicFaceSectionProps) {
  const label = busy ? (progress === null ? '모델 준비 중… · 취소' : `감지 중… ${Math.round(progress * 100)}% · 취소`) : '얼굴 자동 감지'
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">얼굴 자동 감지</h3>
      <Button type="button" variant="outline" className="w-full" onClick={busy ? onCancel : onDetect} data-testid="mosaic-face-detect">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanFace className="mr-2 h-4 w-4" />}
        {label}
      </Button>
      <div className="flex items-center justify-between gap-3">
        <Label>불러올 때 얼굴 자동 적용</Label>
        <Switch aria-label="불러올 때 얼굴 자동 적용" checked={settings.auto} onCheckedChange={onAutoChange} />
      </div>
      <NumberField
        id={`${idPrefix}-face-margin`}
        label={`얼굴 여백 · % (${FACE_MARGIN_MIN}~${FACE_MARGIN_MAX})`}
        value={settings.margin}
        disabled={false}
        onCommit={onMarginChange}
      />
      <p className="text-xs text-muted-foreground">
        자동 감지는 얼굴을 놓치거나 얼굴이 아닌 곳을 잡을 수 있어요. 결과를 직접 확인하고 필요한 영역을 추가·삭제하세요. 감지된 얼굴은 지금 선택한 모양·패턴·강도의 영역으로 추가됩니다(얼굴에는 「타원/원」이 어울려요).
      </p>
    </section>
  )
}
