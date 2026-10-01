'use client'

import { useRef } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FILE_INPUT_ACCEPT } from '@/lib/toolbox/common/constants'
import {
  BACKGROUND_FITS,
  BG_COLOR_PRESETS,
  type BackgroundKind,
  type BackgroundSettings,
} from '@/lib/toolbox/background-editor/compose'

const pressed = 'border-[var(--penta-indigo)] text-[var(--penta-indigo)]'

const KINDS: { value: BackgroundKind; label: string }[] = [
  { value: 'transparent', label: '투명' },
  { value: 'color', label: '단색' },
  { value: 'image', label: '이미지' },
]

interface BgBackgroundSectionProps {
  idPrefix: string
  /** 배경을 제거한 결과가 있을 때만 바꿀 수 있다 */
  enabled: boolean
  background: BackgroundSettings
  onChange: (patch: Partial<BackgroundSettings>) => void
  /** 배경 이미지 파일 선택 — 검증·디코딩은 페이지가 한다 */
  onPickImage: (file: File) => void
}

/** 「배경」 — 투명 / 단색(프리셋·직접 선택) / 이미지(불러오기·꽉 채우기·맞추기) */
export function BgBackgroundSection({ idPrefix, enabled, background, onChange, onPickImage }: BgBackgroundSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const fit = BACKGROUND_FITS.find((f) => f.value === background.fit) ?? BACKGROUND_FITS[0]

  return (
    <section className="space-y-4" data-testid="bg-background-section">
      <h3 className="text-sm font-semibold">배경</h3>
      {!enabled ? (
        <p className="text-sm text-muted-foreground">배경을 제거하면 배경을 투명·단색·이미지로 바꿀 수 있습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="배경 종류">
            {KINDS.map((k) => (
              <Button
                key={k.value}
                type="button"
                variant="outline"
                role="radio"
                aria-checked={background.kind === k.value}
                className={cn('h-9', background.kind === k.value && pressed)}
                onClick={() => onChange({ kind: k.value })}
              >
                {k.label}
              </Button>
            ))}
          </div>

          {background.kind === 'color' && (
            <div className="space-y-2">
              <Label>색상</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {BG_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`배경 색상 ${color}`}
                    aria-pressed={background.color === color}
                    onClick={() => onChange({ color })}
                    className={cn(
                      'h-6 w-6 rounded-full border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      background.color === color && 'ring-2 ring-[var(--penta-indigo)] ring-offset-1'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  aria-label="배경 색상 직접 선택"
                  className="h-6 w-8 cursor-pointer rounded border bg-transparent p-0"
                  value={background.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                />
                <span className="ml-1 text-xs tabular-nums text-muted-foreground">{background.color.toUpperCase()}</span>
              </div>
            </div>
          )}

          {background.kind === 'image' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {background.image ? '다른 배경 이미지 불러오기' : '배경 이미지 불러오기'}
                </Button>
                {background.image ? (
                  <p className="break-all text-xs text-muted-foreground">
                    {background.imageName} · {background.image.width} × {background.image.height}px
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">배경으로 쓸 이미지를 고르세요. 고르기 전에는 투명으로 보입니다.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>배치</Label>
                <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="배경 이미지 배치">
                  {BACKGROUND_FITS.map((f) => (
                    <Button
                      key={f.value}
                      type="button"
                      variant="outline"
                      role="radio"
                      aria-checked={background.fit === f.value}
                      className={cn('h-9', background.fit === f.value && pressed)}
                      onClick={() => onChange({ fit: f.value })}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{fit.hint}</p>
              </div>
              <input
                ref={fileRef}
                id={`${idPrefix}-bg-image`}
                type="file"
                accept={FILE_INPUT_ACCEPT}
                className="hidden"
                data-testid="bg-background-file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) onPickImage(file)
                }}
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}
