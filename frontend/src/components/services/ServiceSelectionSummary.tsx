"use client";

import { memo } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceSelectionSummaryProps } from "./types";

/**
 * 서비스 선택 요약 컴포넌트
 *
 * 현재 선택된 서비스 수와 목록을 시각적으로 표시합니다.
 * 시니어 친화적인 큰 텍스트와 명확한 상태 표시를 제공합니다.
 *
 * React.memo로 감싸서 불필요한 리렌더를 방지합니다.
 */
export const ServiceSelectionSummary = memo(function ServiceSelectionSummary({
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
        // 전환 효과 - 색상만 전환 (깜빡임 방지)
        "transition-colors duration-150",
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
            "w-16 h-16 md:w-18 md:h-18",
            "rounded-full",
            "flex items-center justify-center",
            "text-2xl md:text-3xl font-bold",
            "shadow-lg",
            // 전환 효과 - 색상만 전환 (깜빡임 방지)
            "transition-colors duration-150",
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
              "text-xl md:text-2xl font-bold",
              hasSelection ? "text-gray-900" : "text-gray-500"
            )}
          >
            {hasSelection ? "개 서비스 선택됨" : "선택된 서비스 없음"}
          </p>

          {/* 선택된 서비스 목록 */}
          {hasSelection && (
            <p className="mt-1 text-base md:text-lg text-gray-600 line-clamp-2">
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
              "flex-shrink-0 w-9 h-9 md:w-10 md:h-10",
              isPrimary ? "text-primary" : "text-secondary"
            )}
          />
        )}
      </div>
    </div>
  );
});

export default ServiceSelectionSummary;
