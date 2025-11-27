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
      <div className="flex items-center gap-3 mb-5">
        <span
          className={cn(
            "inline-flex items-center justify-center",
            "px-5 py-2 rounded-full",
            "text-lg md:text-xl font-bold",
            variant === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-secondary/10 text-secondary"
          )}
        >
          {stepNumber} / {totalSteps} 단계
        </span>
      </div>

      {/* 제목 영역 */}
      <div className="flex items-start gap-5">
        {/* 아이콘 (있는 경우) */}
        {icon && (
          <div
            className={cn(
              "flex-shrink-0",
              "w-16 h-16 md:w-20 md:h-20",
              "rounded-2xl",
              "flex items-center justify-center",
              variant === "primary"
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            )}
          >
            <span className="w-8 h-8 md:w-10 md:h-10">{icon}</span>
          </div>
        )}

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <h1
            className={cn(
              "text-2xl md:text-3xl lg:text-4xl font-extrabold",
              "mb-3",
              variant === "primary" ? "text-gray-900" : "text-gray-900"
            )}
          >
            {title}
          </h1>

          {description && (
            <p className="text-lg md:text-xl text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </header>
  );
}

export default StepHeader;
