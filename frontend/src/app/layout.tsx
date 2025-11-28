import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "전방 홈케어 - 전원주택 관리의 새로운 기준",
  description:
    "전방 홈케어는 양평, 가평 지역 전원주택 관리 전문 서비스입니다. 제초, 조경, 청소, 시공까지 원스톱으로 제공합니다.",
  keywords: [
    "전방 홈케어",
    "전원주택 관리",
    "양평 홈케어",
    "가평 홈케어",
    "정원 관리",
    "제초",
    "조경",
    "전원주택",
    "홈케어",
    "주택관리",
  ],
  authors: [{ name: "전방" }],
  creator: "전방",
  openGraph: {
    title: "전방 홈케어 - 전원주택 관리의 새로운 기준",
    description:
      "전원주택의 모든 관리를 원스톱으로. 전방 홈케어와 함께하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "전방 홈케어",
    url: "https://geonbang.com/homecare",
  },
  twitter: {
    card: "summary_large_image",
    title: "전방 홈케어 - 전원주택 관리의 새로운 기준",
    description:
      "전원주택의 모든 관리를 원스톱으로. 전방 홈케어와 함께하세요.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://geonbang.com/homecare",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "전방 홈케어",
              description: "전원주택 관리 전문 서비스",
              telephone: "031-797-4004",
              address: {
                "@type": "PostalAddress",
                addressRegion: "경기도",
                addressLocality: "양평군",
              },
              areaServed: ["양평", "가평"],
            }),
          }}
        />
      </head>
      <body className={`${geistMono.variable} antialiased font-pretendard`}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
