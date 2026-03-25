import type { Metadata } from "next";
import "./pretendard.css";
import "./globals.css";
import { Providers } from "./providers";
import {
  BRAND_KO,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_TITLE,
  SEO_KEYWORDS,
  getOrganizationJsonLd,
} from "@/lib/brand";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : new URL("https://layerary.com");

const jsonLd = getOrganizationJsonLd(baseUrl.toString());

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${BRAND_KO}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  icons: {
    icon: "/img/favicon.png",
  },
  // --- 네이버 및 기타 소유권 확인 섹션 추가 ---
  verification: {
    other: {
      "naver-site-verification":
        "e00d701407f773c78740d07c043fb6b0bf57c340",
    },
  },
  openGraph: {
    title: OG_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: baseUrl.toString(),
    siteName: BRAND_KO,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className="font-sans">
      <body className={`font-sans antialiased min-h-screen bg-background`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
