"use client";

import { memo } from "react";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCheckboxItemProps {
  code: string;
  name: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  variant?: "primary" | "secondary";
}

/**
 * 컴팩트 서비스 체크박스 아이템
 *
 * - 높이: 48px (고정)
 * - 체크박스: 24px (원형)
 * - 텍스트: 16px (1줄, truncate)
 * - 설명 없음 (이름만)
 * - 모바일에서도 2열 그리드 유지
 */
export const ServiceCheckboxItem = memo(function ServiceCheckboxItem({
  code,
  name,
  isSelected,
  onClick,
  disabled = false,
  isActive = true,
  variant = "primary",
}: ServiceCheckboxItemProps) {
  const isPrimary = variant === "primary";
  const isDisabled = disabled || !isActive;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        // Base styles
        "flex items-center gap-2.5",
        "w-full min-h-[48px] px-3 py-2",
        "rounded-xl border-[1.5px]",
        "transition-all duration-200",
        "text-left",

        // States
        isDisabled
          ? "cursor-not-allowed opacity-60 bg-gray-50 border-gray-200"
          : isSelected
            ? isPrimary
              ? "bg-primary/10 border-primary shadow-sm"
              : "bg-secondary/10 border-secondary shadow-sm"
            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      {/* Checkbox circle */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full",
          "flex items-center justify-center",
          "border-2 transition-all duration-200",

          isDisabled
            ? "border-gray-300 bg-gray-100"
            : isSelected
              ? isPrimary
                ? "border-primary bg-primary"
                : "border-secondary bg-secondary"
              : "border-gray-300 bg-white"
        )}
      >
        {isDisabled && !isSelected ? (
          <Clock className="w-3 h-3 text-gray-400" />
        ) : isSelected ? (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        ) : null}
      </div>

      {/* Label */}
      <span
        className={cn(
          "flex-1 text-[16px] font-medium leading-tight",
          "truncate",

          isDisabled
            ? "text-gray-400"
            : isSelected
              ? isPrimary
                ? "text-primary"
                : "text-secondary"
              : "text-gray-700"
        )}
      >
        {name}
        {!isActive && (
          <span className="ml-1 text-[12px] text-gray-400 font-normal">
            (준비 중)
          </span>
        )}
      </span>
    </button>
  );
});

export default ServiceCheckboxItem;
