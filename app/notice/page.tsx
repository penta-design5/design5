import type { Metadata } from "next"
import { SiteNoticeView } from "@/components/notice/SiteNoticeView"
import { getSiteNoticeConfig } from "@/lib/site-notice"
import { BRAND_EN } from "@/lib/brand"

export async function generateMetadata(): Promise<Metadata> {
  const config = getSiteNoticeConfig()
  return {
    title: config.title,
    description: "서비스 안내 페이지입니다.",
    robots: { index: false, follow: false },
    openGraph: {
      title: `${config.title} | ${BRAND_EN}`,
    },
  }
}

export default function SiteNoticePage() {
  const config = getSiteNoticeConfig()
  return <SiteNoticeView config={config} />
}
