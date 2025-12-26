"use client";

import { memo } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceSelectionSummaryProps } from "./types";

/**
 * 서비스 선택 요약 컴포넌트 (컴팩트 버전)
 *
 * 현재 선택된 서비스 수를 간결하게 표시합니다.
 * Mobile First 디자인으로 최소한의 공간 사용.
 */
export const ServiceSelectionSummary = memo(function ServiceSelectionSummary({
  count,
  selectedNames,
  maxDisplay = 3,
  variant = "primary",
  className,
}: ServiceSelectionSummaryProps) {
  const isPrimary = variant === "primary";
  const hasSelection = count > 0;

  // 표시할 서비스 이름 계산
  const displayNames = selectedNames.slice(0, maxDisplay);
  const remainingCount = selectedNames.length > maxDisplay ? selectedNames.length - maxDisplay : 0;

  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 border",
        "transition-colors duration-150",
        hasSelection
          ? isPrimary
            ? "bg-primary/5 border-primary/30"
            : "bg-secondary/5 border-secondary/30"
          : "bg-gray-50 border-gray-200",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {/* 카운트 배지 - 컴팩트 */}
        <div
          className={cn(
            "flex-shrink-0",
            "w-10 h-10 rounded-full",
            "flex items-center justify-center",
            "text-lg font-bold",
            "transition-colors duration-150",
            hasSelection
              ? isPrimary
                ? "bg-primary text-white"
                : "bg-secondary text-white"
              : "bg-gray-200 text-gray-500"
          )}
        >
          {count}
        </div>

        {/* 텍스트 영역 */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-base font-semibold",
              hasSelection ? "text-gray-900" : "text-gray-500"
            )}
          >
            {hasSelection ? "개 서비스 선택됨" : "서비스를 선택해 주세요"}
          </p>

          {/* 선택된 서비스 목록 - 한 줄로 */}
          {hasSelection && (
            <p className="text-sm text-gray-500 truncate">
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
              "flex-shrink-0 w-6 h-6",
              isPrimary ? "text-primary" : "text-secondary"
            )}
          />
        )}
      </div>
    </div>
  );
});

export default ServiceSelectionSummary;
