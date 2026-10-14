/**
 * 클립보드에 텍스트를 복사한다. 성공 여부를 돌려준다(예외를 던지지 않음).
 * Safari는 사용자 제스처 안에서 **동기적으로** 호출해야 쓰기를 허용하므로, 클릭 핸들러에서 await 없이 바로 호출한다.
 * Clipboard API는 HTTPS·localhost에서만 있어, 없거나 거부되면 `execCommand('copy')`로 대체한다.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 권한 거부·비포커스 등 → 폴백
    }
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  // 화면 밖에 두되 스크롤·줌이 튀지 않도록 고정 위치
  el.style.position = 'fixed'
  el.style.top = '0'
  el.style.left = '-9999px'
  el.style.opacity = '0'
  const active = document.activeElement as HTMLElement | null
  document.body.appendChild(el)
  try {
    el.select()
    el.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(el)
    active?.focus?.()
  }
}
