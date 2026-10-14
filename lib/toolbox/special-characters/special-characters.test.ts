import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'
import { SYMBOL_CATEGORIES } from './data/symbols'
import { codePointLabel } from './types'

const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' })

describe('SYMBOL_CATEGORIES 데이터 무결성', () => {
  it('카테고리 id·라벨이 비어 있지 않고 id가 겹치지 않는다', () => {
    const ids = SYMBOL_CATEGORIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of SYMBOL_CATEGORIES) {
      expect(c.id).toBeTruthy()
      expect(c.label).toBeTruthy()
      expect(c.entries.length).toBeGreaterThan(0)
    }
  })

  it('모든 칸은 문자 1개(grapheme)와 한글 이름을 가진다', () => {
    for (const c of SYMBOL_CATEGORIES) {
      for (const e of c.entries) {
        const graphemes = [...segmenter.segment(e.char)]
        expect(graphemes.length, `${c.id}: "${e.char}" (${e.name})`).toBe(1)
        expect(e.name.trim(), `${c.id}: "${e.char}"`).not.toBe('')
        expect(e.char).not.toMatch(/\s/)
      }
    }
  })

  it('같은 카테고리 안에서 문자가 중복되지 않는다', () => {
    for (const c of SYMBOL_CATEGORIES) {
      const chars = c.entries.map((e) => e.char)
      const dup = chars.filter((ch, i) => chars.indexOf(ch) !== i)
      expect(dup, `${c.id} 중복`).toEqual([])
    }
  })

  it('이모지 표시 형태(variation selector U+FE0F)를 넣지 않는다', () => {
    for (const c of SYMBOL_CATEGORIES) {
      for (const e of c.entries) expect(e.char.includes('️'), `${c.id}: ${e.char}`).toBe(false)
    }
  })
})

describe('codePointLabel', () => {
  it('단일 문자는 U+XXXX 4자리 이상 대문자 16진수다', () => {
    expect(codePointLabel('→')).toBe('U+2192')
    expect(codePointLabel('A')).toBe('U+0041')
  })
  it('보조 평면·시퀀스는 코드포인트마다 공백으로 잇는다', () => {
    expect(codePointLabel('😀')).toBe('U+1F600')
    expect(codePointLabel('🇰🇷')).toBe('U+1F1F0 U+1F1F7')
  })
})

describe('copyText', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('Clipboard API가 있으면 그것으로 쓰고 true를 돌려준다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await copyText('★')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('★')
  })

  it('Clipboard API가 거부되면 execCommand 폴백으로 복사한다', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    const exec = vi.fn().mockReturnValue(true)
    ;(document as unknown as { execCommand: typeof exec }).execCommand = exec
    expect(await copyText('→')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull() // 임시 요소 정리
  })

  it('둘 다 실패하면 false', async () => {
    vi.stubGlobal('navigator', {})
    ;(document as unknown as { execCommand: () => boolean }).execCommand = () => false
    expect(await copyText('x')).toBe(false)
  })
})
