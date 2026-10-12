/** QR 코드 옵션·상수 (순수 모듈). 구현 기록: docs/TOOLBOX_qr-code_handoff.md */
import { sanitizeFileName } from '@/lib/toolbox/common/export'

export type EcLevel = 'L' | 'M' | 'Q' | 'H'

/** 오류 정정 수준별 바이트 모드 최대 용량(버전 40 기준, 근사값 — 안내 문구용) */
export const QR_BYTE_CAPACITY: Record<EcLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
}

/**
 * 오류 정정(훼손 복원력) 선택지. 복원율은 QR이 손상돼도 읽을 수 있는 대략적인 면적 비율이다.
 * 화면 문구는 전문 용어 대신 용도로 설명한다(사용자 결정 2026-10-12, 방안 A).
 */
export const EC_LEVEL_OPTIONS: { value: EcLevel; label: string; hint: string }[] = [
  {
    value: 'L',
    label: '낮음 (L) · 약 7% — 화면 표시용',
    hint: '깨끗한 화면에서 보여 줄 때 알맞습니다. 점이 가장 크고 내용을 가장 많이 담지만, 일부가 가려지면 읽지 못합니다.',
  },
  { value: 'M', label: '보통 (M) · 약 15% — 일반용 (기본)', hint: '대부분의 경우에 알맞은 기본값입니다.' },
  {
    value: 'Q',
    label: '높음 (Q) · 약 25% — 인쇄물·스티커',
    hint: '긁히거나 접힐 수 있는 명함·포스터·스티커에 알맞습니다. 점이 더 촘촘해집니다.',
  },
  {
    value: 'H',
    label: '최고 (H) · 약 30% — 로고·거친 환경',
    hint: '중앙에 로고를 넣거나 훼손되기 쉬운 곳에 쓸 때 알맞습니다. 점이 가장 촘촘해 작게 인쇄하면 읽기 어렵습니다.',
  },
]

/** 섹션 공통 설명 — 장단점(복원력 ↔ 점 크기·용량)을 항상 보여 준다 */
export const EC_LEVEL_GUIDE =
  'QR이 구겨지거나 가려져도 읽히도록 여분의 데이터를 넣는 정도입니다. 높일수록 훼손에 강해지지만 점이 촘촘해져 작게 인쇄하면 읽기 어렵고, 담을 수 있는 글자 수도 줄어듭니다.'

/** 로고가 있을 때 오류 정정 수준 — 로고가 가리는 점을 복원할 수 있도록 최고(H)로 고정한다 */
export const LOGO_EC_LEVEL: EcLevel = 'H'
/**
 * 로고가 있을 때 최소 QR 버전(한 변 17 + 4×버전 모듈). 짧은 내용의 작은 QR(버전 1~3)은 가운데 점이 적어
 * 로고가 가리는 비율이 너무 커지므로 더 촘촘한 버전으로 올린다.
 */
export const LOGO_MIN_VERSION = 4
/** 로고 한 변 = QR 본체(여백 제외) 한 변의 N%. */
export const LOGO_PERCENT_RANGE = { min: 10, max: 25, step: 1 } as const
export const DEFAULT_LOGO_PERCENT = 20
/** 로고 둘레에 비우는 여유(모듈 칸, 한쪽) */
export const LOGO_PAD_MODULES = 1
/**
 * 로고가 지우는 모듈 면적의 상한(전체 모듈 대비). 넘으면 로고를 자동으로 줄인다.
 * 근거(2026-10-12 실측, 오류 정정 H·jsQR): 버전 4~10에서 지움 면적이 15~22%를 넘으면 디코딩이 실패한다.
 * 10%면 모든 버전에서 실패 한계의 약 2배 이상 여유가 있고, 로고 크기는 최대 21~27%로 거의 줄지 않는다.
 * (14%는 버전 4에서 여유가 ×1.4뿐이라 인쇄·촬영 조건이 나쁘면 위험해 낮췄다.)
 */
export const LOGO_MAX_KNOCKOUT_AREA = 0.1

export const MARGIN_RANGE = { min: 0, max: 10, step: 1 } as const

/** 색상 프리셋(`#rrggbb`) — 어두운 전경 / 밝은 배경 위주(스캔 신뢰성) */
export const FG_PRESETS = ['#000000', '#1f2937', '#1e3a8a', '#4338ca', '#047857', '#b91c1c', '#7c3aed']
export const BG_PRESETS = ['#ffffff', '#f3f4f6', '#fef9c3', '#dbeafe', '#dcfce7', '#fee2e2']

export interface QrSettings {
  ecLevel: EcLevel
  /** 여백(quiet zone, 모듈 단위) */
  margin: number
  fg: string
  bg: string
  /** true면 배경을 칠하지 않는다(PNG 투명 / SVG 배경 사각형 없음) */
  bgTransparent: boolean
}

export const QR_DEFAULTS = {
  ecLevel: 'M' as EcLevel,
  /** 여백(quiet zone, 모듈 단위). QR 규격 권장값은 4 */
  margin: 4,
  fg: '#000000',
  bg: '#ffffff',
  /** 저장 크기(px, 한 변) */
  size: 1024,
  bgTransparent: false,
} as const

export const DEFAULT_QR_SETTINGS: QrSettings = {
  ecLevel: QR_DEFAULTS.ecLevel,
  margin: QR_DEFAULTS.margin,
  fg: QR_DEFAULTS.fg,
  bg: QR_DEFAULTS.bg,
  bgTransparent: QR_DEFAULTS.bgTransparent,
}

/** 화면 미리보기에서 모듈 한 칸의 최소 px(선명도) */
export const PREVIEW_MIN_MODULE_PX = 2
/** 화면 미리보기 캔버스의 목표 한 변(px) */
export const PREVIEW_TARGET_PX = 640

export const DEFAULT_QR_FILE_NAME = 'qrcode'

export type QrFormat = 'png' | 'svg'

export const QR_FORMATS: { value: QrFormat; label: string; ext: string; mime: string; hint: string }[] = [
  { value: 'png', label: 'PNG · 이미지 (투명 배경 가능)', ext: 'png', mime: 'image/png', hint: '문서·메신저·웹에 바로 쓰기 좋습니다. 저장 크기가 곧 해상도입니다.' },
  {
    value: 'svg',
    label: 'SVG · 벡터 (인쇄·디자인용)',
    ext: 'svg',
    mime: 'image/svg+xml',
    hint: '아무리 확대해도 선명해 현수막·포스터 같은 인쇄물이나 Illustrator·Figma 작업에 알맞습니다. 크기는 기본 표시 크기입니다.',
  },
]

export const getQrFormat = (format: QrFormat) => QR_FORMATS.find((f) => f.value === format) ?? QR_FORMATS[0]

/** 저장 크기 프리셋(px, 한 변) */
export const SIZE_PRESETS = [256, 512, 1024, 2048] as const

/** 파일명: 금지 문자 치환 + 비면 기본 이름 + 형식별 확장자 */
export function qrFileName(baseName: string, format: QrFormat): string {
  return `${sanitizeFileName(baseName.trim() || DEFAULT_QR_FILE_NAME, DEFAULT_QR_FILE_NAME)}.${getQrFormat(format).ext}`
}

/** 앞뒤 공백·줄바꿈을 제외한 인코딩 대상 — 붙여넣은 URL 끝의 개행으로 링크가 깨지는 것을 막는다 */
export const normalizeQrText = (text: string) => text.trim()

export const utf8ByteLength = (text: string) => new TextEncoder().encode(text).length
