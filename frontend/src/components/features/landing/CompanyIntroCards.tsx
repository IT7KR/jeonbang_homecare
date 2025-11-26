"use client";

import Image from "next/image";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { COMPANY_INTRO } from "@/lib/constants";

export function CompanyIntroCards() {
  const colors = [
    {
      bg: "bg-blue-50",
      icon: "bg-blue-500",
      text: "text-blue-600",
      border: "border-transparent",
      button: "bg-blue-500 hover:bg-blue-600",
    },
    {
      bg: "bg-purple-50",
      icon: "bg-purple-500",
      text: "text-purple-600",
      border: "border-transparent",
      button: "bg-purple-500 hover:bg-purple-600",
    },
    {
      bg: "bg-primary-50",
      icon: "bg-primary",
      text: "text-primary",
      border: "border-primary",
      button: "bg-primary hover:bg-primary/90",
    },
  ];

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
        {COMPANY_INTRO.items.map((item, index) => {
          const isHomecare = item.id === "homecare";
          const color = colors[index];

          return (
            <div key={item.id} className="relative group">
              {/* 카드 사이 연결선 (데스크톱) */}
              {index < COMPANY_INTRO.items.length - 1 && (
                <div className="hidden md:block absolute top-1/2 left-full w-6 h-0.5 bg-gray-300 -translate-y-1/2" />
              )}
              {/* 모바일 연결선 */}
              {index < COMPANY_INTRO.items.length - 1 && (
                <div className="md:hidden absolute left-1/2 -bottom-4 w-0.5 h-8 bg-gray-200 -translate-x-1/2" />
              )}

              <div
                className={`relative text-center p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                  isHomecare
                    ? "bg-primary/5 border-primary ring-4 ring-primary/10 shadow-lg"
                    : `${color.bg} ${color.border}`
                }`}
              >
                {/* 홈케어 강조 배지 */}
                {isHomecare && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    <Sparkles className="h-3 w-3" />
                    현재 서비스
                  </span>
                )}

                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden mx-auto mb-5 shadow-lg ${
                    isHomecare ? "ring-4 ring-primary/30 scale-110" : ""
                  }`}
                >
                  <Image
                    src={item.icon}
                    alt={item.title}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className={`inline-block text-xs font-bold mb-2 px-3 py-1 rounded-full ${
                    isHomecare
                      ? "text-primary bg-primary/10"
                      : `${color.text} bg-white/50`
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3
                  className={`text-lg md:text-xl font-bold mb-3 ${
                    isHomecare ? "text-primary" : "text-gray-900"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* 바로가기 버튼 */}
                {item.isExternal ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors ${color.button}`}
                  >
                    바로가기
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <button
                    onClick={handleScrollTop}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors ${color.button}`}
                  >
                    바로가기
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
