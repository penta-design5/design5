import type { CharCategory } from '../types'
import { prepareEmojiRendering, type EmojiChecker } from '../emoji-support'

interface EmojiDataFile {
  source: string
  groups: { id: string; label: string; items: [emoji: string, name: string, keywords: string][] }[]
}

export interface EmojiCatalog {
  categories: CharCategory[]
  /** 현재 브라우저가 그릴 수 있는 이모지인지(캐시됨) */
  isSupported: EmojiChecker
  /** 국기 폴리필 글꼴을 불러왔는지(출처 표기 대상) */
  flagFontLoaded: boolean
}

let cached: Promise<EmojiCatalog> | null = null

/**
 * 이모지 카탈로그 로드(한 번만). 데이터 JSON(약 240KB)은 이 시점에 따로 불러와 첫 화면 번들에 넣지 않는다.
 * 데이터 갱신: `npx tsx scripts/generate-emoji-data.ts`
 */
export function loadEmojiCatalog(): Promise<EmojiCatalog> {
  cached ??= (async () => {
    const [data, rendering] = await Promise.all([import('./emoji.generated.json'), prepareEmojiRendering()])
    const file = data as unknown as EmojiDataFile
    return {
      categories: file.groups.map((g) => ({
        id: g.id,
        label: g.label,
        entries: g.items.map(([char, name, keywords]) => ({ char, name, keywords, emoji: true as const })),
      })),
      isSupported: rendering.isSupported,
      flagFontLoaded: rendering.flagFontLoaded,
    }
  })().catch((e) => {
    cached = null // 실패하면 다음 시도에서 다시 불러온다
    throw e
  })
  return cached
}
