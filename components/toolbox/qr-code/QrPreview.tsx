'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createCheckerPattern } from '@/lib/toolbox/common/canvas'
import type { QrMatrix } from '@/lib/toolbox/qr-code/matrix'
import { PREVIEW_MIN_MODULE_PX, PREVIEW_TARGET_PX } from '@/lib/toolbox/qr-code/options'
import { computeLayout, drawQr, previewSize, type QrLogo, type QrPaint } from '@/lib/toolbox/qr-code/render'

interface QrPreviewProps {
  matrix: QrMatrix
  margin: number
  paint: QrPaint
  logo: QrLogo | null
  /** 스크린리더용 설명(내용 요약) */
  label?: string
}

/**
 * QR 미리보기 — 저장과 같은 그리기 함수(`drawQr`)를 쓰되 크기만 화면용(모듈 정수 배)이다.
 * CSS로 영역에 맞춰 줄이며 `pixelated`로 모듈 가장자리를 선명하게 유지한다.
 * 투명 배경이면 캔버스 뒤에 체크무늬를 깔아 투명 영역을 보여 준다(캔버스 픽셀 자체는 투명).
 */
export function QrPreview({ matrix, margin, paint, logo, label }: QrPreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const checker = useMemo(() => createCheckerPattern().toDataURL(), [])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const size = previewSize(matrix.size, margin, PREVIEW_TARGET_PX, PREVIEW_MIN_MODULE_PX)
    const layout = computeLayout(matrix.size, size, margin)
    if (layout) drawQr(canvas, matrix, layout, size, paint, logo)
  }, [matrix, margin, paint, logo])

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label ?? '생성된 QR 코드 미리보기'}
      data-transparent={paint.bg === null ? 'true' : 'false'}
      className="max-h-full max-w-full rounded-sm shadow-sm"
      style={{
        imageRendering: 'pixelated',
        aspectRatio: '1 / 1',
        ...(paint.bg === null ? { backgroundImage: `url(${checker})`, backgroundSize: '16px 16px' } : null),
      }}
    />
  )
}
