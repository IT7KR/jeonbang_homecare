"use client";

import { Check, Leaf, Bug, Paintbrush, Sparkles, TreePine, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 인기 서비스 목록
 * 시니어 사용자가 가장 많이 선택하는 서비스들
 */
export const POPULAR_SERVICES = [
  {
    code: "제초 작업",
    name: "제초 작업",
    description: "잡초 제거",
    icon: Leaf,
  },
  {
    code: "수목 전지",
    name: "수목 전지",
    description: "나무 가지치기",
    icon: TreePine,
  },
  {
    code: "마당 청소",
    name: "마당 청소",
    description: "마당 정리",
    icon: Sparkles,
  },
  {
    code: "해충 방제",
    name: "해충 방제",
    description: "벌레/벌집 제거",
    icon: Bug,
  },
  {
    code: "페인트 실외",
    name: "외벽 페인트",
    description: "외벽 도색",
    icon: Paintbrush,
  },
  {
    code: "입주 청소",
    name: "입주 청소",
    description: "전문 청소",
    icon: Home,
  },
] as const;

export interface PopularServicesProps {
  selectedServices: string[];
  onServiceToggle: (code: string) => void;
  variant?: "primary" | "secondary";
  className?: string;
}

/**
 * 인기 서비스 선택 컴포넌트
 *
 * 시니어 사용자를 위해 가장 많이 찾는 서비스 6개를
 * 큰 버튼으로 먼저 표시합니다.
 */
export function PopularServices({
  selectedServices,
  onServiceToggle,
  variant = "primary",
  className,
}: PopularServicesProps) {
  const isPrimary = variant === "primary";

  return (
    <div className={cn("space-y-4", className)}>
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-[18px] font-bold",
            isPrimary ? "text-primary" : "text-secondary"
          )}
        >
          자주 찾는 서비스
        </span>
        <span className="text-[14px] text-gray-500">
          (빠른 선택)
        </span>
      </div>

      {/* 인기 서비스 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {POPULAR_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.code);
          const Icon = service.icon;

          return (
            <button
              key={service.code}
              type="button"
              onClick={() => onServiceToggle(service.code)}
              className={cn(
                // 기본 스타일
                "relative flex flex-col items-center justify-center",
                "min-h-[80px] md:min-h-[90px] p-4",
                "rounded-2xl border-2",
                "transition-all duration-200",
                "focus:outline-none focus:ring-3",
                // 터치 영역 확보
                "touch-target-xl",
                // 선택 상태
                isSelected
                  ? isPrimary
                    ? "bg-primary/10 border-primary ring-primary/30"
                    : "bg-secondary/10 border-secondary ring-secondary/30"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                // 포커스 링
                isPrimary ? "focus:ring-primary/30" : "focus:ring-secondary/30"
              )}
            >
              {/* 선택 체크 표시 */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute top-2 right-2",
                    "w-6 h-6 rounded-full",
                    "flex items-center justify-center",
                    isPrimary ? "bg-primary" : "bg-secondary"
                  )}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* 아이콘 */}
              <Icon
                className={cn(
                  "w-8 h-8 mb-2",
                  isSelected
                    ? isPrimary
                      ? "text-primary"
                      : "text-secondary"
                    : "text-gray-500"
                )}
              />

              {/* 서비스명 */}
              <span
                className={cn(
                  "text-[16px] md:text-[18px] font-semibold text-center",
                  isSelected ? "text-gray-900" : "text-gray-700"
                )}
              >
                {service.name}
              </span>

              {/* 설명 (모바일에서는 숨김) */}
              <span className="hidden md:block text-[14px] text-gray-500 mt-0.5">
                {service.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PopularServices;
