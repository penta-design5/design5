/**
 * 다이어그램 렌더링/다운로드 (Konva·DOM 의존)
 *
 * Konva Stage 기반 비트맵 추출 및 브라우저 파일 다운로드 헬퍼.
 * 순수 도형 모델은 ./shapes, 포맷 내보내기는 ./export 참조.
 */

import Konva from 'konva'

/**
 * PNG로 내보내기
 */
export async function exportToPNG(stage: Konva.Stage): Promise<Blob> {
  const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' })
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return blob
}

/**
 * JPG로 내보내기
 */
export async function exportToJPG(stage: Konva.Stage): Promise<Blob> {
  const dataUrl = stage.toDataURL({
    pixelRatio: 2,
    mimeType: 'image/jpeg',
    quality: 0.9,
  })
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return blob
}

/**
 * 썸네일 생성 (Data URL)
 */
export function generateThumbnailDataUrl(stage: Konva.Stage): string {
  const dataUrl = stage.toDataURL({
    pixelRatio: 0.25, // 1/4 크기
    mimeType: 'image/png',
  })
  return dataUrl
}

/**
 * 파일 다운로드 헬퍼
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
