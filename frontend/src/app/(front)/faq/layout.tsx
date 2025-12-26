import type { Metadata } from "next";
import { generateFAQPageSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
  title: "자주 묻는 질문 (FAQ) | 전방 홈케어",
  description:
    "전방 홈케어 서비스 이용, 견적 요청, 협력사 등록에 대한 자주 묻는 질문과 답변을 확인하세요.",
  openGraph: {
    title: "자주 묻는 질문 (FAQ) | 전방 홈케어",
    description:
      "전방 홈케어 서비스 이용에 대한 자주 묻는 질문과 답변입니다.",
    url: "https://geonbang.com/homecare/faq",
  },
  alternates: {
    canonical: "https://geonbang.com/homecare/faq",
  },
};

// FAQ 데이터 (스키마용)
const FAQ_DATA = [
  {
    question: "서비스 신청은 어떻게 하나요?",
    answer:
      "홈페이지의 '견적 요청하기' 버튼을 클릭하여 필요한 서비스를 선택하고, 주소와 연락처, 상세 요청사항을 입력해주세요.",
  },
  {
    question: "서비스 가능 지역은 어디인가요?",
    answer:
      "현재 양평, 가평 지역을 중심으로 서비스를 제공하고 있으며, 인근 지역도 가능한 서비스가 있습니다.",
  },
  {
    question: "견적은 어떻게 받을 수 있나요?",
    answer:
      "서비스 신청 후 담당자가 신청 내용을 확인하고, 필요 시 현장 방문 후 정확한 견적을 안내드립니다.",
  },
  {
    question: "협력사 등록은 어떻게 하나요?",
    answer:
      "홈페이지의 '협력사 신청하기' 버튼을 클릭하여 업체 정보, 서비스 가능 분야, 활동 지역 등을 입력해주세요.",
  },
  {
    question: "회원가입이 필요한가요?",
    answer:
      "아니요, 회원가입 없이도 서비스 신청이 가능합니다. 신청 시 입력하신 연락처로 진행 상황을 안내드립니다.",
  },
];

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQPageSchema(FAQ_DATA)),
        }}
      />
      {children}
    </>
  );
}
