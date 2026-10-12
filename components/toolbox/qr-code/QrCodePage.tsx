'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { downloadBlob, encodeCanvas, DEFAULT_EXPORT_QUALITY } from '@/lib/toolbox/common/export'
import type { WatermarkLogo } from '@/lib/toolbox/common/watermark'
import { loadWatermarkLogo } from '@/lib/toolbox/common/watermark-logo'
import { scanWarnings } from '@/lib/toolbox/qr-code/contrast'
import { createSvgLogo } from '@/lib/toolbox/qr-code/logo-image'
import { buildQrMatrix } from '@/lib/toolbox/qr-code/matrix'
import {
  DEFAULT_LOGO_PERCENT,
  DEFAULT_QR_SETTINGS,
  getQrFormat,
  LOGO_EC_LEVEL,
  LOGO_MIN_VERSION,
  normalizeQrText,
  qrFileName,
  QR_DEFAULTS,
  type QrFormat,
  type QrSettings,
} from '@/lib/toolbox/qr-code/options'
import { computeLayout, qrOutputSizeError, renderQrCanvas, type QrLogo } from '@/lib/toolbox/qr-code/render'
import { renderQrSvg } from '@/lib/toolbox/qr-code/svg'
import { QrContentSection } from './QrContentSection'
import { QrPreview } from './QrPreview'
import { QrSidePanel } from './QrSidePanel'
import { QrWarnings } from './QrWarnings'

/**
 * TOOLBOX「QR 코드 생성」 — 브라우저에서만 처리(서버 전송·저장 없음, DB 없음).
 * 레이아웃: 좌측 실시간 미리보기 + 우측 410px 옵션 패널(xl 이상), xl 미만은 「QR 옵션」 Sheet(모바일 하단 / 태블릿 오른쪽) — 이미지 편집과 동일.
 * 사이드바 메뉴: lib/toolbox/menu.ts의 TOOLBOX_MENU(P5에서 등록).
 * 1280px 미만에서는 내용 입력·스캔 안내·저장 버튼을 본문에 둔다(옵션 Sheet에 입력이 가려지지 않도록).
 * 구현 기록: docs/TOOLBOX_qr-code_handoff.md
 */
export function QrCodePage() {
  const isMobileViewport = useIsMobileViewport()
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [text, setText] = useState('')
  const [baseName, setBaseName] = useState('')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<QrSettings>(DEFAULT_QR_SETTINGS)
  const [format, setFormat] = useState<QrFormat>('png')
  const [logo, setLogo] = useState<WatermarkLogo | null>(null)
  const [logoPercent, setLogoPercent] = useState(DEFAULT_LOGO_PERCENT)
  const logoToken = useRef(0)
  const [sizeText, setSizeText] = useState(String(QR_DEFAULTS.size))

  // 입력 중에도 타이핑이 끊기지 않도록 QR 생성은 지연된 값으로 한다
  const deferredText = useDeferredValue(text)
  const hasLogo = logo !== null
  // 실제 적용 오류 정정(로고가 있으면 H로 고정)
  const ecLevel = hasLogo ? LOGO_EC_LEVEL : settings.ecLevel
  const result = useMemo(() => {
    const value = normalizeQrText(deferredText)
    // 로고가 있으면 오류 정정을 H로 고정하고 최소 버전을 올린다(로고가 가리는 점 복원)
    return value ? (hasLogo ? buildQrMatrix(value, LOGO_EC_LEVEL, LOGO_MIN_VERSION) : buildQrMatrix(value, settings.ecLevel)) : null
  }, [deferredText, settings.ecLevel, hasLogo])
  const matrix = result?.ok ? result.matrix : null
  const stale = text !== deferredText
  const qrLogo = useMemo<QrLogo | null>(() => (logo ? { source: logo.canvas, percent: logoPercent } : null), [logo, logoPercent])

  const paint = useMemo(
    () => ({ fg: settings.fg, bg: settings.bgTransparent ? null : settings.bg }),
    [settings.fg, settings.bg, settings.bgTransparent]
  )
  const size = sizeText.trim() === '' ? NaN : Number(sizeText)
  const sizeError = matrix ? qrOutputSizeError(format, matrix.size, size, settings.margin) : null
  // 점 1칸 px 안내·경고는 래스터(PNG)에만 해당한다. SVG는 벡터라 크기와 무관하다.
  const moduleSize =
    matrix && !sizeError && format === 'png' ? (computeLayout(matrix.size, size, settings.margin)?.moduleSize ?? null) : null
  const warnings = useMemo(
    () => scanWarnings({ fg: settings.fg, bg: settings.bg, bgTransparent: settings.bgTransparent, margin: settings.margin, moduleSize, hasLogo }),
    [settings.fg, settings.bg, settings.bgTransparent, settings.margin, moduleSize, hasLogo]
  )

  const openLogo = useCallback(async (file: File) => {
    const token = ++logoToken.current
    try {
      const next = await loadWatermarkLogo(file)
      if (token === logoToken.current) setLogo(next)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '로고 이미지를 불러오지 못했습니다.')
    }
  }, [])
  const removeLogo = useCallback(() => {
    logoToken.current++ // 불러오는 중이던 로고도 무시
    setLogo(null)
  }, [])

  const canSave = matrix !== null && !stale && !sizeError && !saving
  const previewLabel = matrix
    ? `${normalizeQrText(deferredText).slice(0, 60)}${normalizeQrText(deferredText).length > 60 ? '…' : ''} 내용을 담은 QR 코드 (버전 ${matrix.version})`
    : undefined

  const changeSettings = useCallback((patch: Partial<QrSettings>) => setSettings((prev) => ({ ...prev, ...patch })), [])

  const save = useCallback(async () => {
    if (!matrix || saving || sizeError) return
    setSaving(true)
    try {
      let blob: Blob
      if (format === 'svg') {
        blob = new Blob([renderQrSvg(matrix, size, settings.margin, paint, logo ? createSvgLogo(logo.canvas, logoPercent) : null)], { type: getQrFormat('svg').mime })
      } else {
        blob = await encodeCanvas(renderQrCanvas(matrix, size, settings.margin, paint, qrLogo), 'png', DEFAULT_EXPORT_QUALITY)
      }
      downloadBlob(blob, qrFileName(baseName, format))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'QR 코드를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }, [matrix, saving, sizeError, size, format, settings.margin, paint, baseName, logo, logoPercent, qrLogo])

  const panelProps = {
    text,
    settings,
    format,
    logo,
    logoPercent,
    sizeText,
    sizeError,
    warnings,
    baseName,
    info: matrix && !stale ? { version: matrix.version, moduleSize } : null,
    saving,
    onTextChange: setText,
    onSettingsChange: changeSettings,
    onLogoFile: openLogo,
    onLogoRemove: removeLogo,
    onLogoPercentChange: setLogoPercent,
    onFormatChange: setFormat,
    onSizeTextChange: setSizeText,
    onBaseNameChange: setBaseName,
    onSave: save,
  }

  useEffect(() => {
    if (!isCompactViewport) setSheetOpen(false)
  }, [isCompactViewport])

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50">
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 pt-16 pb-8 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="page-header-title">QR 코드 생성</h1>
              <p className="text-muted-foreground mt-2">
                URL이나 텍스트로 QR 코드를 만들어 PNG·SVG로 저장하세요. 입력한 내용은 서버로 전송되지 않습니다.
              </p>
            </div>
            <div className="flex shrink-0 gap-2 xl:hidden">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                QR 옵션
              </Button>
              <Button type="button" onClick={save} disabled={!canSave}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {getQrFormat(format).ext.toUpperCase()}로 저장
              </Button>
            </div>
          </div>

          {/* 1280px 미만: 내용 입력을 본문에 둬 Sheet에 가리지 않고 미리보기를 보며 입력한다 */}
          {isCompactViewport && (
            <div className="rounded-lg border bg-card p-4">
              <QrContentSection idPrefix="main" text={text} ecLevel={ecLevel} rows={3} onTextChange={setText} />
            </div>
          )}

          <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-lg border bg-neutral-100" aria-live="polite">
            <div className="absolute inset-4 flex items-center justify-center text-center text-sm text-muted-foreground sm:inset-6">
              {matrix ? (
                <QrPreview matrix={matrix} margin={settings.margin} paint={paint} logo={qrLogo} label={previewLabel} />
              ) : result && !result.ok ? (
                <p className="max-w-sm text-destructive">{result.error}</p>
              ) : (
                <p>{isCompactViewport ? '위 입력창에' : '오른쪽에'} URL이나 텍스트를 입력하면 QR 코드가 표시됩니다.</p>
              )}
            </div>
          </div>

          {/* 1280px 미만: 옵션이 Sheet 안에 있어 스캔 안내를 본문에서도 보여 준다 */}
          {isCompactViewport && warnings.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <QrWarnings warnings={warnings} />
            </div>
          )}
        </div>
      </div>

      {/* 1280px 미만에서는 패널을 렌더하지 않는다(숨겨진 중복 입력창·안내가 DOM에 남지 않도록) */}
      {!isCompactViewport && (
        <div className="fixed right-0 top-0 bottom-0">
          <QrSidePanel {...panelProps} />
        </div>
      )}

      <Sheet open={Boolean(isCompactViewport && sheetOpen)} onOpenChange={setSheetOpen}>
        <SheetContent
          side={isMobileViewport ? 'bottom' : 'right'}
          className={isMobileViewport ? 'h-[70vh] overflow-y-auto p-0' : 'w-[410px] max-w-[90vw] overflow-y-auto p-0 sm:max-w-[410px]'}
        >
          <SheetTitle className="sr-only">QR 옵션</SheetTitle>
          <QrSidePanel variant="sheet" {...panelProps} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
