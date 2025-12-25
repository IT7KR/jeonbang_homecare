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
        "mb-6 md:mb-8",
        // 애니메이션
        "animate-in fade-in-0 slide-in-from-top-2 duration-300",
        className
      )}
    >
      {/* 스텝 번호 뱃지 */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            "inline-flex items-center justify-center",
            "px-3 py-1.5 rounded-full",
            "text-sm md:text-base font-bold",
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
              "w-12 h-12 md:w-14 md:h-14",
              "rounded-xl",
              "flex items-center justify-center",
              variant === "primary"
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            )}
          >
            <span className="w-6 h-6 md:w-7 md:h-7">{icon}</span>
          </div>
        )}

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <h1
            className={cn(
              "text-xl md:text-2xl font-bold",
              "mb-2",
              variant === "primary" ? "text-gray-900" : "text-gray-900"
            )}
          >
            {title}
          </h1>

          {description && (
            <p className="text-base text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </header>
  );
}

export default StepHeader;
