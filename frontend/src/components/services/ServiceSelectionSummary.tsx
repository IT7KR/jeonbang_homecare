"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceSelectionSummaryProps } from "./types";

/**
 * 서비스 선택 요약 컴포넌트
 *
 * 현재 선택된 서비스 수와 목록을 시각적으로 표시합니다.
 * 시니어 친화적인 큰 텍스트와 명확한 상태 표시를 제공합니다.
 */
export function ServiceSelectionSummary({
  count,
  selectedNames,
  maxDisplay = 5,
  variant = "primary",
  className,
}: ServiceSelectionSummaryProps) {
  const isPrimary = variant === "primary";
  const hasSelection = count > 0;

  // 표시할 서비스 이름 계산
  const displayNames =
    selectedNames.length <= maxDisplay
      ? selectedNames
      : selectedNames.slice(0, maxDisplay - 2);
  const remainingCount =
    selectedNames.length > maxDisplay ? selectedNames.length - (maxDisplay - 2) : 0;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border-2",
        "transition-all duration-300",
        hasSelection
          ? isPrimary
            ? "bg-primary/10 border-primary"
            : "bg-secondary/10 border-secondary"
          : "bg-gray-50 border-gray-200",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        {/* 카운트 배지 */}
        <div
          className={cn(
            "flex-shrink-0",
            "w-14 h-14 md:w-16 md:h-16",
            "rounded-full",
            "flex items-center justify-center",
            "text-[24px] md:text-[28px] font-bold",
            "shadow-lg",
            "transition-all duration-300",
            hasSelection
              ? isPrimary
                ? "bg-primary text-white"
                : "bg-secondary text-white"
              : "bg-gray-300 text-gray-600"
          )}
        >
          {count}
        </div>

        {/* 텍스트 영역 */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-[20px] md:text-[22px] font-bold",
              hasSelection ? "text-gray-900" : "text-gray-500"
            )}
          >
            {hasSelection ? "개 서비스 선택됨" : "선택된 서비스 없음"}
          </p>

          {/* 선택된 서비스 목록 */}
          {hasSelection && (
            <p className="mt-1 text-[16px] text-gray-600 line-clamp-2">
              {remainingCount > 0
                ? `${displayNames.join(", ")} 외 ${remainingCount}개`
                : selectedNames.join(", ")}
            </p>
          )}
        </div>

        {/* 체크 아이콘 (선택 시) */}
        {hasSelection && (
          <CheckCircle2
            className={cn(
              "flex-shrink-0 w-8 h-8",
              isPrimary ? "text-primary" : "text-secondary"
            )}
          />
        )}
      </div>
    </div>
  );
}

export default ServiceSelectionSummary;
