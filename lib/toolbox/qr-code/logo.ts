import { LOGO_MAX_KNOCKOUT_AREA, LOGO_PAD_MODULES } from './options'

/** 중앙 로고 배치(모듈 단위). 구현 기록: docs/TOOLBOX_qr-code_handoff.md */
export interface LogoPlacement {
  /** 지우는 영역의 시작 모듈 인덱스(행·열 공통, 정수) */
  start: number
  /** 지우는 영역 한 변(모듈 수, 정수) — QR 가운데에 정확히 맞도록 `size`와 홀짝이 같다 */
  knock: number
  /** 로고 한 변(모듈, 실수) — 지우는 영역 안에 여유를 두고 들어간다 */
  side: number
}

/**
 * 로고 크기(QR 본체 한 변의 `percent`%)로 배치를 계산한다.
 * 로고가 덮는 모듈은 점으로 그리지 않고(배경이 드러남) 그 위에 로고를 놓는다.
 * 지우는 면적이 `LOGO_MAX_KNOCKOUT_AREA`를 넘지 않도록 필요하면 로고를 줄인다(복원 가능한 범위를 넘지 않게).
 */
export function logoPlacement(matrixSize: number, percent: number): LogoPlacement {
  const knockFor = (side: number) => {
    let k = Math.ceil(side + LOGO_PAD_MODULES * 2)
    if ((matrixSize - k) % 2 !== 0) k += 1
    return Math.min(k, matrixSize)
  }

  let side = (matrixSize * percent) / 100
  let knock = knockFor(side)
  while (knock * knock > LOGO_MAX_KNOCKOUT_AREA * matrixSize * matrixSize && side > 1) {
    side -= 0.5
    knock = knockFor(side)
  }
  return { start: (matrixSize - knock) / 2, knock, side }
}

/** 이 모듈이 로고 영역에 가려 지워지는지 */
export function isKnocked(p: LogoPlacement, row: number, col: number): boolean {
  return row >= p.start && row < p.start + p.knock && col >= p.start && col < p.start + p.knock
}
