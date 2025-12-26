import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "견적 요청 | 전방 홈케어",
  description:
    "전방 홈케어 서비스 견적을 무료로 요청하세요. 제초, 조경, 청소, 시공 등 전원주택 관리에 필요한 모든 서비스를 상담받으실 수 있습니다.",
  openGraph: {
    title: "견적 요청 | 전방 홈케어",
    description:
      "전원주택 관리 서비스 무료 견적을 받아보세요. 전문 상담원이 친절하게 안내해 드립니다.",
    url: "https://geonbang.com/homecare/apply",
  },
  alternates: {
    canonical: "https://geonbang.com/homecare/apply",
  },
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
