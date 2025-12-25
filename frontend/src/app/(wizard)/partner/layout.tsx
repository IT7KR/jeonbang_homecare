import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "협력사 등록 | 전방 홈케어",
  description:
    "전방 홈케어 협력사로 등록하세요. 안정적인 일감 연결, 투명한 정산, 전문 네트워크 지원을 받으실 수 있습니다.",
  openGraph: {
    title: "협력사 등록 | 전방 홈케어",
    description:
      "전방 홈케어 협력사로 등록하고 함께 성장하세요. 양평, 가평 지역 전원주택 관리 서비스 파트너를 모집합니다.",
    url: "https://geonbang.com/homecare/partner",
  },
  alternates: {
    canonical: "https://geonbang.com/homecare/partner",
  },
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
