import JSZip from 'jszip'
import { createCanvas } from '../common/canvas'
import { encodeCanvas, getExportFormat, sanitizeFileName, type ExportFormat } from '../common/export'
import { pieceFileName, type Piece } from './grid'

/**
 * 조각 캔버스 생성·ZIP 저장 (브라우저 전용). 원본 캔버스는 건드리지 않는다.
 * 번호 배지·분할선은 화면 표시용이라 저장 결과에 포함되지 않는다.
 */

export function cropPiece(source: HTMLCanvasElement, piece: Piece): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(piece.width, piece.height)
  ctx.drawImage(source, piece.x, piece.y, piece.width, piece.height, 0, 0, piece.width, piece.height)
  return canvas
}

export interface ZipResult {
  blob: Blob
  zipName: string
  fileNames: string[]
}

/** 모든 조각을 지정 형식으로 인코딩해 ZIP 하나로 묶는다 (파일명·순서 = 조각 번호) */
export async function buildSplitZip(
  source: HTMLCanvasElement,
  pieces: Piece[],
  options: { baseName: string; format: ExportFormat; quality: number }
): Promise<ZipResult> {
  const baseName = sanitizeFileName(options.baseName)
  const { ext } = getExportFormat(options.format)
  const zip = new JSZip()
  const fileNames: string[] = []
  // 조각을 하나씩 인코딩 → 큰 이미지에서도 조각 캔버스가 한꺼번에 메모리에 쌓이지 않음
  for (const piece of pieces) {
    const name = pieceFileName(baseName, piece.index, pieces.length, ext)
    zip.file(name, await encodeCanvas(cropPiece(source, piece), options.format, options.quality))
    fileNames.push(name)
  }
  // 이미지는 이미 압축된 형식이라 ZIP 압축은 생략(STORE) — 빠르고 크기 차이 거의 없음
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  return { blob, zipName: `${baseName}_split.zip`, fileNames }
}
