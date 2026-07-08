/**
 * ICON+ 병합 결과 다운로드 유틸리티 (클라이언트 전용)
 *
 * SVG는 Blob으로 바로 저장하고, PNG/JPG는 Canvas로 래스터화(`toBlob`)해 저장한다.
 * (JPG는 흰색 배경을 깔아 투명 영역이 검게 나오지 않게 한다.)
 * canvas/Image/URL 등 DOM API를 사용하므로 서버 공용 순수 모듈(`icon-plus-properties.ts`)과 분리했다.
 *
 * icon-merger `downloadBlob`/`renderSvgToRasterBlob`/`createMergedFilename` 이식본.
 * @see docs/ICON_PLUS_개발계획.md §7
 */

export type DownloadFormat = 'svg' | 'png' | 'jpg'

/** Blob을 파일로 다운로드시킨다. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** 병합 결과 SVG 문자열을 지정 포맷의 Blob으로 만든다. */
export async function createDownloadBlob(params: {
  format: DownloadFormat
  svgContent: string
  width: number
  height: number
}): Promise<Blob> {
  if (params.format === 'svg') {
    return new Blob([params.svgContent], { type: 'image/svg+xml;charset=utf-8' })
  }
  return renderSvgToRasterBlob(params as { format: 'png' | 'jpg' } & typeof params)
}

/** SVG 문자열을 Canvas로 래스터화하여 PNG/JPG Blob을 만든다. */
async function renderSvgToRasterBlob({
  format,
  svgContent,
  width,
  height,
}: {
  format: 'png' | 'jpg'
  svgContent: string
  width: number
  height: number
}): Promise<Blob> {
  const image = await loadSvgImage(svgContent)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const canvasWidth = Math.max(Math.ceil(width), 1)
  const canvasHeight = Math.max(Math.ceil(height), 1)

  if (!context) {
    throw new Error('Canvas 컨텍스트를 사용할 수 없습니다.')
  }

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  if (format === 'jpg') {
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  context.drawImage(image, 0, 0, canvasWidth, canvasHeight)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new Error('Canvas 변환에 실패했습니다.'))
      },
      format === 'png' ? 'image/png' : 'image/jpeg',
      // JPG는 최고 품질(1.0)로 인코딩해 경계 압축 노이즈 최소화. PNG는 무손실이라 이 값 무시.
      1
    )
  })
}

/** SVG 문자열을 이미지로 로드한다(스크립트 미실행 — 이미지 파이프라인). */
function loadSvgImage(svgContent: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('SVG 이미지 로딩에 실패했습니다.'))
    }
    image.src = url
  })
}

/** `icon-merged-<메인>-<리소스>-<크기>px.<포맷>` 형태의 파일명을 만든다. */
export function createMergedFilename(params: {
  format: DownloadFormat
  mainName: string
  resourceName: string
  size: number
}): string {
  return `icon-merged-${slugifyFilenamePart(params.mainName)}-${slugifyFilenamePart(
    params.resourceName
  )}-${params.size}px.${params.format}`
}

function slugifyFilenamePart(value: string): string {
  const slug = value
    .replace(/\.[a-z0-9]+$/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'icon'
}
