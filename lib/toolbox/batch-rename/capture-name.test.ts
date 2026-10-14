import { describe, expect, it } from 'vitest'
import { captureBaseName, clipboardHasText, extensionForMime, filesFromClipboard, isUnnamedClipboardImage, nameClipboardFiles } from './capture-name'

const now = new Date(2026, 9, 14, 9, 5, 7)
const img = (name: string, type = 'image/png') => new File([new Uint8Array([1, 2])], name, { type })

describe('capture-name', () => {
  it('캡처 이름(현지 시각)', () => {
    expect(captureBaseName(now)).toBe('캡처_20261014_090507')
  })
  it('MIME → 확장자', () => {
    expect(extensionForMime('image/png')).toBe('png')
    expect(extensionForMime('image/jpeg')).toBe('jpg')
    expect(extensionForMime('image/x-icon')).toBe('xicon')
    expect(extensionForMime('application/octet-stream')).toBe('png')
  })
  it('임시 이름 판별', () => {
    expect(isUnnamedClipboardImage(img('image.png'))).toBe(true)
    expect(isUnnamedClipboardImage(img('IMAGE.JPG', 'image/jpeg'))).toBe(true)
    expect(isUnnamedClipboardImage(img(''))).toBe(true)
    expect(isUnnamedClipboardImage(img('스크린샷 2026-10-14.png'))).toBe(false)
    expect(isUnnamedClipboardImage(img('image.png', 'application/pdf'))).toBe(false)
  })
  it('캡처는 이름을 붙이고, 같은 초·기존 이름이면 _2, _3', () => {
    const named = nameClipboardFiles([img('image.png'), img('image.png'), img('report.pdf', 'application/pdf'), img('image.jpg', 'image/jpeg')], ['캡처_20261014_090507.png'], now)
    expect(named.map((f) => f.name)).toEqual(['캡처_20261014_090507_2.png', '캡처_20261014_090507_3.png', 'report.pdf', '캡처_20261014_090507.jpg'])
    expect(named[0].type).toBe('image/png')
    expect(named[0].size).toBe(2)
    expect(named[0].lastModified).toBe(now.getTime())
  })
  it('실제 파일은 그대로(같은 객체)', () => {
    const f = img('photo.png')
    expect(nameClipboardFiles([f], [], now)[0]).toBe(f)
  })
  it('붙여넣기 데이터에서 파일·글자 여부', () => {
    const a = img('image.png')
    const data = { items: [{ kind: 'string' }, { kind: 'file', getAsFile: () => a }], files: [], types: ['Files', 'text/plain'] } as unknown as DataTransfer
    expect(filesFromClipboard(data)).toEqual([a])
    expect(clipboardHasText(data)).toBe(true)
    expect(clipboardHasText({ types: ['Files'] } as unknown as DataTransfer)).toBe(false)
    expect(filesFromClipboard(null)).toEqual([])
  })
})
