import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { createProgressReporter, createRenameZip, findUnreadableFile, toZipLocalDate, ZIP_GENERATE_OPTIONS } from './zip'

const bytes = (...n: number[]) => new Uint8Array(n)

describe('createRenameZip', () => {
  it('새 이름·순서·내용 바이트 그대로', async () => {
    const zip = createRenameZip([
      { name: '상품이미지_001.pptx', data: bytes(1, 2, 3) },
      { name: '상품이미지_002.pdf', data: bytes(255, 0) },
      { name: '003', data: bytes() },
    ])
    const raw = await zip.generateAsync({ ...ZIP_GENERATE_OPTIONS, type: 'uint8array' })
    const read = await JSZip.loadAsync(raw)
    expect(Object.keys(read.files)).toEqual(['상품이미지_001.pptx', '상품이미지_002.pdf', '003'])
    expect(Array.from(await read.file('상품이미지_001.pptx')!.async('uint8array'))).toEqual([1, 2, 3])
    expect(Array.from(await read.file('상품이미지_002.pdf')!.async('uint8array'))).toEqual([255, 0])
    expect((await read.file('003')!.async('uint8array')).length).toBe(0)
  })

  it('무압축(STORE)·한글 이름은 UTF-8 플래그', async () => {
    const raw = await createRenameZip([{ name: '사진_001.png', data: bytes(9, 9, 9, 9) }]).generateAsync({ ...ZIP_GENERATE_OPTIONS, type: 'uint8array' })
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
    expect(view.getUint32(0, true)).toBe(0x04034b50) // 로컬 파일 헤더
    expect(view.getUint16(6, true) & 0x0800).toBe(0x0800) // 범용 비트 플래그: UTF-8 이름
    expect(view.getUint16(8, true)).toBe(0) // 압축 방법 0 = STORE
  })

  it('수정한 날짜는 현지 시각 그대로 기록(압축 프로그램이 현지 시각으로 읽음)', async () => {
    const local = new Date(2025, 11, 24, 10, 30, 0)
    const raw = await createRenameZip([{ name: 'a.txt', data: bytes(1), lastModified: local.getTime() }]).generateAsync({ ...ZIP_GENERATE_OPTIONS, type: 'uint8array' })
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
    const dosTime = view.getUint16(10, true)
    const dosDate = view.getUint16(12, true)
    expect([(dosDate >> 9) + 1980, (dosDate >> 5) & 0xf, dosDate & 0x1f, dosTime >> 11, (dosTime >> 5) & 0x3f]).toEqual([2025, 12, 24, 10, 30])
  })

  it('toZipLocalDate: UTC 필드 = 현지 시각', () => {
    const local = new Date(2026, 0, 2, 3, 4, 6)
    const shifted = toZipLocalDate(local.getTime())
    expect([shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), shifted.getUTCHours(), shifted.getUTCMinutes()]).toEqual([2026, 0, 2, 3, 4])
  })
})

describe('createProgressReporter', () => {
  it('정수 변화만 알린다', () => {
    const seen: number[] = []
    const report = createProgressReporter((p) => seen.push(p))
    for (const percent of [0, 0.4, 12.2, 12.9, 50, 99.99, 100, 100]) report({ percent })
    expect(seen).toEqual([0, 12, 50, 99, 100])
  })
})

describe('findUnreadableFile', () => {
  it('읽히지 않는 첫 파일', async () => {
    const good = { id: 'a', file: new Blob(['x']) }
    const bad = { id: 'b', file: { slice: () => ({ arrayBuffer: () => Promise.reject(new Error('NotFoundError')) }) } as unknown as Blob }
    expect(await findUnreadableFile([good, bad, good])).toBe(bad)
    expect(await findUnreadableFile([good])).toBeNull()
  })
})
