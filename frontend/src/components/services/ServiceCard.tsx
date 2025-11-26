"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceCardProps } from "./types";

/**
 * 서비스 선택 카드 컴포넌트
 *
 * 시니어 친화적인 큰 터치 영역과 명확한 선택 상태를 제공합니다.
 * 체크박스 스타일의 선택 UI로 직관적인 상호작용을 지원합니다.
 */
export function ServiceCard({
  code,
  name,
  description,
  isSelected,
  onClick,
  disabled = false,
  variant = "primary",
  className,
}: ServiceCardProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={`${name} ${isSelected ? "선택됨" : "선택 안됨"}`}
      className={cn(
        // 기본 스타일
        "service-card",
        "w-full text-left",
        // 터치 타겟
        "touch-target",
        // 전환 효과
        "transition-all duration-200",
        // 포커스 상태
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        // 선택 상태
        isSelected
          ? [
              "border-2",
              isPrimary
                ? "border-primary bg-primary/5 ring-2 ring-primary/20 focus:ring-primary"
                : "border-secondary bg-secondary/5 ring-2 ring-secondary/20 focus:ring-secondary",
            ]
          : [
              "border-gray-200 bg-white",
              "hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm",
              "focus:ring-gray-400",
            ],
        // 비활성화 상태
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* 체크박스 영역 */}
      <div
        className={cn(
          "flex-shrink-0",
          "w-8 h-8 md:w-9 md:h-9",
          "rounded-lg border-2",
          "flex items-center justify-center",
          "transition-all duration-200",
          isSelected
            ? isPrimary
              ? "border-primary bg-primary text-white"
              : "border-secondary bg-secondary text-white"
            : "border-gray-300 bg-white"
        )}
      >
        {isSelected && <Check className="w-5 h-5" strokeWidth={3} />}
      </div>

      {/* 텍스트 영역 */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "block text-[18px] leading-tight",
            isSelected ? "font-bold text-gray-900" : "font-medium text-gray-700"
          )}
        >
          {name}
        </span>

        {description && (
          <span className="block mt-1 text-[14px] text-gray-500 line-clamp-2">
            {description}
          </span>
        )}
      </div>
    </button>
  );
}

export default ServiceCard;
