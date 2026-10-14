import JSZip from 'jszip'

export interface ZipEntry {
  /** ZIP 안의 새 파일명 */
  name: string
  data: Blob | Uint8Array
  /** 수정한 날짜(원본 `File.lastModified`) — 압축을 풀어도 원본 날짜가 유지되도록 */
  lastModified?: number
}

/**
 * 새 이름으로 파일을 담은 ZIP(D8). 내용은 바이트 그대로, **무압축(STORE)** — 대부분 이미 압축된 형식이라 빠르고 메모리가 적다.
 * jszip은 ASCII가 아닌 이름에 UTF-8 플래그(0x0800)와 Unicode Path 확장 필드를 함께 기록한다(한글 파일명).
 */
export function createRenameZip(entries: readonly ZipEntry[]): JSZip {
  const zip = new JSZip()
  for (const entry of entries) {
    zip.file(entry.name, entry.data, {
      binary: true,
      date: entry.lastModified ? toZipLocalDate(entry.lastModified) : undefined,
    })
  }
  return zip
}

/**
 * ZIP(DOS) 날짜에는 시간대가 없어 압축 프로그램이 **현지 시각**으로 읽는데, jszip은 UTC 값을 기록한다.
 * 그대로면 한국(UTC+9)에서 풀었을 때 수정한 날짜가 9시간 앞당겨지므로, UTC 필드가 현지 시각과 같아지도록 옮겨 둔다.
 */
export function toZipLocalDate(time: number): Date {
  return new Date(time - new Date(time).getTimezoneOffset() * 60_000)
}

export const ZIP_GENERATE_OPTIONS = { compression: 'STORE', streamFiles: true } as const

/** ZIP 생성 진행률(0~100 정수) — 같은 값은 건너뛰어 화면 갱신을 줄인다 */
export function createProgressReporter(onPercent: (percent: number) => void): (meta: { percent: number }) => void {
  let last = -1
  return ({ percent }) => {
    const next = Math.min(100, Math.floor(percent))
    if (next !== last) {
      last = next
      onPercent(next)
    }
  }
}

/** ZIP 생성 실패 시 읽을 수 없는 원본 파일을 찾는다(목록에 넣은 뒤 원본이 옮겨지거나 삭제된 경우). 모두 읽히면 null */
export async function findUnreadableFile<T extends { file: Blob }>(items: readonly T[]): Promise<T | null> {
  for (const item of items) {
    try {
      await item.file.slice(0, 1).arrayBuffer()
    } catch {
      return item
    }
  }
  return null
}
