/**
 * 붙여넣은 파일 이름(D5). 캡처(Win+Shift+S·⌘+Shift+Ctrl+4 등) 이미지는 원본 이름이 없어
 * 브라우저가 `image.png` 같은 이름을 붙이므로 `캡처_YYYYMMDD_HHmmss[_n].png`로 바꾼다.
 * 탐색기·Finder에서 복사한 실제 파일은 이름을 그대로 둔다.
 */

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/tiff': 'tiff',
  'image/avif': 'avif',
}

export function extensionForMime(mime: string): string {
  return MIME_EXTENSIONS[mime.toLowerCase()] ?? (mime.startsWith('image/') ? mime.slice(6).replace(/[^a-z0-9]/gi, '') || 'png' : 'png')
}

/** 브라우저가 붙인 임시 이름인지(이름 없음 또는 `image.png`·`image.jpg` 등) */
export function isUnnamedClipboardImage(file: Pick<File, 'name' | 'type'>): boolean {
  if (!file.type.startsWith('image/')) return false
  return file.name === '' || /^image\.[a-z0-9]+$/i.test(file.name)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** `캡처_20261014_134501` (현지 시각) */
export function captureBaseName(date: Date): string {
  return `캡처_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/**
 * 캡처 이미지에 이름을 붙인 새 `File` 목록. 같은 초에 여러 장이거나 목록에 이미 있는 이름이면 `_2`, `_3`…을 붙인다.
 * `existingNames`는 현재 목록의 원본 이름.
 */
export function nameClipboardFiles(files: readonly File[], existingNames: Iterable<string>, now: Date): File[] {
  const used = new Set(existingNames)
  const base = captureBaseName(now)
  return files.map((file) => {
    if (!isUnnamedClipboardImage(file)) return file
    const ext = extensionForMime(file.type)
    let name = `${base}.${ext}`
    for (let n = 2; used.has(name); n++) name = `${base}_${n}.${ext}`
    used.add(name)
    return new File([file], name, { type: file.type, lastModified: now.getTime() })
  })
}

/** 붙여넣기 이벤트의 파일들(없으면 빈 배열) */
export function filesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return []
  const fromItems = Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
  return fromItems.length > 0 ? fromItems : Array.from(data.files ?? [])
}

/** 붙여넣기에 글자가 함께 있는지 — 입력칸에 포커스가 있을 때 글자 붙여넣기를 가로채지 않기 위함 */
export function clipboardHasText(data: DataTransfer | null): boolean {
  return Boolean(data && Array.from(data.types ?? []).some((type) => type === 'text/plain' || type === 'text/html'))
}
