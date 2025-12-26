import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/hooks/useConfirm";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateLocalBusinessSchema,
} from "@/lib/seo/schemas";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "전방 홈케어 - 전원주택 관리의 새로운 기준",
  description:
    "전방 홈케어는 전원주택 관리 전문 서비스입니다. 제초, 조경, 청소, 시공까지 원스톱으로 제공합니다.",
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
      "전원주택 관리 전문 서비스. 제초, 조경, 청소, 시공까지 원스톱으로 제공합니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "전방 홈케어",
    url: "https://geonbang.com/homecare",
    images: [
      {
        url: "https://geonbang.com/homecare/og-image.png",
        width: 1200,
        height: 630,
        alt: "전방 홈케어 - 전원주택 관리의 새로운 기준",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "전방 홈케어 - 전원주택 관리의 새로운 기준",
    description:
      "전원주택 관리 전문 서비스. 제초, 조경, 청소, 시공까지 원스톱으로 제공합니다.",
    images: ["https://geonbang.com/homecare/og-image.png"],
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
            __html: JSON.stringify([
              generateOrganizationSchema(),
              generateWebSiteSchema(),
              generateLocalBusinessSchema(),
            ]),
          }}
        />
      </head>
      <body className={`${geistMono.variable} antialiased font-pretendard`}>
        <QueryProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
