import { describe, expect, it } from 'vitest'
import emojiData from './data/emoji.generated.json'
import { SYMBOL_CATEGORIES } from './data/symbols'
import { createEmojiChecker, isEmojiRendered, SEQUENCE_WIDTH_LIMIT, type EmojiProbe } from './emoji-support'
import { queryTokens, SEARCH_LIMIT, searchEntries } from './search'
import type { CharEntry } from './types'

const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' })
const groups = (emojiData as { groups: { id: string; label: string; items: string[][] }[] }).groups

describe('emoji.generated.json 무결성', () => {
  it('9개 그룹(국기 포함)·총 1,500개 이상이고 id·라벨이 겹치지 않는다', () => {
    expect(groups.map((g) => g.id)).toEqual(['smileys', 'people', 'animals', 'food', 'travel', 'activities', 'objects', 'symbols', 'flags'])
    expect(new Set(groups.map((g) => g.label)).size).toBe(groups.length)
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBeGreaterThan(1500)
  })

  it('모든 항목은 이모지 1개(grapheme)와 한글 이름을 가지고 전체에서 중복이 없다', () => {
    const seen = new Set<string>()
    for (const g of groups) {
      for (const [emoji, name, keywords] of g.items) {
        expect([...segmenter.segment(emoji)].length, `${g.id}: ${name}`).toBe(1)
        expect(name.trim(), g.id).not.toBe('')
        expect(typeof keywords).toBe('string')
        expect(seen.has(emoji), `중복 ${emoji}`).toBe(false)
        seen.add(emoji)
      }
    }
  })

  it('국기 그룹에 대한민국이 있고 한/영 키워드로 찾을 수 있다', () => {
    const flags = groups.find((g) => g.id === 'flags')!
    const kr = flags.items.find(([e]) => e === '🇰🇷')
    expect(kr?.[1]).toContain('대한민국')
    expect(kr?.[2]).toContain('south korea')
  })

  it('피부톤 변형·구성 요소·지역 지표 단독 문자는 들어 있지 않다', () => {
    for (const g of groups) {
      for (const [emoji] of g.items) {
        expect(/[\u{1F3FB}-\u{1F3FF}]/u.test(emoji), `피부톤 ${emoji}`).toBe(false)
        expect(/^[\u{1F1E6}-\u{1F1FF}]$/u.test(emoji), `지역 지표 ${emoji}`).toBe(false)
      }
    }
  })
})

/** 문자열 → 가짜 픽셀·폭을 돌려주는 프로브 */
function fakeProbe(rules: { colored?: string[]; text?: string[]; width?: Record<string, number> }): EmojiProbe {
  return {
    render(text, fill) {
      if (rules.colored?.includes(text)) return new Uint8ClampedArray([255, 0, 0, 255]) // 색과 무관
      if (rules.text?.includes(text)) return fill === '#000' ? new Uint8ClampedArray([0, 0, 0, 255]) : new Uint8ClampedArray([255, 255, 255, 255]) // 글자색을 따름
      return null // 아무것도 안 그려짐
    },
    measure: (text) => rules.width?.[text] ?? 32,
  }
}

describe('isEmojiRendered', () => {
  it('컬러 글리프(검정·흰색으로 그려도 같음)는 지원', () => {
    expect(isEmojiRendered(fakeProbe({ colored: ['😀'] }), '😀')).toBe(true)
  })
  it('글자색을 따르는 글리프(네모·「KR」)는 미지원', () => {
    expect(isEmojiRendered(fakeProbe({ text: ['🇰🇷'] }), '🇰🇷')).toBe(false)
  })
  it('오래된 BMP 기호 이모지(♀️ ♂️ ⚕️ ❤️)는 글꼴이 단색으로 그려도 지원 — 오탐 방지', () => {
    for (const e of ['♀\uFE0F', '♂\uFE0F', '⚕\uFE0F', '❤\uFE0F', '☀']) {
      expect(isEmojiRendered(fakeProbe({ text: [e] }), e), e).toBe(true)
    }
  })
  it('오래된 BMP 기호라도 아무것도 안 그려지면 미지원', () => {
    expect(isEmojiRendered(fakeProbe({}), '♀\uFE0F')).toBe(false)
  })
  it('BMP가 아닌 이모지·시퀀스는 단색(글자색)이면 미지원 — 신규 이모지의 네모 방지', () => {
    expect(isEmojiRendered(fakeProbe({ text: ['🫩'] }), '🫩')).toBe(false)
    expect(isEmojiRendered(fakeProbe({ text: ['🧔\u200D♂\uFE0F'] }), '🧔\u200D♂\uFE0F')).toBe(false)
    expect(isEmojiRendered(fakeProbe({ text: ['#\uFE0F\u20E3'] }), '#\uFE0F\u20E3')).toBe(false)
  })
  it('아무것도 그려지지 않으면 미지원', () => {
    expect(isEmojiRendered(fakeProbe({}), '😀')).toBe(false)
  })
  it('ZWJ 시퀀스: 폭이 첫 요소와 비슷하면 지원, 한계배수를 넘으면(낱개로 갈라짐) 미지원', () => {
    const family = '👨‍👩‍👧'
    const ok = fakeProbe({ colored: [family], width: { '👨': 32, [family]: 36 } })
    const split = fakeProbe({ colored: [family], width: { '👨': 32, [family]: 32 * 3 } })
    const edge = fakeProbe({ colored: [family], width: { '👨': 32, [family]: 32 * SEQUENCE_WIDTH_LIMIT } })
    expect(isEmojiRendered(ok, family)).toBe(true)
    expect(isEmojiRendered(split, family)).toBe(false)
    expect(isEmojiRendered(edge, family)).toBe(true) // 경계값은 지원(초과만 미지원)
  })
  it('ZWJ가 없는 이모지(키캡 등)에는 폭 검사를 적용하지 않는다', () => {
    const keycap = '#️⃣'
    expect(isEmojiRendered(fakeProbe({ colored: [keycap], width: { '#️': 10, [keycap]: 40 } }), keycap)).toBe(true)
  })
})

describe('createEmojiChecker', () => {
  it('결과를 캐시해 같은 이모지는 다시 그리지 않는다', () => {
    let calls = 0
    const probe: EmojiProbe = { render: () => (calls++, new Uint8ClampedArray([1, 2, 3, 255])), measure: () => 32 }
    const check = createEmojiChecker(probe)!
    check('😀'); check('😀'); check('😀')
    expect(calls).toBe(2) // 검정·흰색 1회씩
  })
  it('프로브가 없으면 null', () => {
    expect(createEmojiChecker(null)).toBeNull()
  })
})

const entry = (char: string, name: string, keywords?: string): CharEntry => ({ char, name, keywords })
const sample: CharEntry[] = [
  entry('❤️', '빨간 하트', '사랑 love red heart'),
  entry('💔', '깨진 하트', '이별 broken heart'),
  entry('★', '검은 별'),
  entry('♥', '검은 하트'),
  entry('하트', '하트 모양 이름', ''),
  entry('→', '오른쪽 화살표', 'arrow right'),
]

describe('queryTokens', () => {
  it('공백으로 나누고 소문자로 바꾸며 빈 값은 버린다', () => {
    expect(queryTokens('  Red   HEART ')).toEqual(['red', 'heart'])
    expect(queryTokens('   ')).toEqual([])
  })
})

describe('searchEntries', () => {
  it('빈 검색어는 결과가 없다', () => {
    expect(searchEntries(sample, '  ')).toEqual({ entries: [], total: 0 })
  })
  it('이름·키워드(한/영)에 부분 일치한다', () => {
    expect(searchEntries(sample, '하트').entries.map((e) => e.char)).toEqual(['하트', '❤️', '💔', '♥'])
    expect(searchEntries(sample, 'love').entries.map((e) => e.char)).toEqual(['❤️'])
    expect(searchEntries(sample, 'ARROW').entries.map((e) => e.char)).toEqual(['→'])
  })
  it('토큰은 모두 일치해야 한다(AND)', () => {
    expect(searchEntries(sample, 'red heart').entries.map((e) => e.char)).toEqual(['❤️'])
    expect(searchEntries(sample, 'red arrow').entries).toEqual([])
  })
  it('점수순: 문자 일치 > 이름 일치 > 이름 시작 > 키워드', () => {
    const mixed = [entry('a', '별 모양', ''), entry('b', '노란 별', ''), entry('c', '반짝', '별빛'), entry('별', '이름이 다른 문자', ''), entry('d', '별', '')]
    // 문자 일치(별) > 이름 일치(별) > 이름 시작(별 모양) > 이름에 포함(노란 별) = 키워드(별빛)는 원래 순서
    expect(searchEntries(mixed, '별').entries.map((e) => e.char)).toEqual(['별', 'd', 'a', 'b', 'c'])
    expect(searchEntries(sample, '★').entries.map((e) => e.char)).toEqual(['★']) // 문자 자체로 검색
  })
  it('accept가 false인 항목은 결과와 개수에서 빠진다', () => {
    const r = searchEntries(sample, '하트', (e) => e.char !== '💔')
    expect(r.entries.some((e) => e.char === '💔')).toBe(false)
    expect(r.total).toBe(r.entries.length)
  })
  it('상한을 넘으면 앞쪽만 돌려주되 total은 전체 개수다', () => {
    const many = Array.from({ length: 10 }, (_, i) => entry(String(i), `별 ${i}`))
    const r = searchEntries(many, '별', () => true, 3)
    expect(r.entries).toHaveLength(3)
    expect(r.total).toBe(10)
    expect(SEARCH_LIMIT).toBeGreaterThanOrEqual(100)
  })
  it('실제 데이터: 「하트」「heart」「깃발 대한민국」「화살표」가 결과를 낸다', () => {
    const all: CharEntry[] = [
      ...SYMBOL_CATEGORIES.flatMap((c) => c.entries),
      ...groups.flatMap((g) => g.items.map(([char, name, keywords]) => ({ char, name, keywords, emoji: true as const }))),
    ]
    expect(searchEntries(all, '하트').total).toBeGreaterThan(20)
    expect(searchEntries(all, 'heart').total).toBeGreaterThan(20)
    expect(searchEntries(all, '화살표').entries.some((e) => e.char === '→')).toBe(true)
    expect(searchEntries(all, '깃발 대한민국').entries[0].char).toBe('🇰🇷')
    expect(searchEntries(all, 'south korea').entries.some((e) => e.char === '🇰🇷')).toBe(true)
    expect(searchEntries(all, '🇰🇷').entries[0].char).toBe('🇰🇷')
  })
})
