import { describe, expect, it } from 'vitest'
import { KAOMOJI_CATEGORIES, KAOMOJI_MAX_LENGTH } from './data/kaomoji'
import { searchEntries } from './search'

const all = KAOMOJI_CATEGORIES.flatMap((c) => c.entries)

describe('KAOMOJI_CATEGORIES 데이터 무결성', () => {
  it('카테고리 id·라벨이 비어 있지 않고 겹치지 않으며 칸이 있다', () => {
    const ids = KAOMOJI_CATEGORIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of KAOMOJI_CATEGORIES) {
      expect(c.id).toBeTruthy()
      expect(c.label).toBeTruthy()
      expect(c.entries.length).toBeGreaterThan(5)
    }
    expect(all.length).toBeGreaterThan(80)
  })

  it('모든 칸은 이름·키워드가 있고 wide이며, 개행·앞뒤 공백이 없고 길이 상한 이내다', () => {
    for (const e of all) {
      expect(e.wide, e.char).toBe(true)
      expect(e.name.trim(), e.char).not.toBe('')
      expect(e.keywords && e.keywords.length > 0, `키워드 없음: ${e.char}`).toBe(true)
      expect(e.char, e.char).not.toMatch(/[\r\n\t]/)
      expect(e.char, `앞뒤 공백: "${e.char}"`).toBe(e.char.trim())
      expect(Array.from(e.char).length, e.char).toBeLessThanOrEqual(KAOMOJI_MAX_LENGTH)
      expect(e.char.includes('\u2016'), `구분자 혼입: ${e.char}`).toBe(false)
    }
  })

  it('전체에서 중복이 없다', () => {
    const chars = all.map((e) => e.char)
    expect(chars.filter((c, i) => chars.indexOf(c) !== i)).toEqual([])
  })

  it('이스케이프가 해석되지 않고 그대로 보존된다(역슬래시·내부 공백·ASCII 기호)', () => {
    const chars = new Set(all.map((e) => e.char))
    expect(chars.has('¯\\_(ツ)_/¯')).toBe(true) // 역슬래시 1개
    expect(chars.has('\\(^o^)/')).toBe(true)
    expect(chars.has('_| ̄|○')).toBe(true)
    expect(chars.has('( ͡° ͜ʖ ͡°)')).toBe(true) // 내부 공백
    expect(chars.has('<3')).toBe(true)
    expect([...chars].some((c) => c.includes('`'))).toBe(false) // ASCII 백틱은 쓰지 않음
  })
})

describe('텍스트 이모티콘 검색', () => {
  it('한글·영어 키워드로 찾는다', () => {
    expect(searchEntries(all, '어깨 으쓱').entries.map((e) => e.char)).toContain('¯\\_(ツ)_/¯')
    expect(searchEntries(all, 'shrug').entries[0].char).toBe('¯\\_(ツ)_/¯')
    expect(searchEntries(all, '고양이').entries.length).toBeGreaterThanOrEqual(3)
    expect(searchEntries(all, 'cry').entries.length).toBeGreaterThanOrEqual(5)
  })
  it('이모티콘 문자 자체로 찾는다', () => {
    expect(searchEntries(all, 'orz').entries[0].char).toBe('orz')
    expect(searchEntries(all, '<3').entries[0].char).toBe('<3')
  })
})
