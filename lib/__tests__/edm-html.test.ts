import { describe, it, expect } from 'vitest'
import { generateHtmlCode, getDefaultGridConfig } from '@/lib/edm-utils'

// generateHtmlCode가 이미지 URL의 쿼리스트링(presigned ?X-Amz-...)을 제거하고
// 평문 URL만 <img src>에 넣는지 검증 (이메일 만료/서명 문제 방지)
describe('edm-utils generateHtmlCode 이미지 URL 출력', () => {
  const config = getDefaultGridConfig() // 3x3, 셀 id "1-1"~"3-3"

  function htmlFor(cellImages: Record<string, string>): string {
    return generateHtmlCode(config, cellImages, {}, 'left', 900, 1000)
  }

  it('presigned URL의 ? 이후(X-Amz-...)를 제거한 평문 URL을 출력한다', () => {
    const presigned =
      'http://127.0.0.1:19000/edms/k_123/cell_1-1_300x951.jpg' +
      '?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=604800&X-Amz-Signature=abc&x-id=GetObject'
    const html = htmlFor({ '1-1': presigned })

    expect(html).toContain(
      'src="http://127.0.0.1:19000/edms/k_123/cell_1-1_300x951.jpg"'
    )
    expect(html).not.toContain('X-Amz')
    expect(html).not.toContain('?')
  })

  it('쿼리스트링이 없는 평문 URL은 그대로 둔다', () => {
    const plain = 'http://127.0.0.1:19000/edms/k_123/cell_1-1.jpg'
    const html = htmlFor({ '1-1': plain })
    expect(html).toContain(`src="${plain}"`)
  })

  it('https 공개 URL도 쿼리스트링을 제거한다', () => {
    const html = htmlFor({
      '1-1': 'https://design5.pentasecurity.com/edms/k/cell_1-1.jpg?sig=x',
    })
    expect(html).toContain(
      'src="https://design5.pentasecurity.com/edms/k/cell_1-1.jpg"'
    )
    expect(html).not.toContain('sig=x')
  })
})
