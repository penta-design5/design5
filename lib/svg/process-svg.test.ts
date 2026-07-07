import { describe, it, expect } from 'vitest'
import { processSvgFile, SvgProcessingError, MAX_SVG_FILE_SIZE } from './process-svg'

function svgFile(content: string, name = 'icon.svg', type = 'image/svg+xml') {
  return new File([content], name, { type })
}

const VALID_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M4 4h16v16H4z" fill="#000"/></svg>'

describe('processSvgFile', () => {
  it('정상 SVG를 검증·정규화하여 메타데이터를 반환한다', async () => {
    const result = await processSvgFile({ file: svgFile(VALID_SVG, 'My Icon.svg') })

    expect(result.name).toBe('My Icon')
    expect(result.viewBox).toBe('0 0 24 24')
    expect(result.width).toBe(24)
    expect(result.height).toBe(24)
    expect(result.svgContent.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(result.svgContent).toContain('<path')
  })

  it('viewBox가 없으면 width/height로 viewBox를 생성한다', async () => {
    const noViewBox =
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32"><rect x="0" y="0" width="48" height="32"/></svg>'
    const result = await processSvgFile({ file: svgFile(noViewBox) })

    expect(result.viewBox).toBe('0 0 48 32')
    expect(result.width).toBe(48)
    expect(result.height).toBe(32)
  })

  it('<script> 등 위험 태그를 sanitize로 제거한다', async () => {
    const withScript =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><path d="M0 0h10v10H0z"/></svg>'
    const result = await processSvgFile({ file: svgFile(withScript) })

    expect(result.svgContent.toLowerCase()).not.toContain('<script')
    expect(result.svgContent).toContain('<path')
  })

  it('허용되지 않은 태그(image 등)는 sanitize가 통째로 제거한다', async () => {
    const withImage =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="https://evil.example/x.png"/><path d="M0 0h10v10H0z"/></svg>'
    const result = await processSvgFile({ file: svgFile(withImage) })

    expect(result.svgContent.toLowerCase()).not.toContain('<image')
    expect(result.svgContent).not.toContain('evil.example')
    expect(result.svgContent).toContain('<path')
  })

  it('허용 속성에 남은 외부 URL 참조(fill=url(http...))는 거부한다', async () => {
    const external =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z" fill="url(https://evil.example/x)"/></svg>'
    await expect(processSvgFile({ file: svgFile(external) })).rejects.toBeInstanceOf(
      SvgProcessingError
    )
  })

  it('SVG 확장자가 아니면 거부한다', async () => {
    await expect(
      processSvgFile({ file: svgFile(VALID_SVG, 'icon.png', 'image/png') })
    ).rejects.toBeInstanceOf(SvgProcessingError)
  })

  it('MIME 타입이 image/svg+xml이 아니면 거부한다', async () => {
    await expect(
      processSvgFile({ file: svgFile(VALID_SVG, 'icon.svg', 'text/plain') })
    ).rejects.toBeInstanceOf(SvgProcessingError)
  })

  it('256KB를 초과하면 거부한다', async () => {
    const huge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><!--${'a'.repeat(MAX_SVG_FILE_SIZE + 1)}--></svg>`
    await expect(processSvgFile({ file: svgFile(huge) })).rejects.toBeInstanceOf(
      SvgProcessingError
    )
  })

  it('SvgProcessingError는 BadRequestError(400)로 매핑된다', async () => {
    try {
      await processSvgFile({ file: svgFile(VALID_SVG, 'icon.txt', 'text/plain') })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(SvgProcessingError)
      expect((error as SvgProcessingError & { status: number }).status).toBe(400)
    }
  })
})
