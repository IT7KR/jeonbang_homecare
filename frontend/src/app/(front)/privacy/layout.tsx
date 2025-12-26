import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 전방 홈케어",
  description:
    "전방 홈케어의 개인정보처리방침입니다. 개인정보 수집, 이용, 보관 및 보호에 관한 정책을 확인하세요.",
  openGraph: {
    title: "개인정보처리방침 | 전방 홈케어",
    description: "전방 홈케어의 개인정보처리방침입니다.",
    url: "https://geonbang.com/homecare/privacy",
  },
  alternates: {
    canonical: "https://geonbang.com/homecare/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
