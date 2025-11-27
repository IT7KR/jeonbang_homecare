"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Phone, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPANY_INFO } from "@/lib/constants";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // 서비스 이용
  {
    category: "서비스 이용",
    question: "서비스 신청은 어떻게 하나요?",
    answer:
      "홈페이지의 '견적 요청하기' 버튼을 클릭하여 필요한 서비스를 선택하고, 주소와 연락처, 상세 요청사항을 입력해주세요. 현장 사진을 함께 첨부하시면 더 정확한 견적 상담이 가능합니다.",
  },
  {
    category: "서비스 이용",
    question: "서비스 가능 지역은 어디인가요?",
    answer:
      "현재 양평, 가평 지역을 중심으로 서비스를 제공하고 있으며, 인근 지역과 전국으로 가능한 서비스도 있으니 시공 지역 문의는 전화 상담 바랍니다.",
  },
  {
    category: "서비스 이용",
    question: "견적은 어떻게 받을 수 있나요?",
    answer:
      "서비스 신청 후 담당자가 신청 내용을 확인하고, 필요 시 현장 방문 후 정확한 견적을 안내드립니다. 일반적으로 1-2일 내에 견적 안내가 가능합니다.",
  },
  {
    category: "서비스 이용",
    question: "서비스 비용은 어떻게 결제하나요?",
    answer:
      "주택 관리 서비스 진행 시 결제 방법은 담당자가 친절히 안내드립니다.",
  },
  {
    category: "서비스 이용",
    question: "긴급 서비스도 가능한가요?",
    answer:
      "네, 긴급한 수리나 서비스가 필요한 경우 전화로 연락주시면 가능한 빠르게 대응해드립니다. 단, 상황에 따라 추가 비용이 발생할 수 있습니다.",
  },
  // 협력사 관련
  {
    category: "협력사",
    question: "협력사 등록은 어떻게 하나요?",
    answer:
      "홈페이지의 '협력사 신청하기' 버튼을 클릭하여 업체 정보, 서비스 가능 분야, 활동 지역 등을 입력해주세요. 심사 후 승인되면 SMS로 안내드립니다.",
  },
  {
    category: "협력사",
    question: "협력사 등록 심사 기간은 얼마나 걸리나요?",
    answer:
      "일반적으로 영업일 기준 1-3일 내에 심사가 완료됩니다. 심사 결과는 SMS로 안내드립니다.",
  },
  {
    category: "협력사",
    question: "협력사 수수료는 어떻게 되나요?",
    answer:
      "협력사 수수료 및 정산 방식은 별도로 안내드립니다. 자세한 내용은 협력사 등록 후 담당자와 상담해주세요.",
  },
  // 기타
  {
    category: "기타",
    question: "서비스 AS는 어떻게 되나요?",
    answer:
      "시공 완료 후 문제가 발생한 경우, 담당자에게 연락주시면 확인 후 AS를 진행합니다. AS 정책은 서비스 종류에 따라 다를 수 있으니 시공 전 확인해주세요.",
  },
  {
    category: "기타",
    question: "회원가입이 필요한가요?",
    answer:
      "아니요, 회원가입 없이도 서비스 신청이 가능합니다. 신청 시 입력하신 연락처로 진행 상황을 안내드립니다.",
  },
  {
    category: "기타",
    question: "서비스 진행 상황은 어떻게 확인하나요?",
    answer:
      "서비스 신청 시 발급된 신청번호와 함께 진행 상황을 SMS로 안내드립니다. 추가 문의사항은 전화로 연락주세요.",
  },
];

const CATEGORIES = ["전체", "서비스 이용", "협력사", "기타"];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const filteredFAQ =
    selectedCategory === "전체"
      ? FAQ_DATA
      : FAQ_DATA.filter((item) => item.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50/30 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900">
              자주 묻는 질문
            </h1>
            <p className="text-xl md:text-2xl text-gray-600">
              전방 홈케어 서비스 이용에 대해 궁금하신 점을 확인해보세요.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-3 mb-10">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setOpenIndex(null);
                  }}
                  className={cn(
                    "px-6 py-3 rounded-full text-lg md:text-xl font-semibold transition-colors",
                    selectedCategory === category
                      ? "bg-primary text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-5">
              {filteredFAQ.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-primary font-bold text-xl md:text-2xl">
                        Q
                      </span>
                      <span className="font-semibold text-lg md:text-xl text-gray-900">
                        {item.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-6 h-6 text-gray-500 transition-transform flex-shrink-0",
                        openIndex === index && "rotate-180"
                      )}
                    />
                  </button>
                  {openIndex === index && (
                    <div className="px-6 md:px-8 py-5 md:py-6 bg-gray-50 border-t border-gray-200">
                      <div className="flex gap-4">
                        <span className="text-primary font-bold text-xl md:text-2xl">
                          A
                        </span>
                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
              원하는 답을 찾지 못하셨나요?
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-10">
              추가 문의사항이 있으시면 전화 또는 서비스 신청을 통해
              문의해주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg md:text-xl h-14 px-8"
              >
                <Link href={`tel:${COMPANY_INFO.phone.replace(/-/g, "")}`}>
                  <Phone className="mr-2 h-6 w-6" />
                  {COMPANY_INFO.phone}
                </Link>
              </Button>
              <Button asChild size="lg" className="text-lg md:text-xl h-14 px-8">
                <Link href="/apply">
                  서비스 문의하기
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
