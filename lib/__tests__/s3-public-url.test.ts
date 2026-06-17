import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { publicUrlForPostsKey, publicUrlForEdmsKey } from '@/lib/s3/config'
import { s3ObjectKeyFromAnyPublicUrl } from '@/lib/s3/url-helpers'

// 버킷 인식형 공개 URL: {base 또는 endpoint}/{버킷}/{키}
describe('s3 버킷 인식형 공개 URL', () => {
  const ORIGINAL = {
    base: process.env.S3_PUBLIC_BASE_URL,
    endpoint: process.env.S3_ENDPOINT,
  }

  afterEach(() => {
    process.env.S3_PUBLIC_BASE_URL = ORIGINAL.base
    process.env.S3_ENDPOINT = ORIGINAL.endpoint
  })

  describe('S3_PUBLIC_BASE_URL = 순수 공개 도메인(버킷 미포함)', () => {
    beforeEach(() => {
      process.env.S3_PUBLIC_BASE_URL = 'https://design5.pentasecurity.com'
    })

    it('posts: {base}/posts/{키}', () => {
      expect(publicUrlForPostsKey('penta-design/Cyber_DID.jpg')).toBe(
        'https://design5.pentasecurity.com/posts/penta-design/Cyber_DID.jpg'
      )
    })

    it('eDM: {base}/edms/{키}', () => {
      expect(publicUrlForEdmsKey('1781657557702/cell_1-1_900x951.jpg')).toBe(
        'https://design5.pentasecurity.com/edms/1781657557702/cell_1-1_900x951.jpg'
      )
    })

    it('끝 슬래시는 정규화한다', () => {
      process.env.S3_PUBLIC_BASE_URL = 'https://design5.pentasecurity.com/'
      expect(publicUrlForPostsKey('a.jpg')).toBe(
        'https://design5.pentasecurity.com/posts/a.jpg'
      )
    })
  })

  describe('S3_PUBLIC_BASE_URL 비움 → 엔드포인트 path-style 폴백', () => {
    beforeEach(() => {
      process.env.S3_PUBLIC_BASE_URL = ''
      process.env.S3_ENDPOINT = 'http://127.0.0.1:19000'
    })

    it('posts: {endpoint}/posts/{키}', () => {
      expect(publicUrlForPostsKey('penta-design/x.jpg')).toBe(
        'http://127.0.0.1:19000/posts/penta-design/x.jpg'
      )
    })

    it('eDM: {endpoint}/edms/{키}', () => {
      expect(publicUrlForEdmsKey('k/cell.jpg')).toBe(
        'http://127.0.0.1:19000/edms/k/cell.jpg'
      )
    })
  })

  describe('URL → 키 역변환 (s3ObjectKeyFromAnyPublicUrl)', () => {
    beforeEach(() => {
      process.env.S3_PUBLIC_BASE_URL = 'https://design5.pentasecurity.com'
    })

    it('base + 버킷 세그먼트를 모두 제거해 키만 복원한다', () => {
      const url = 'https://design5.pentasecurity.com/posts/penta-design/x.jpg'
      expect(s3ObjectKeyFromAnyPublicUrl(url, 'posts')).toBe('penta-design/x.jpg')
    })

    it('publicUrlForPostsKey와 왕복(round-trip) 일치', () => {
      const key = 'penta-design/sample_123.jpg'
      const url = publicUrlForPostsKey(key)
      expect(s3ObjectKeyFromAnyPublicUrl(url, 'posts')).toBe(key)
    })
  })
})
