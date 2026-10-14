/**
 * TOOLBOX「특수 문자 및 이모티콘」 이모지 데이터 생성.
 *
 * `emojibase-data`(MIT, devDependency)의 한국어·영어 데이터에서 필요한 것만 뽑아
 * `lib/toolbox/special-characters/data/emoji.generated.json`(저장소에 커밋)로 만든다.
 * 패키지는 전 언어 포함 약 50MB라 앱 번들·Docker 이미지에 넣지 않고, 이 스크립트 결과만 쓴다.
 *
 * - 제외: 구성 요소(피부톤·머리 모양 단독), 그룹이 없는 항목(지역 지표 단독 문자 등), 피부톤 변형(기본 톤만)
 * - 항목: [이모지, 한글 이름, 검색 키워드(한글 태그 + 영어 이름·태그, 소문자)]
 *
 * 사용법(Unicode·emojibase 버전을 올릴 때만 다시 실행):
 *   npx tsx scripts/generate-emoji-data.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

interface RawEmoji {
  label: string
  hexcode: string
  tags?: string[]
  emoji: string
  group?: number
}

const require = createRequire(import.meta.url)
const root = join(require.resolve('emojibase-data/package.json'), '..')
const read = (locale: string) => JSON.parse(readFileSync(join(root, locale, 'data.json'), 'utf8')) as RawEmoji[]

// emojibase 그룹 번호 → 앱 카테고리(순서 = 표시 순서). 2(구성 요소)는 제외
const GROUPS: { source: number; id: string; label: string }[] = [
  { source: 0, id: 'smileys', label: '표정·감정' },
  { source: 1, id: 'people', label: '사람·몸' },
  { source: 3, id: 'animals', label: '동물·자연' },
  { source: 4, id: 'food', label: '음식·음료' },
  { source: 5, id: 'travel', label: '여행·장소' },
  { source: 6, id: 'activities', label: '활동' },
  { source: 7, id: 'objects', label: '사물' },
  { source: 8, id: 'symbols', label: '기호' },
  { source: 9, id: 'flags', label: '국기' },
]

const ko = read('ko')
const en = new Map(read('en').map((e) => [e.hexcode, e]))

const groups = GROUPS.map((g) => ({
  id: g.id,
  label: g.label,
  items: ko
    .filter((e) => e.group === g.source)
    .map((e) => {
      const enEntry = en.get(e.hexcode)
      const keywords = [...(e.tags ?? []), enEntry?.label ?? '', ...(enEntry?.tags ?? [])]
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
      // 중복 제거 후 공백으로 이어 붙임(검색은 부분 일치)
      return [e.emoji, e.label, [...new Set(keywords)].join(' ')]
    }),
}))

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }
const out = join(process.cwd(), 'lib/toolbox/special-characters/data/emoji.generated.json')
writeFileSync(out, JSON.stringify({ source: `emojibase-data@${pkg.version} (MIT)`, groups }) + '\n')
console.log(`${out}\n  ${groups.map((g) => `${g.label} ${g.items.length}`).join(' · ')}\n  총 ${groups.reduce((n, g) => n + g.items.length, 0)}개`)
