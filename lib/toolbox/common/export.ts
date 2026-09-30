export type ExportFormat = 'png' | 'jpeg' | 'webp'

export const EXPORT_FORMATS: { value: ExportFormat; label: string; mime: string; ext: string; lossy: boolean }[] = [
  { value: 'png', label: 'PNG', mime: 'image/png', ext: 'png', lossy: false },
  { value: 'jpeg', label: 'JPG', mime: 'image/jpeg', ext: 'jpg', lossy: true },
  { value: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp', lossy: true },
]

export const DEFAULT_EXPORT_QUALITY = 0.92

export const getExportFormat = (format: ExportFormat) =>
  EXPORT_FORMATS.find((f) => f.value === format) ?? EXPORT_FORMATS[0]

/** 원본 파일명에서 확장자를 뗀 이름 (비면 `image`) */
export function baseNameOf(originalName: string): string {
  return originalName.replace(/\.[^./\\]+$/, '').trim() || 'image'
}

/** 원본 파일명에서 확장자를 뗀 기본 이름 + `_edited` */
export function defaultExportBaseName(originalName: string): string {
  return `${baseNameOf(originalName)}_edited`
}

/** 파일명에 쓸 수 없는 문자 치환 (비면 fallback) */
export function sanitizeFileName(name: string, fallback = 'image'): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || fallback
}

/** 파일명에 쓸 수 없는 문자 제거 + 확장자 부착 */
export function buildExportFileName(baseName: string, format: ExportFormat): string {
  const safe = baseName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'image_edited'
  return `${safe}.${getExportFormat(format).ext}`
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
}

/**
 * 합성이 끝난 원본 해상도 캔버스를 지정 형식으로 인코딩한다.
 * JPG는 투명도를 지원하지 않으므로 흰색 배경을 깔고 그린다.
 */
export async function encodeCanvas(source: HTMLCanvasElement, format: ExportFormat, quality: number): Promise<Blob> {
  const { mime, lossy, label } = getExportFormat(format)
  let target = source

  if (format === 'jpeg') {
    target = document.createElement('canvas')
    target.width = source.width
    target.height = source.height
    const ctx = target.getContext('2d')
    if (!ctx) throw new Error('브라우저에서 캔버스를 사용할 수 없습니다.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, target.width, target.height)
    ctx.drawImage(source, 0, 0)
  }

  const blob = await canvasToBlob(target, mime, lossy ? quality : undefined)
  // 인코딩 미지원 브라우저는 PNG로 대체해 돌려주므로 형식을 확인한다
  if (!blob || blob.type !== mime) {
    throw new Error(`이 브라우저는 ${label} 저장을 지원하지 않습니다. 다른 형식을 선택해 주세요.`)
  }
  return blob
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
