"use client";

import { cn } from "@/lib/utils";
import type { StepHeaderProps } from "./types";

/**
 * 스텝 헤더 컴포넌트
 *
 * 각 스텝의 제목, 설명, 아이콘을 표시합니다.
 * 시니어 친화적인 큰 텍스트와 명확한 계층 구조를 제공합니다.
 */
export function StepHeader({
  stepNumber,
  totalSteps,
  title,
  description,
  icon,
  variant = "primary",
  className,
}: StepHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 md:mb-10",
        // 애니메이션
        "animate-in fade-in-0 slide-in-from-top-2 duration-300",
        className
      )}
    >
      {/* 스텝 번호 뱃지 */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={cn(
            "inline-flex items-center justify-center",
            "px-4 py-1.5 rounded-full",
            "text-[14px] font-bold",
            variant === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-secondary/10 text-secondary"
          )}
        >
          {stepNumber} / {totalSteps} 단계
        </span>
      </div>

      {/* 제목 영역 */}
      <div className="flex items-start gap-4">
        {/* 아이콘 (있는 경우) */}
        {icon && (
          <div
            className={cn(
              "flex-shrink-0",
              "w-14 h-14 md:w-16 md:h-16",
              "rounded-2xl",
              "flex items-center justify-center",
              variant === "primary"
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            )}
          >
            <span className="w-7 h-7 md:w-8 md:h-8">{icon}</span>
          </div>
        )}

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <h1
            className={cn(
              "text-senior-title",
              "mb-2",
              variant === "primary" ? "text-gray-900" : "text-gray-900"
            )}
          >
            {title}
          </h1>

          {description && (
            <p className="text-senior-body text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </header>
  );
}

export default StepHeader;
