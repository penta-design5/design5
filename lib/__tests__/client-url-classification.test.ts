import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isB2StorageUrlForClient,
  isB2WorkerUrl,
  getB2ImageSrc,
} from '@/lib/b2-client-url'
import { isKnownPublicAssetBaseUrl } from '@/lib/public-asset-url'

// 클라이언트 URL 분류는 env 기반(DB 비의존). Phase 3 스토리지 통합에 앞서 현재 동작을 고정한다.
describe('클라이언트 스토리지 URL 분류', () => {
  const BASE = 'https://design5.pentasecurity.com'
  const ORIGINAL = {
    base: process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL,
    legacy: process.env.NEXT_PUBLIC_LEGACY_CDN_HOSTNAMES,
    extra: process.env.NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES,
  }

  beforeEach(() => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = BASE
    delete process.env.NEXT_PUBLIC_LEGACY_CDN_HOSTNAMES
    delete process.env.NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = ORIGINAL.base
    process.env.NEXT_PUBLIC_LEGACY_CDN_HOSTNAMES = ORIGINAL.legacy
    process.env.NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES = ORIGINAL.extra
  })

  describe('isKnownPublicAssetBaseUrl', () => {
    it('공개 베이스로 시작하는 URL은 true', () => {
      expect(isKnownPublicAssetBaseUrl(`${BASE}/posts/x.jpg`)).toBe(true)
    })
    it('베이스 밖 URL은 false', () => {
      expect(isKnownPublicAssetBaseUrl('https://example.com/a.jpg')).toBe(false)
    })
    it('http가 아니면 false', () => {
      expect(isKnownPublicAssetBaseUrl('/local/a.jpg')).toBe(false)
      expect(isKnownPublicAssetBaseUrl('')).toBe(false)
    })
  })

  describe('isB2StorageUrlForClient', () => {
    it('공개 베이스 URL은 true', () => {
      expect(isB2StorageUrlForClient(`${BASE}/edms/a.jpg`)).toBe(true)
    })
    it('Backblaze S3 호스트는 true(레거시 DB URL 대비)', () => {
      expect(isB2StorageUrlForClient('https://s3.us-west.backblazeb2.com/b/k.jpg')).toBe(true)
    })
    it('무관한 호스트는 false', () => {
      expect(isB2StorageUrlForClient('https://example.com/a.jpg')).toBe(false)
    })
    it('빈 값/비문자열은 false', () => {
      expect(isB2StorageUrlForClient('')).toBe(false)
      // @ts-expect-error 런타임 방어 동작 확인
      expect(isB2StorageUrlForClient(null)).toBe(false)
    })
  })

  describe('isB2WorkerUrl', () => {
    it('http가 아니면 false', () => {
      expect(isB2WorkerUrl('/local.png')).toBe(false)
    })
    it('공개 베이스 URL은 true', () => {
      expect(isB2WorkerUrl(`${BASE}/posts/a.jpg`)).toBe(true)
    })
  })

  describe('getB2ImageSrc', () => {
    it('placeholder/빈 값은 placeholder 반환', () => {
      expect(getB2ImageSrc('')).toBe('/placeholder.png')
      expect(getB2ImageSrc('/placeholder.png')).toBe('/placeholder.png')
    })
    it('공개 베이스 URL은 그대로 사용', () => {
      const url = `${BASE}/posts/a.jpg`
      expect(getB2ImageSrc(url)).toBe(url)
    })
    it('Backblaze 직접 URL은 /api/posts/images 프록시로 변환', () => {
      const url = 'https://s3.us-west.backblazeb2.com/b/k.jpg'
      expect(getB2ImageSrc(url)).toBe(`/api/posts/images?url=${encodeURIComponent(url)}`)
    })
    it('분류 불가한 URL은 원본 그대로 반환', () => {
      expect(getB2ImageSrc('https://example.com/a.jpg')).toBe('https://example.com/a.jpg')
    })
  })
})
