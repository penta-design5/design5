import { describe, expect, it } from 'vitest'
import { filesFromDataTransfer } from './drop'
import { addFiles, addResultMessage, MAX_FILES, MAX_TOTAL_BYTES, removeItem, summaryLabel, totalBytes } from './list'

const MB = 1024 * 1024
const fakeFile = (name: string, size: number) => ({ name, size }) as File
const idGen = () => {
  let n = 0
  return () => `id${++n}`
}

describe('addFiles', () => {
  it('기존 목록 뒤에 순서대로 추가한다(불변)', () => {
    const id = idGen()
    const first = addFiles([], [fakeFile('a.pptx', 10), fakeFile('b.pdf', 20)], id)
    const second = addFiles(first.items, [fakeFile('c.png', 5)], id)
    expect(second.items.map((i) => i.originalName)).toEqual(['a.pptx', 'b.pdf', 'c.png'])
    expect(second.items.map((i) => i.id)).toEqual(['id1', 'id2', 'id3'])
    expect(first.items).toHaveLength(2)
    expect(second.added).toBe(1)
  })

  it('개수 상한(2,000개)을 넘는 파일은 건너뛴다', () => {
    const files = Array.from({ length: MAX_FILES + 5 }, (_, i) => fakeFile(`f${i}`, 1))
    const r = addFiles([], files, idGen())
    expect(r.items).toHaveLength(MAX_FILES)
    expect(r.skippedByCount).toBe(5)
    expect(r.skippedBySize).toBe(0)
  })

  it('용량 상한(300MB)을 넘는 파일만 건너뛰고 뒤의 작은 파일은 넣는다', () => {
    const r = addFiles([], [fakeFile('a', 200 * MB), fakeFile('big', 150 * MB), fakeFile('c', 100 * MB)], idGen())
    expect(r.items.map((i) => i.originalName)).toEqual(['a', 'c'])
    expect(r.skippedBySize).toBe(1)
    expect(totalBytes(r.items)).toBe(MAX_TOTAL_BYTES)
  })

  it('0바이트 파일도 추가한다', () => {
    expect(addFiles([], [fakeFile('empty.txt', 0)], idGen()).added).toBe(1)
  })
})

describe('removeItem·summaryLabel', () => {
  it('id로 하나만 지운다', () => {
    const { items } = addFiles([], [fakeFile('a', 1), fakeFile('b', 2)], idGen())
    expect(removeItem(items, 'id1').map((i) => i.originalName)).toEqual(['b'])
  })

  it('개수·합계 용량', () => {
    const { items } = addFiles([], [fakeFile('a', 30 * MB), fakeFile('b', 26.4 * MB)], idGen())
    expect(summaryLabel(items)).toBe('2개 · 56.4MB')
    expect(summaryLabel([])).toBe('0개 · 0B')
  })
})

describe('addResultMessage', () => {
  it('정상 추가', () => {
    expect(addResultMessage({ added: 3, skippedByCount: 0, skippedBySize: 0 })).toEqual({
      text: '3개를 목록에 추가했습니다. 확장자와 파일 내용은 그대로 유지됩니다.',
      warning: false,
    })
  })
  it('상한·폴더 안내', () => {
    expect(addResultMessage({ added: 1, skippedByCount: 0, skippedBySize: 2 }).text).toBe(
      '1개를 목록에 추가했습니다. 2개는 용량 상한(합계 300MB)을 넘어 추가하지 않았습니다.'
    )
    expect(addResultMessage({ added: 0, skippedByCount: 4, skippedBySize: 0 }).text).toBe(
      '4개는 개수 상한(최대 2,000개)을 넘어 추가하지 않았습니다.'
    )
    expect(addResultMessage({ added: 0, skippedByCount: 1, skippedBySize: 1 }).text).toContain('개수·용량 상한')
    const folder = addResultMessage({ added: 2, skippedByCount: 0, skippedBySize: 0 }, 1)
    expect(folder.warning).toBe(true)
    expect(folder.text).toBe('2개를 목록에 추가했습니다. 폴더 1개는 추가하지 않았습니다(파일만 추가할 수 있습니다).')
    expect(addResultMessage({ added: 0, skippedByCount: 0, skippedBySize: 0 }).text).toBe('추가할 파일이 없습니다.')
  })
})

describe('filesFromDataTransfer', () => {
  const entry = (isDirectory: boolean, file: File | null) => ({
    kind: 'file',
    webkitGetAsEntry: () => ({ isDirectory }),
    getAsFile: () => file,
  })
  it('폴더는 건너뛰고 개수를 센다', () => {
    const a = fakeFile('a.png', 1)
    const data = { items: [entry(false, a), entry(true, null), { kind: 'string' }], files: [a] } as unknown as DataTransfer
    expect(filesFromDataTransfer(data)).toEqual({ files: [a], folders: 1 })
  })
  it('webkitGetAsEntry가 없으면 files를 그대로 쓴다', () => {
    const a = fakeFile('a.png', 1)
    const data = { items: [{ kind: 'file' }], files: [a] } as unknown as DataTransfer
    expect(filesFromDataTransfer(data)).toEqual({ files: [a], folders: 0 })
    expect(filesFromDataTransfer(null)).toEqual({ files: [], folders: 0 })
  })
})
