import type { Metadata } from "next";
import "./pretendard.css";
import "./globals.css";
import { Providers } from "./providers";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : new URL("https://layerary.com");

const title = "LAYERARY";
const description =
  "펜타시큐리티의 디자인 작업물을 리뷰하고 리소스를 검색, 편집, 다운로드할 수 있는 중앙 집중식 플랫폼";

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title,
  description,
  icons: {
    icon: "/img/favicon.png",
  },
  openGraph: {
    title: "LAYERARY | 펜타시큐리티 디자인 플랫폼",
    description,
    url: baseUrl.toString(),
    siteName: "LAYERARY",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LAYERARY | 펜타시큐리티 디자인 플랫폼",
    description,
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
        <Providers>{children}</Providers></body>
    </html>
  );
}

