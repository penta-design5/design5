import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  getLegacyCdnHostnames,
  urlStartsWithAnyPublicBase,
  urlHostIsLegacyCdn,
  urlLooksLikeBackblazeB2S3Url,
} from '@/lib/legacy-asset-bases'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('legacy-asset-bases', () => {
  describe('getLegacyCdnHostnames', () => {
    it('미설정이면 빈 배열(사내망 기본)', () => {
      expect(getLegacyCdnHostnames()).toEqual([])
    })

    it('"none"이면 빈 배열', () => {
      vi.stubEnv('NEXT_PUBLIC_LEGACY_CDN_HOSTNAMES', 'none')
      expect(getLegacyCdnHostnames()).toEqual([])
    })

    it('쉼표로 구분된 호스트를 소문자로 파싱한다', () => {
      vi.stubEnv('NEXT_PUBLIC_LEGACY_CDN_HOSTNAMES', 'A.example.com, B.example.com')
      expect(getLegacyCdnHostnames()).toEqual(['a.example.com', 'b.example.com'])
    })
  })

  describe('urlStartsWithAnyPublicBase', () => {
    it('설정된 공개 베이스로 시작하면 true', () => {
      vi.stubEnv('NEXT_PUBLIC_S3_PUBLIC_BASE_URL', 'https://s3.internal/bucket')
      expect(urlStartsWithAnyPublicBase('https://s3.internal/bucket/posts/x.png')).toBe(true)
    })

    it('베이스와 무관한 URL은 false', () => {
      vi.stubEnv('NEXT_PUBLIC_S3_PUBLIC_BASE_URL', 'https://s3.internal/bucket')
      expect(urlStartsWithAnyPublicBase('https://other.com/x.png')).toBe(false)
    })

    it('http가 아닌 값은 false', () => {
      expect(urlStartsWithAnyPublicBase('/relative/path.png')).toBe(false)
    })
  })

  describe('urlHostIsLegacyCdn', () => {
    it('레거시 호스트와 정확히 일치하면 true', () => {
      vi.stubEnv('NEXT_PUBLIC_LEGACY_CDN_HOSTNAMES', 'cdn.old.com')
      expect(urlHostIsLegacyCdn('https://cdn.old.com/a.png')).toBe(true)
      expect(urlHostIsLegacyCdn('https://new.com/a.png')).toBe(false)
    })
  })

  describe('urlLooksLikeBackblazeB2S3Url', () => {
    it('기본 suffix(backblazeb2.com)를 인식한다', () => {
      expect(urlLooksLikeBackblazeB2S3Url('https://x.s3.us-west.backblazeb2.com/k')).toBe(true)
    })

    it('관련 없는 호스트는 false', () => {
      expect(urlLooksLikeBackblazeB2S3Url('https://example.com/k')).toBe(false)
    })
  })
})
