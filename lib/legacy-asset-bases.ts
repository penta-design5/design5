/**
 * 사내망: 공개 URL은 S3( MinIO / 게이트웨이) 베이스 + 선택적 추가.
 * DB에 옛 절대 URL이 남은 경우에만 LEGACY/EXTRA/백블레이즈 호스트 판별.
 */

function trimBase(s: string | undefined): string {
  if (!s) return ''
  return s.trim().replace(/\/$/, '')
}

/** NEXT_PUBLIC_S3 + (서버) S3_PUBLIC_BASE_URL + 쉼표로 나열된 추가 베이스 */
export function getPublicStorageBasePrefixes(): string[] {
  const fromExtra = process.env.NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES
  const out: string[] = []
  const s3c = trimBase(process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL)
  const s3s = typeof window === 'undefined' ? trimBase(process.env.S3_PUBLIC_BASE_URL) : ''
  for (const t of [s3c, s3s]) {
    if (t && !out.includes(t)) out.push(t)
  }
  if (fromExtra) {
    for (const s of fromExtra.split(/[,;\n]+/)) {
      const t = trimBase(s)
      if (t && !out.includes(t)) out.push(t)
    }
  }
  return out
}

export function urlStartsWithAnyPublicBase(url: string): boolean {
  if (!url || !url.startsWith('http')) return false
  return getPublicStorageBasePrefixes().some((b) => url.startsWith(b))
}

/**
 * DB에 남은 구 CDN 호스트(경로/hostname).
 * none|false|0 → 끄기.
 * 미설정 → **빈 배열(사내망 권장)**. 마이그레이션 중 옛 URL이 있으면 쉼표로 호스트를 명시.
 */
export function getLegacyCdnHostnames(): string[] {
  const raw = process.env.NEXT_PUBLIC_LEGACY_CDN_HOSTNAMES
  if (raw === 'none' || raw === 'false' || raw === '0') {
    return []
  }
  if (raw?.trim()) {
    return raw
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

function tryHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function urlHostIsLegacyCdn(url: string): boolean {
  const h = tryHost(url)
  if (!h) return false
  return getLegacyCdnHostnames().some((d) => h === d)
}

/**
 * Backblaze S3 API 스타일 (구 DB·임시 URL)
 */
export function getB2S3ApiHostSuffix(): string {
  return (process.env.NEXT_PUBLIC_B2_S3_API_HOST || process.env.B2_S3_API_HOST || 'backblazeb2.com')
    .trim()
    .toLowerCase()
}

export function urlLooksLikeBackblazeB2S3Url(url: string): boolean {
  const h = tryHost(url)
  if (!h) return false
  const suffix = getB2S3ApiHostSuffix()
  return h === suffix || h.endsWith(`.${suffix}`)
}

export function normalizeLayeraryStyleWorkerPath(url: string): string {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return url
  }
  const h = u.hostname.toLowerCase()
  if (!getLegacyCdnHostnames().includes(h)) return url
  const parts = u.pathname.split('/').filter(Boolean)
  if (parts.length > 1 && parts[0] === 'layerary') {
    u.pathname = '/' + parts.slice(1).join('/')
    return u.toString()
  }
  return url
}

/**
 * Next/Image unoptimized. none → 기본 없음(사내망).
 * 필요 시 호스트 쉼표로 명시(레거시 Worker만).
 */
export function getUnoptimizedImageLegacyHostnames(): string[] {
  const raw = process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGE_HOSTNAMES
  if (raw === 'none' || raw === 'false' || raw === '0') return []
  if (raw?.trim()) {
    return raw
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

export function urlHostNeedsUnoptimizedImage(url: string): boolean {
  const h = tryHost(url)
  if (!h) return false
  return getUnoptimizedImageLegacyHostnames().includes(h)
}
