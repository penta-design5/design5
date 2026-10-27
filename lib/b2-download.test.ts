import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadFile, downloadFileWithRange } from './b2'
import { BadRequestError } from './api/errors'

/**
 * downloadFile SSRF 방지: S3 미설정 환경에서 fetch 경로로 가는 주소는
 * 공개 저장소 베이스·레거시 CDN·B2 호스트만 허용한다.
 */
describe('downloadFile 허용 주소', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv('S3_ENDPOINT', '')
    vi.stubEnv('S3_PUBLIC_BASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_S3_PUBLIC_BASE_URL', 'https://design6.pentasecurity.com')
    vi.stubEnv('NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES', 'https://assets.example.org/files')
    vi.stubEnv('NEXT_PUBLIC_LEGACY_CDN_HOSTNAMES', 'cdn.legacy.example')
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it.each([
    'http://192.168.1.43:9000/posts/a.png',
    'http://169.254.169.254/latest/meta-data/',
    'http://localhost:3000/api/admin/users',
    'https://example.com/a.png',
    'https://design6.pentasecurity.com.evil.example/a.png',
    'https://assets.example.org/files-other/a.png',
    'file:///etc/passwd',
    'not a url',
  ])('차단: %s', async (url) => {
    await expect(downloadFile(url)).rejects.toBeInstanceOf(BadRequestError)
    await expect(downloadFileWithRange(url, 0, 10)).rejects.toBeInstanceOf(BadRequestError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    'https://design6.pentasecurity.com/posts/ci-bi/a.svg',
    'https://assets.example.org/files/a.png',
    'https://cdn.legacy.example/layerary/a.png',
    'https://f005.backblazeb2.com/file/bucket/a.png',
  ])('허용: %s', async (url) => {
    const { contentType } = await downloadFile(url)
    expect(contentType).toBe('text/plain')
    expect(fetchMock).toHaveBeenCalledWith(url, expect.anything())
  })
})
