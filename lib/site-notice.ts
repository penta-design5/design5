import { BRAND_EN, BRAND_KO } from "@/lib/brand"

/** `SITE_NOTICE_MODE`: `true` | `1` | `on` 이면 공지 모드 (미들웨어에서 다른 경로 차단) */
export function isSiteNoticeMode(): boolean {
  const v = process.env.SITE_NOTICE_MODE?.trim().toLowerCase()
  return v === "true" || v === "1" || v === "on"
}

export type SiteNoticeHighlight =
  | {
      kind: "comparison"
      beforeBadge: string
      beforeText: string
      afterBadge: string
      afterText: string
      /** 있으면 변경 후 값을 링크로 표시 */
      afterHref?: string
    }
  | {
      kind: "callout"
      /** 강조 박스 안 제목 (선택) */
      title?: string
      lines: string[]
    }

export type SiteNoticeCta = {
  label: string
  href: string
  external?: boolean
}

export type SiteNoticeConfig = {
  eyebrow?: string
  title: string
  /** 본문 상단 설명 (문단별) */
  descriptionParagraphs: string[]
  /** 주요 공지 블록 (비교 카드·콜아웃 등) */
  highlight: SiteNoticeHighlight | null
  /** 하단 안내 문단 (선택) */
  footerParagraphs?: string[]
  primaryCta?: SiteNoticeCta
  secondaryCta?: SiteNoticeCta
}

const DEFAULT_PARAGRAPH_SEP = "|||"

/**
 * 공지 문구는 기본값 + 환경 변수로 덮어쓰기 가능합니다.
 * - `SITE_NOTICE_TITLE`, `SITE_NOTICE_EYEBROW`
 * - `SITE_NOTICE_DESCRIPTION`: 문단 구분 `|||`
 * - `SITE_NOTICE_FOOTER`: 문단 구분 `|||`
 * 강조 블록(highlight)은 코드에서만 수정하거나, 이후 확장 시 JSON 등으로 분리하면 됩니다.
 */
const DEFAULT_SITE_NOTICE: SiteNoticeConfig = {
  eyebrow: BRAND_EN,
  title: "도메인 변경 안내",
  descriptionParagraphs: [
    "보다 나은 서비스 제공을 위해 사이트 주소(도메인)를 변경합니다.",
    "주소 변경 작업 기간 동안 사이트 서비스를 잠정 중단합니다.",
  ],
  highlight: {
    kind: "comparison",
    beforeBadge: "기존",
    beforeText: "layerary.com",
    afterBadge: "변경",
    afterText: "design5.pentasecurity.com",
    // 링크가 필요할 경우 사용함 (새 도메인 주소가 없으면 사용하지 않음)
    // afterHref: "https://design5.pentasecurity.com",
  },
  footerParagraphs: [
    "즐겨찾기에 등록해 두신 주소가 있을 경우 새 주소로 변경해 주시면 \n앞으로도 변함없이 서비스를 이용하실 수 있습니다.",
  ],
  primaryCta: {
    label: "새 사이트로 이동",
    href: "https://design5.pentasecurity.com",
    external: true,
  },
}

function parseParagraphs(raw: string | undefined): string[] | null {
  if (raw == null || raw.trim() === "") return null
  return raw.split(DEFAULT_PARAGRAPH_SEP).map((s) => s.trim()).filter(Boolean)
}

export function getSiteNoticeConfig(): SiteNoticeConfig {
  const desc = parseParagraphs(process.env.SITE_NOTICE_DESCRIPTION)
  const foot = parseParagraphs(process.env.SITE_NOTICE_FOOTER)

  return {
    ...DEFAULT_SITE_NOTICE,
    eyebrow:
      process.env.SITE_NOTICE_EYEBROW?.trim() || DEFAULT_SITE_NOTICE.eyebrow,
    title: process.env.SITE_NOTICE_TITLE?.trim() || DEFAULT_SITE_NOTICE.title,
    descriptionParagraphs:
      desc && desc.length > 0
        ? desc
        : DEFAULT_SITE_NOTICE.descriptionParagraphs,
    highlight: DEFAULT_SITE_NOTICE.highlight,
    footerParagraphs:
      foot && foot.length > 0
        ? foot
        : DEFAULT_SITE_NOTICE.footerParagraphs,
    primaryCta: DEFAULT_SITE_NOTICE.primaryCta,
    secondaryCta: DEFAULT_SITE_NOTICE.secondaryCta,
  }
}
