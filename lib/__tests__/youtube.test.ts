import { describe, it, expect } from 'vitest'
import {
  extractYouTubeId,
  parseYouTubeUrl,
  youTubeEmbedUrl,
  youTubeThumbnailUrl,
} from '@/lib/youtube'

const ID = 'dQw4w9WgXcQ' // 유효한 11자 형식 예시

describe('youtube', () => {
  describe('extractYouTubeId', () => {
    it.each([
      ['watch', `https://www.youtube.com/watch?v=${ID}`],
      ['watch(추가 파라미터)', `https://www.youtube.com/watch?v=${ID}&t=42s&list=abc`],
      ['youtu.be', `https://youtu.be/${ID}`],
      ['youtu.be(쿼리)', `https://youtu.be/${ID}?t=10`],
      ['shorts', `https://www.youtube.com/shorts/${ID}`],
      ['embed', `https://www.youtube.com/embed/${ID}`],
      ['/v/', `https://www.youtube.com/v/${ID}`],
      ['m.youtube', `https://m.youtube.com/watch?v=${ID}`],
      ['nocookie', `https://www.youtube-nocookie.com/embed/${ID}`],
      ['프로토콜 없는 www', new URL(`https://www.youtube.com/watch?v=${ID}`).toString()],
      ['videoId 직접', ID],
      ['공백 포함', `  https://youtu.be/${ID}  `],
    ])('%s 형식에서 videoId를 추출한다', (_label, url) => {
      expect(extractYouTubeId(url)).toBe(ID)
    })

    it.each([
      ['빈 문자열', ''],
      ['유튜브 아닌 URL', 'https://example.com/watch?v=abc'],
      ['잘못된 문자열', 'not a url'],
      ['videoId 길이 불일치', 'https://youtu.be/tooShort'],
      ['도메인만', 'https://www.youtube.com/'],
    ])('%s 는 null 을 반환한다', (_label, url) => {
      expect(extractYouTubeId(url)).toBeNull()
    })
  })

  describe('parseYouTubeUrl', () => {
    it('유효한 URL을 파싱해 재생/썸네일 정보를 구성한다', () => {
      const parsed = parseYouTubeUrl(`https://youtu.be/${ID}?t=5`)
      expect(parsed).toEqual({
        videoId: ID,
        watchUrl: `https://www.youtube.com/watch?v=${ID}`,
        embedUrl: `https://www.youtube.com/embed/${ID}`,
        thumbnailUrl: `https://img.youtube.com/vi/${ID}/maxresdefault.jpg`,
      })
    })

    it('무효한 입력은 null 을 반환한다', () => {
      expect(parseYouTubeUrl('https://example.com')).toBeNull()
    })
  })

  describe('url helpers', () => {
    it('embed URL을 구성한다', () => {
      expect(youTubeEmbedUrl(ID)).toBe(`https://www.youtube.com/embed/${ID}`)
    })

    it('썸네일 URL을 화질별로 구성한다', () => {
      expect(youTubeThumbnailUrl(ID)).toBe(`https://img.youtube.com/vi/${ID}/maxresdefault.jpg`)
      expect(youTubeThumbnailUrl(ID, 'hqdefault')).toBe(
        `https://img.youtube.com/vi/${ID}/hqdefault.jpg`
      )
    })
  })
})
