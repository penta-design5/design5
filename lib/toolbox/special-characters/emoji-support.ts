/**
 * 이모지 표시 지원 감지 + 국기 폴리필 글꼴 준비.
 * - 현재 브라우저가 그리지 못하는 이모지(오래된 OS의 신규 이모지·Windows의 국기)는 목록에서 숨기기 위해 캔버스로 감지한다.
 * - Windows의 Chrome·Edge는 국기 그림이 없어 「KR」 같은 글자로 보이므로, 이때만 자체 호스팅 글꼴(Twemoji Country Flags)을 불러온다.
 *   글꼴·라이선스: public/font/TwemojiCountryFlags/ (그림은 Twemoji, CC BY 4.0 — 화면에 출처 표기)
 */

export const FLAG_FONT_NAME = 'Twemoji Country Flags'
export const FLAG_FONT_URL = '/font/TwemojiCountryFlags/TwemojiCountryFlags.woff2'
const FLAG_FONT_STYLE_ID = 'toolbox-twemoji-country-flags'

/** 이모지 칸·감지 캔버스가 함께 쓰는 글꼴 스택(국기 글꼴은 unicode-range로 국기에만 쓰인다) */
export const EMOJI_FONT_FAMILY = `"${FLAG_FONT_NAME}", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`

/** ZWJ 시퀀스가 미지원이면 구성 요소가 따로 그려져 폭이 첫 요소의 몇 배가 된다 — 이 배수를 넘으면 미지원으로 본다 */
export const SEQUENCE_WIDTH_LIMIT = 1.5

const ZWJ = '‍'

/** 감지에 필요한 그리기 동작(테스트에서 가짜로 바꿀 수 있게 분리) */
export interface EmojiProbe {
  /** 텍스트를 지정한 색으로 그린 픽셀(RGBA). 아무것도 그려지지 않으면 null */
  render(text: string, fill: string): Uint8ClampedArray | null
  measure(text: string): number
}

function sameBytes(a: Uint8ClampedArray, b: Uint8ClampedArray): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/**
 * 오래된 BMP 기호 이모지(기호 1개, 선택적으로 U+FE0F — 예: ♀️ ♂️ ⚕️ ❤️)인지.
 * 모든 OS가 지원하는 글리프라 「미지원」 위험이 없고, Apple 같은 글꼴은 이 중 일부를 **단색**으로 그려
 * 컬러 판정을 통과하지 못하므로(오탐) 컬러 검사에서 제외한다.
 */
function isLegacySymbolEmoji(emoji: string): boolean {
  const cps = Array.from(emoji)
  if (cps.length > 2 || (cps.length === 2 && cps[1] !== '\uFE0F')) return false
  return (cps[0].codePointAt(0) ?? 0) < 0x10000
}

/**
 * 컬러 이모지로 그려지는지 판정한다.
 * 0) 아무것도 그려지지 않으면 미지원. 오래된 BMP 기호 이모지는 여기까지만 본다.
 * 1) 검정·흰색으로 각각 그려 **픽셀이 같으면** 글꼴 자체의 색(컬러 글리프). 다르면 글자색을 따르는 대체 글리프(네모·「KR」 같은 글자)라 미지원.
 * 2) ZWJ 시퀀스는 미지원이면 낱개 이모지가 나란히 그려져도 (1)을 통과하므로, 폭이 첫 요소의 {@link SEQUENCE_WIDTH_LIMIT}배를 넘으면 미지원.
 */
export function isEmojiRendered(probe: EmojiProbe, emoji: string): boolean {
  const black = probe.render(emoji, '#000')
  if (!black) return false
  if (isLegacySymbolEmoji(emoji)) return true
  const white = probe.render(emoji, '#fff')
  if (!white || !sameBytes(black, white)) return false
  if (emoji.includes(ZWJ)) {
    const first = probe.measure(emoji.split(ZWJ)[0])
    if (first > 0 && probe.measure(emoji) > first * SEQUENCE_WIDTH_LIMIT) return false
  }
  return true
}

const PROBE_SIZE = 32

function createCanvasProbe(): EmojiProbe | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = PROBE_SIZE * 2
  canvas.height = PROBE_SIZE + 8
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.font = `${PROBE_SIZE}px ${EMOJI_FONT_FAMILY}`
  ctx.textBaseline = 'top'
  return {
    render(text, fill) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = fill
      ctx.fillText(text, 2, 2)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return data
      return null
    },
    measure: (text) => ctx.measureText(text).width,
  }
}

export type EmojiChecker = (emoji: string) => boolean

/** 결과를 캐시하는 감지 함수. 캔버스를 쓸 수 없으면 null(호출 쪽에서 전부 표시) */
export function createEmojiChecker(probe: EmojiProbe | null = createCanvasProbe()): EmojiChecker | null {
  if (!probe) return null
  const cache = new Map<string, boolean>()
  return (emoji) => {
    let ok = cache.get(emoji)
    if (ok === undefined) {
      ok = isEmojiRendered(probe, emoji)
      cache.set(emoji, ok)
    }
    return ok
  }
}

function injectFlagFont() {
  if (document.getElementById(FLAG_FONT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = FLAG_FONT_STYLE_ID
  // 국기(지역 지표 쌍·검은 깃발·태그 문자)에만 적용되는 범위
  style.textContent = `@font-face {
  font-family: "${FLAG_FONT_NAME}";
  unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
  src: url('${FLAG_FONT_URL}') format('woff2');
  font-display: swap;
}`
  document.head.appendChild(style)
}

/**
 * 이모지 표시 준비. 일반 이모지는 그리는데 국기만 못 그리는 환경(Windows Chrome·Edge)이면 국기 글꼴을 불러온 뒤 감지 함수를 새로 만든다.
 * 캔버스를 쓸 수 없으면 모든 이모지를 표시한다(true 반환 함수).
 */
export async function prepareEmojiRendering(): Promise<{ isSupported: EmojiChecker; flagFontLoaded: boolean }> {
  let checker = createEmojiChecker()
  if (!checker) return { isSupported: () => true, flagFontLoaded: false }
  let flagFontLoaded = false
  if (!checker('\u{1F1E8}\u{1F1ED}') && checker('\u{1F60A}')) {
    injectFlagFont()
    try {
      await document.fonts.load(`${PROBE_SIZE}px "${FLAG_FONT_NAME}"`, '\u{1F1E8}\u{1F1ED}')
      flagFontLoaded = true
    } catch {
      // 글꼴을 못 받으면 국기는 감지에서 미지원으로 걸러져 숨겨진다
    }
    checker = createEmojiChecker() ?? checker
  }
  return { isSupported: checker, flagFontLoaded }
}
