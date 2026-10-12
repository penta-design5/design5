/** 색 대비·스캔 신뢰성 점검 (순수 모듈). 구현 기록: docs/TOOLBOX_qr-code_handoff.md */

export const HEX_COLOR = /^#[0-9a-f]{6}$/i

/** `#rrggbb` → [r, g, b] (잘못된 값은 null) */
export function parseHex(hex: string): [number, number, number] | null {
  if (!HEX_COLOR.test(hex)) return null
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

/** WCAG 상대 휘도(0~1) */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 대비비(1~21) */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** 이 값보다 대비가 낮으면 스캔이 어려울 수 있다고 안내 */
export const MIN_SAFE_CONTRAST = 3
/** 이 값보다 여백이 좁으면 인식이 어려울 수 있다고 안내(QR 규격 권장은 4칸) */
export const MIN_SAFE_MARGIN = 2
/** 저장 크기에서 모듈 한 칸이 이 px보다 작으면 인식이 어려울 수 있다고 안내 */
export const MIN_SAFE_MODULE_PX = 3

export interface ScanWarning {
  key: 'inverted' | 'contrast' | 'transparent' | 'margin' | 'module' | 'logo'
  message: string
}

export interface ScanCheckInput {
  fg: string
  bg: string
  bgTransparent: boolean
  margin: number
  /** 저장 크기에서 모듈 한 칸의 px(알 수 없으면 null) */
  moduleSize: number | null
  /** 중앙 로고 사용 여부 */
  hasLogo?: boolean
}

/** 못 읽는 QR을 만들지 않도록 위험 요소를 모은다. 저장은 막지 않고 안내만 한다. */
export function scanWarnings({ fg, bg, bgTransparent, margin, moduleSize, hasLogo = false }: ScanCheckInput): ScanWarning[] {
  const out: ScanWarning[] = []

  if (bgTransparent) {
    out.push({
      key: 'transparent',
      message: '투명 배경은 올려 두는 바탕색에 따라 스캔이 안 될 수 있습니다. 밝은 바탕 위에서 사용하세요.',
    })
  } else {
    if (relativeLuminance(fg) > relativeLuminance(bg)) {
      out.push({
        key: 'inverted',
        message: '점이 배경보다 밝아(반전) 일부 스캐너·카메라 앱이 읽지 못할 수 있습니다. 어두운 점 + 밝은 배경을 권장합니다.',
      })
    } else if (contrastRatio(fg, bg) < MIN_SAFE_CONTRAST) {
      out.push({
        key: 'contrast',
        message: `점과 배경의 색 대비가 낮아(${contrastRatio(fg, bg).toFixed(1)}:1) 스캔이 어려울 수 있습니다. ${MIN_SAFE_CONTRAST}:1 이상을 권장합니다.`,
      })
    }
    // 반전이면서 대비도 낮은 경우는 위에서 하나만 안내한다
  }

  if (margin < MIN_SAFE_MARGIN) {
    out.push({
      key: 'margin',
      message: `여백이 좁으면 인식이 어려울 수 있습니다. ${MIN_SAFE_MARGIN}칸 이상(규격 권장 4칸)을 권장합니다.`,
    })
  }

  if (moduleSize !== null && moduleSize < MIN_SAFE_MODULE_PX) {
    out.push({
      key: 'module',
      message: `저장 크기에 비해 점이 너무 작습니다(점 1칸 ${moduleSize}px). 크기를 키우거나 내용을 줄이세요.`,
    })
  }

  if (hasLogo) {
    out.push({
      key: 'logo',
      message: '로고가 점 일부를 가리므로, 저장한 QR을 사용하기 전에 스마트폰 카메라로 꼭 스캔해 확인하세요.',
    })
  }

  return out
}
