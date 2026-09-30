/**
 * 이미지 분할「이미지 크기」(분할 전 전체 리사이즈) 순수 로직 — docs/TOOLBOX_image-splitter_handoff.md §1 D1·§2
 * - 적용할 때마다 항상 원본에서 다시 리사이즈한다(누적 리사이즈 화질 저하 방지). 「원본 크기」 = 되돌리기
 * - 결과 크기 상한은 이미지 편집과 같다(validateOutputSize: 한 변 16,384px · 약 1,670만 px)
 */

import { validateOutputSize, type Size } from '../common/canvas'

export interface SizePreset {
  scale: number
  label: string
}

export const SIZE_PRESETS: SizePreset[] = [
  { scale: 1, label: '원본 크기' },
  { scale: 2, label: '2배' },
  { scale: 3, label: '3배' },
]

export function scaledSize(original: Size, scale: number): Size {
  return { width: Math.round(original.width * scale), height: Math.round(original.height * scale) }
}

/** 프리셋을 쓸 수 없으면 사유(버튼 비활성·안내용), 쓸 수 있으면 null */
export function presetError(original: Size, scale: number): string | null {
  return validateOutputSize(scaledSize(original, scale))
}

/** 현재 크기가 어떤 프리셋과 같은지(선택 표시용). 없으면 null */
export function matchingPreset(original: Size, current: Size): SizePreset | null {
  return (
    SIZE_PRESETS.find((p) => {
      const s = scaledSize(original, p.scale)
      return s.width === current.width && s.height === current.height
    }) ?? null
  )
}

/** 입력 텍스트 → 정수 px (비었거나 숫자가 아니면 NaN) */
export function parsePx(text: string): number {
  const trimmed = text.trim()
  if (trimmed === '' || !/^\d+$/.test(trimmed)) return NaN
  return Number(trimmed)
}
