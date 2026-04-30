/**
 * 디자인 의뢰 에디터 툴바 프리셋 색상.
 * 값은 `app/globals.css` 의 `--penta-*-rgb`, 라이트 모드 destructive(#DD524C) 와 동기화합니다.
 */
export const DESIGN_REQUEST_COLOR_PRESETS = [
  {
    id: 'penta-indigo',
    label: 'Penta Indigo',
    hex: '#322ace',
  },
  {
    id: 'penta-blue',
    label: 'Penta Blue',
    hex: '#0c73ef',
  },
  {
    id: 'penta-sky',
    label: 'Penta Sky',
    hex: '#2da6fa',
  },
  {
    id: 'penta-green',
    label: 'Penta Green',
    hex: '#5dd6d5',
  },
  {
    id: 'penta-yellow',
    label: 'Penta Yellow',
    hex: '#fecc0a',
  },
  {
    id: 'destructive',
    label: 'Destructive',
    hex: '#dd524c',
  },
] as const

const HEX6 = /^#?([0-9a-f]{6})$/i

/** 에디터에서 읽은 color 값이 프리셋 hex와 같은지 비교 (rgb/hex 혼용 대응) */
export function designRequestColorMatchesPreset(
  editorColor: string | undefined,
  presetHex: string
): boolean {
  if (!editorColor?.trim()) return false
  const target = presetHex.toLowerCase()
  const c = editorColor.trim().toLowerCase().replace(/\s/g, '')
  if (c === target) return true
  const hexM = HEX6.exec(c)
  if (hexM && `#${hexM[1]}` === target) return true
  const rgbM = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(c)
  if (!rgbM) return false
  const toHex = (n: string) => parseInt(n, 10).toString(16).padStart(2, '0')
  const fromRgb = `#${toHex(rgbM[1])}${toHex(rgbM[2])}${toHex(rgbM[3])}`
  return fromRgb === target
}
