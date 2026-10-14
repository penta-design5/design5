import { afterEach, describe, expect, it } from 'vitest'
import { COMPOSE_MAX_LENGTH, graphemeCount, insertAtSelection } from './compose'
import {
  EMPTY_HISTORY,
  FAVORITES_MAX,
  isFavorite,
  parseHistory,
  pushRecent,
  RECENT_MAX,
  serializeHistory,
  toggleFavorite,
  toStored,
  type StoredEntry,
} from './history'
import { HISTORY_STORAGE_KEY, loadHistory, saveHistory } from './storage'
import type { CharEntry } from './types'

const e = (char: string, extra: Partial<CharEntry> = {}): CharEntry => ({ char, name: `이름 ${char}`, ...extra })

describe('insertAtSelection', () => {
  it('커서 위치에 끼워 넣고 커서를 삽입 뒤로 옮긴다', () => {
    expect(insertAtSelection('AB', 1, 1, e('→'))).toEqual({ text: 'A→B', caret: 2 })
    expect(insertAtSelection('', 0, 0, e('★'))).toEqual({ text: '★', caret: 1 })
    expect(insertAtSelection('AB', 2, 2, e('★'))).toEqual({ text: 'AB★', caret: 3 })
  })
  it('선택 범위는 삽입 문자로 대체된다(역방향 선택도 동일)', () => {
    expect(insertAtSelection('ABCD', 1, 3, e('→'))).toEqual({ text: 'A→D', caret: 2 })
    expect(insertAtSelection('ABCD', 3, 1, e('→'))).toEqual({ text: 'A→D', caret: 2 })
  })
  it('범위를 벗어난·비정상 선택은 안전하게 보정한다', () => {
    expect(insertAtSelection('AB', 99, 99, e('★'))).toEqual({ text: 'AB★', caret: 3 })
    expect(insertAtSelection('AB', -5, -5, e('★'))).toEqual({ text: '★AB', caret: 1 })
    expect(insertAtSelection('AB', NaN, NaN, e('★'))).toEqual({ text: '★AB', caret: 1 })
  })
  it('텍스트 이모티콘은 앞 글자가 있고 공백으로 끝나지 않으면 공백 한 칸을 먼저 넣는다', () => {
    const k = e('^_^', { wide: true })
    expect(insertAtSelection('안녕', 2, 2, k)).toEqual({ text: '안녕 ^_^', caret: 6 })
    expect(insertAtSelection('안녕 ', 3, 3, k)).toEqual({ text: '안녕 ^_^', caret: 6 }) // 이미 공백
    expect(insertAtSelection('안녕\n', 3, 3, k)).toEqual({ text: '안녕\n^_^', caret: 6 }) // 개행도 공백으로 본다
    expect(insertAtSelection('', 0, 0, k)).toEqual({ text: '^_^', caret: 3 }) // 맨 앞은 공백 없음
    expect(insertAtSelection('★', 1, 1, e('☆'))).toEqual({ text: '★☆', caret: 2 }) // 일반 문자는 그대로 붙임
  })
  it('역슬래시·내부 공백이 있는 이모티콘도 그대로 삽입한다', () => {
    expect(insertAtSelection('', 0, 0, e('¯\\_(ツ)_/¯', { wide: true }))?.text).toBe('¯\\_(ツ)_/¯')
  })
  it('최대 길이를 넘으면 null, 정확히 최대면 허용', () => {
    expect(insertAtSelection('a'.repeat(COMPOSE_MAX_LENGTH), 0, 0, e('★'))).toBeNull()
    expect(insertAtSelection('a'.repeat(COMPOSE_MAX_LENGTH - 1), 0, 0, e('★'))).not.toBeNull()
    expect(insertAtSelection('a'.repeat(10), 10, 10, e('★'), 11)).not.toBeNull()
    expect(insertAtSelection('a'.repeat(10), 10, 10, e('★'), 10)).toBeNull()
  })
})

describe('graphemeCount', () => {
  it('이모지·결합 문자를 1글자로 센다', () => {
    expect(graphemeCount('')).toBe(0)
    expect(graphemeCount('abc')).toBe(3)
    expect(graphemeCount('👨‍👩‍👧‍👦')).toBe(1)
    expect(graphemeCount('🇰🇷')).toBe(1)
    expect(graphemeCount('한글★')).toBe(3)
  })
})

describe('pushRecent', () => {
  it('최근 것이 맨 앞, 이미 있으면 끌어올리고 중복을 만들지 않는다', () => {
    let r: StoredEntry[] = []
    r = pushRecent(r, e('a')); r = pushRecent(r, e('b')); r = pushRecent(r, e('c'))
    expect(r.map((x) => x.char)).toEqual(['c', 'b', 'a'])
    r = pushRecent(r, e('a'))
    expect(r.map((x) => x.char)).toEqual(['a', 'c', 'b'])
  })
  it(`최대 ${RECENT_MAX}개 — 가장 오래된 것부터 버린다`, () => {
    let r: StoredEntry[] = []
    for (let i = 0; i < RECENT_MAX + 5; i++) r = pushRecent(r, e(`x${i}`))
    expect(r).toHaveLength(RECENT_MAX)
    expect(r[0].char).toBe(`x${RECENT_MAX + 4}`)
    expect(r.some((x) => x.char === 'x0')).toBe(false)
  })
  it('원본 배열을 바꾸지 않고, 필요한 필드만 저장한다', () => {
    const before: StoredEntry[] = [{ char: 'a', name: 'A' }]
    const after = pushRecent(before, { char: 'b', name: 'B', keywords: '검색어', emoji: true })
    expect(before).toHaveLength(1)
    expect(after[0]).toEqual({ char: 'b', name: 'B', emoji: true }) // keywords 제외
    expect(toStored(e('k', { wide: true }))).toEqual({ char: 'k', name: '이름 k', wide: true })
  })
})

describe('toggleFavorite', () => {
  it('없으면 맨 뒤에 추가, 있으면 해제', () => {
    const a = toggleFavorite([], e('a'))
    expect(a).toEqual({ favorites: [{ char: 'a', name: '이름 a' }], action: 'added' })
    const b = toggleFavorite(a.favorites, e('b'))
    expect(b.favorites.map((f) => f.char)).toEqual(['a', 'b'])
    const c = toggleFavorite(b.favorites, e('a'))
    expect(c).toEqual({ favorites: [{ char: 'b', name: '이름 b' }], action: 'removed' })
    expect(isFavorite(c.favorites, 'a')).toBe(false)
    expect(isFavorite(c.favorites, 'b')).toBe(true)
  })
  it(`상한(${FAVORITES_MAX}) 이면 추가하지 않고 full, 해제는 가능`, () => {
    let f: StoredEntry[] = []
    for (let i = 0; i < FAVORITES_MAX; i++) f = toggleFavorite(f, e(`f${i}`)).favorites
    expect(f).toHaveLength(FAVORITES_MAX)
    const full = toggleFavorite(f, e('extra'))
    expect(full.action).toBe('full')
    expect(full.favorites).toHaveLength(FAVORITES_MAX)
    expect(toggleFavorite(f, e('f0')).action).toBe('removed')
  })
})

describe('parseHistory — 저장값 검증', () => {
  const good = { v: 1, recent: [{ char: '→', name: '오른쪽 화살표' }], favorites: [{ char: '😀', name: '웃는 얼굴', emoji: true }, { char: '^_^', name: '웃음', wide: true }] }
  it('정상 값은 그대로 복원(직렬화 왕복)', () => {
    const h = parseHistory(JSON.stringify(good))
    expect(h.recent).toEqual(good.recent)
    expect(h.favorites).toEqual(good.favorites)
    expect(parseHistory(serializeHistory(h))).toEqual(h)
  })
  it('null·빈 값·깨진 JSON·다른 버전·배열/숫자는 빈 기록', () => {
    for (const raw of [null, '', '{', 'null', '[]', '123', '"x"', JSON.stringify({ v: 2, recent: good.recent }), JSON.stringify({ recent: good.recent })]) {
      expect(parseHistory(raw), String(raw)).toEqual(EMPTY_HISTORY)
    }
  })
  it('잘못된 항목은 골라서 버리고 나머지는 살린다', () => {
    const bad = {
      v: 1,
      recent: [
        { char: 'a', name: 'ok' }, null, 5, 'x', { char: '', name: 'empty' }, { char: 'b' }, { name: 'n' },
        { char: 1, name: 'n' }, { char: 'c', name: '' }, { char: 'd', name: '  ' },
        { char: 'x'.repeat(100), name: 'long' }, { char: 'ctl\u0007', name: 'ctl' }, { char: 'new\nline', name: 'nl' },
        { char: 'n'.repeat(5), name: 'n'.repeat(500) }, { char: 'a', name: 'dup' }, { char: 'z', name: 'z', emoji: 'yes', wide: 1 },
      ],
      favorites: 'nope',
    }
    const h = parseHistory(JSON.stringify(bad))
    expect(h.recent.map((r) => r.char)).toEqual(['a', 'z'])
    expect(h.recent[1]).toEqual({ char: 'z', name: 'z' }) // emoji·wide는 정확히 true일 때만
    expect(h.favorites).toEqual([])
  })
  it('상한을 넘는 저장값은 잘라서 복원한다', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ char: `c${i}`, name: `n${i}` }))
    const h = parseHistory(JSON.stringify({ v: 1, recent: many(200), favorites: many(500) }))
    expect(h.recent).toHaveLength(RECENT_MAX)
    expect(h.favorites).toHaveLength(FAVORITES_MAX)
  })
  it('프로토타입 오염·특이 키가 있어도 일반 객체로만 복원한다', () => {
    const h = parseHistory('{"v":1,"recent":[{"char":"a","name":"A","__proto__":{"polluted":true},"constructor":"x"}],"favorites":[]}')
    expect(h.recent).toEqual([{ char: 'a', name: 'A' }])
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

/** 실행 환경에 따라 jsdom의 localStorage가 비어 있을 수 있어 메모리 저장소를 주입한다(watermark 테스트와 같은 방식) */
function installStorage(overrides: Partial<Storage> = {}) {
  const map = new Map<string, string>()
  const storage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    ...overrides,
  } as Storage
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
  return map
}

describe('loadHistory / saveHistory', () => {
  afterEach(() => installStorage())
  it('저장 → 불러오기 왕복, 키는 toolbox:special-characters:v1', () => {
    const map = installStorage()
    const history = { recent: [{ char: '★', name: '별' }], favorites: [{ char: '^_^', name: '웃음', wide: true as const }] }
    saveHistory(history)
    expect(map.has('toolbox:special-characters:v1')).toBe(true)
    expect(HISTORY_STORAGE_KEY).toBe('toolbox:special-characters:v1')
    expect(loadHistory()).toEqual(history)
  })
  it('저장소가 없거나 읽기·쓰기가 예외를 던져도 앱은 죽지 않는다', () => {
    installStorage({ getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('quota') } })
    expect(loadHistory()).toEqual(EMPTY_HISTORY)
    expect(() => saveHistory({ recent: [], favorites: [] })).not.toThrow()
  })
  it('깨진 저장값은 빈 기록으로 시작한다', () => {
    const map = installStorage()
    map.set('toolbox:special-characters:v1', '{broken')
    expect(loadHistory()).toEqual(EMPTY_HISTORY)
  })
})
