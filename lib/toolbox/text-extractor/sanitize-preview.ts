/**
 * 문서 화면 미리보기(외부 라이브러리가 만든 DOM) 정리 — 문서에 든 악성 링크·삽입 HTML이 우리 사이트에서 실행되지 않도록.
 * - 스크립트·iframe·object·embed 등 실행 가능한 요소 제거
 * - on* 이벤트 속성 제거
 * - href/src는 안전한 주소만(http·https·mailto·#, 이미지는 data:image·blob:) — 그 밖(javascript: 등)은 제거
 * - 바깥 링크는 새 창 + opener 차단
 */
const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed', 'frame', 'frameset', 'base', 'meta', 'link', 'form']

const SAFE_HREF = /^(https?:|mailto:|#)/i
const SAFE_SRC = /^(data:image\/|blob:|https?:)/i

export function sanitizePreview(root: Element): void {
  for (const el of Array.from(root.querySelectorAll(BLOCKED_TAGS.join(',')))) el.remove()
  for (const el of Array.from(root.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      else if ((name === 'href' || name === 'xlink:href') && value !== '' && !SAFE_HREF.test(value)) el.removeAttribute(attr.name)
      else if (name === 'src' && !SAFE_SRC.test(value)) el.removeAttribute(attr.name)
      else if (name === 'srcdoc' || name === 'formaction') el.removeAttribute(attr.name)
    }
    if (el.tagName.toLowerCase() === 'a' && /^https?:/i.test(el.getAttribute('href') ?? '')) {
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
  }
}
