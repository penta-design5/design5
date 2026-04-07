/** 공식 브랜드 표기 — 메타·OG·구조화 데이터·UI에서 동일하게 사용 */

export const BRAND_KO = "디자인5";
export const BRAND_EN = "Design5";
/** 검색·스니펫용 병기 */
export const BRAND_DISPLAY = `${BRAND_EN}(${BRAND_KO})`;

export const SITE_TAGLINE = "펜타시큐리티 디자인 플랫폼";

/** 루트 기본 description — 한글 브랜드명 포함 */
export const DEFAULT_DESCRIPTION =
  "Design5(디자인5)는 펜타시큐리티의 디자인 작업물을 리뷰하고 리소스를 검색, 편집, 다운로드할 수 있는 중앙 집중식 플랫폼입니다.";

export const DEFAULT_TITLE = `${BRAND_EN} | ${SITE_TAGLINE}`;

export const OG_TITLE = `${BRAND_EN} | ${SITE_TAGLINE}`;

export const LOGO_ALT = `${BRAND_KO}(${BRAND_EN}) 로고`;

const KEYWORDS = [
  BRAND_KO,
  BRAND_EN,
  "펜타시큐리티",
  "Penta Security",
  "디자인 플랫폼",
] as const;

export const SEO_KEYWORDS = [...KEYWORDS];

/**
 * Organization + WebSite JSON-LD (@graph)
 * @param siteUrl 절대 URL (슬래시 없이 끝나도 됨)
 */
export function getOrganizationJsonLd(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "") || "https://layerary.com";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: BRAND_DISPLAY,
        alternateName: [BRAND_KO, BRAND_EN],
        inLanguage: "ko-KR",
        publisher: { "@id": `${base}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: BRAND_EN,
        alternateName: BRAND_KO,
        url: base,
        logo: `${base}/img/favicon.png`,
      },
    ],
  };
}
