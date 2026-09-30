import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_BYTES,
  MAX_PIXELS,
} from './constants'

interface FileLike {
  name: string
  type: string
  size: number
}

const getExtension = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

/** 형식·용량 검증. 문제가 없으면 null, 있으면 사용자에게 보여줄 메시지 */
export function validateImageFile(file: FileLike): string | null {
  const ext = getExtension(file.name)
  const type = file.type.toLowerCase()

  if (type === 'image/heic' || type === 'image/heif' || ext === 'heic' || ext === 'heif') {
    return 'HEIC 형식은 지원하지 않습니다. JPG 또는 PNG로 변환한 뒤 다시 시도해 주세요.'
  }

  const typeOk = (ACCEPTED_MIME_TYPES as readonly string[]).includes(type)
  // 일부 환경은 MIME이 비어 있으므로 확장자로 보완
  const extOk = type === '' && (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)
  if (!typeOk && !extOk) {
    return '지원하지 않는 형식입니다. PNG, JPG, WebP, GIF, BMP 이미지를 사용해 주세요.'
  }

  if (file.size > MAX_FILE_BYTES) {
    return '파일 용량이 20MB를 초과합니다.'
  }
  if (file.size === 0) {
    return '빈 파일입니다.'
  }

  return null
}

/** 픽셀 수 상한 검증. 문제가 없으면 null */
export function validatePixelCount(width: number, height: number): string | null {
  if (width * height > MAX_PIXELS) {
    return `이미지가 너무 큽니다(${width}×${height}px). 약 1,670만 픽셀(예: 4096×4096) 이하로 줄여서 사용해 주세요.`
  }
  return null
}

export class ImageLoadError extends Error {}

function loadViaImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageLoadError('이미지를 읽을 수 없습니다. 손상된 파일인지 확인해 주세요.'))
    }
    img.src = url
  })
}

/**
 * 파일을 디코딩해 편집용 캔버스로 만든다.
 * - EXIF 방향 보정: `createImageBitmap(..., { imageOrientation: 'from-image' })`
 *   (미지원 브라우저는 `<img>` 로드로 대체 — 최신 브라우저는 `<img>`도 EXIF 방향을 반영)
 * - GIF는 첫 프레임만 사용
 */
export async function decodeImageFile(file: File): Promise<HTMLCanvasElement> {
  let source: ImageBitmap | HTMLImageElement
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    source = await loadViaImageElement(file)
  }

  const width = 'naturalWidth' in source ? source.naturalWidth : source.width
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height

  try {
    if (!width || !height) {
      throw new ImageLoadError('이미지를 읽을 수 없습니다. 손상된 파일인지 확인해 주세요.')
    }
    const pixelError = validatePixelCount(width, height)
    if (pixelError) throw new ImageLoadError(pixelError)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageLoadError('브라우저에서 캔버스를 사용할 수 없습니다.')
    ctx.drawImage(source, 0, 0)
    return canvas
  } finally {
    if ('close' in source) source.close()
  }
}

/** 클립보드 붙여넣기 이벤트에서 이미지 파일 추출 (없으면 null) */
export function getImageFileFromClipboard(data: DataTransfer | null): File | null {
  if (!data) return null
  for (const item of Array.from(data.items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }
  return null
}
