import DOMPurify from 'isomorphic-dompurify'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 기존 플레인 텍스트 의뢰 내용을 TipTap HTML로 변환 */
export function legacyPlainTextToTipTapHtml(text: string): string {
  const raw = text.replace(/\r\n/g, '\n')
  if (!raw.trim()) return ''
  const blocks = raw.split(/\n{2,}/)
  return blocks
    .map((block) => {
      const inner = escapeHtml(block).replace(/\n/g, '<br>')
      return `<p>${inner}</p>`
    })
    .join('')
}

/** TipTap 등으로 저장된 HTML인지 대략 판별 */
export function isProbablyRichHtml(content: string): boolean {
  const t = content.trimStart()
  return t.startsWith('<') && /<\/?[a-z][\s\S]*>/i.test(t)
}

/** 폼 검증: 태그 제거 후 비어 있으면 true */
export function isDesignRequestContentEmpty(html: string): boolean {
  if (!html || !html.trim()) return true
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length === 0
}

/** span style: color·font-size만 허용 (세미콜론으로 구분된 복합 선언) */
function isSafeDesignRequestSpanStyle(style: string): boolean {
  const trimmed = style.trim().replace(/\s+/g, ' ')
  if (!trimmed) return false
  if (/\b(expression|url\s*\(|javascript:|@import|behavior\s*:)/i.test(trimmed)) {
    return false
  }
  const parts = trimmed
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return false
  const colorDecl =
    /^color:\s*(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]{1,40})$/i
  const fontSizeDecl = /^font-size:\s*[\d.]+(px|em|rem)$/i
  for (const part of parts) {
    if (!colorDecl.test(part) && !fontSizeDecl.test(part)) return false
  }
  return true
}

let purifyStyleHooked = false

function ensureDesignRequestPurifyHooks(): void {
  if (purifyStyleHooked) return
  purifyStyleHooked = true
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName !== 'style') return
    const tag = node.nodeName
    const v = String(data.attrValue || '')
      .trim()
      .replace(/\s+/g, ' ')
    if (/\b(expression|url\s*\(|javascript:|@import|behavior\s*:)/i.test(v)) {
      data.keepAttr = false
      return
    }
    if (tag === 'P') {
      const ok = /^margin-left:\s*[\d.]+em(\s*;)?$/i.test(v)
      if (!ok) data.keepAttr = false
      return
    }
    if (tag === 'SPAN') {
      if (!isSafeDesignRequestSpanStyle(v)) data.keepAttr = false
      return
    }
    data.keepAttr = false
  })
}

/** 상세 화면용: 스크립트·위험 마크업 제거 후 HTML 반환 */
export function sanitizeDesignRequestHtml(dirty: string): string {
  ensureDesignRequestPurifyHooks()
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'span'],
    ALLOWED_ATTR: ['style', 'data-indent'],
  })
}
