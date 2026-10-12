import QRCode from 'qrcode'
import { QR_BYTE_CAPACITY, type EcLevel } from './options'

/** QR 모듈 행렬(true = 어두운 모듈). 라이브러리 객체와 분리해 렌더·테스트가 의존하지 않게 한다. */
export interface QrMatrix {
  /** 한 변의 모듈 수 */
  size: number
  version: number
  /** 행 우선 `size * size` */
  dark: Uint8Array
}

export type QrMatrixResult = { ok: true; matrix: QrMatrix } | { ok: false; error: string }

export const isDark = (m: QrMatrix, row: number, col: number) => m.dark[row * m.size + col] === 1

/**
 * 텍스트 → QR 행렬. 용량 초과 등 생성 실패는 사용자 안내 문구로 돌려준다.
 * `minVersion`이 있고 자동 선택된 버전이 그보다 작으면 그 버전으로 다시 만든다(내용이 넘치면 실패).
 */
export function buildQrMatrix(text: string, ecLevel: EcLevel, minVersion = 1): QrMatrixResult {
  try {
    let qr = QRCode.create(text, { errorCorrectionLevel: ecLevel })
    if (qr.version < minVersion) qr = QRCode.create(text, { errorCorrectionLevel: ecLevel, version: minVersion })
    const size = qr.modules.size
    const dark = new Uint8Array(size * size)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) dark[row * size + col] = qr.modules.get(row, col) ? 1 : 0
    }
    return { ok: true, matrix: { size, version: qr.version, dark } }
  } catch {
    return {
      ok: false,
      error: `내용이 너무 길어 QR 코드로 만들 수 없습니다. 훼손 복원력 ${ecLevel} 기준 약 ${QR_BYTE_CAPACITY[ecLevel].toLocaleString()}바이트까지 담을 수 있습니다.`,
    }
  }
}
