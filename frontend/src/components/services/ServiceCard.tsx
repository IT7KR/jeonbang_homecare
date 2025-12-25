"use client";

import { memo } from "react";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceCardProps } from "./types";

/**
 * 서비스 선택 카드 컴포넌트
 *
 * 시니어 친화적인 큰 터치 영역과 명확한 선택 상태를 제공합니다.
 * 체크박스 스타일의 선택 UI로 직관적인 상호작용을 지원합니다.
 *
 * isActive가 false인 경우 "준비 중" 배지를 표시하고 선택 불가능합니다.
 *
 * React.memo로 감싸서 불필요한 리렌더를 방지합니다.
 */
export const ServiceCard = memo(function ServiceCard({
  code,
  name,
  description,
  isSelected,
  onClick,
  disabled = false,
  isActive = true,
  variant = "primary",
  seniorMode = false,
  className,
}: ServiceCardProps) {
  const isPrimary = variant === "primary";
  const isDisabled = disabled || !isActive;

  return (
    <button
      type="button"
      onClick={isActive ? onClick : undefined}
      disabled={isDisabled}
      aria-pressed={isSelected}
      aria-label={`${name} ${!isActive ? "준비 중" : isSelected ? "선택됨" : "선택 안됨"}`}
      className={cn(
        // 기본 스타일
        "service-card",
        "w-full text-left",
        // 시니어 모드: 더 넓은 터치 영역
        seniorMode ? "min-h-[72px] p-4 md:p-5" : "touch-target",
        // 전환 효과 - 색상과 테두리만 전환 (깜빡임 방지)
        "transition-colors duration-150",
        // 포커스 상태
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        // 준비 중 상태
        !isActive && [
          "border-gray-200 bg-gray-50",
          "cursor-not-allowed",
        ],
        // 선택 상태 (활성화된 경우만)
        isActive && isSelected
          ? [
              "border-2",
              isPrimary
                ? "border-primary bg-primary/5 ring-2 ring-primary/20 focus:ring-primary"
                : "border-secondary bg-secondary/5 ring-2 ring-secondary/20 focus:ring-secondary",
            ]
          : isActive && [
              "border-gray-200 bg-white",
              "hover:border-gray-300 hover:bg-gray-50",
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
          // 시니어 모드: 더 큰 체크박스
          seniorMode ? "w-11 h-11 md:w-12 md:h-12" : "w-9 h-9 md:w-10 md:h-10",
          "rounded-lg border-2",
          "flex items-center justify-center",
          // 전환 효과 - 색상만 전환 (깜빡임 방지)
          "transition-colors duration-150",
          !isActive
            ? "border-gray-300 bg-gray-100"
            : isSelected
            ? isPrimary
              ? "border-primary bg-primary text-white"
              : "border-secondary bg-secondary text-white"
            : "border-gray-300 bg-white"
        )}
      >
        {!isActive ? (
          <Clock className={cn(seniorMode ? "w-5 h-5" : "w-4 h-4", "text-gray-400")} />
        ) : (
          isSelected && <Check className={cn(seniorMode ? "w-6 h-6" : "w-5 h-5")} strokeWidth={3} />
        )}
      </div>

      {/* 텍스트 영역 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "leading-tight",
              // 시니어 모드: 더 큰 텍스트
              seniorMode ? "text-[19px] md:text-[21px]" : "text-lg md:text-xl",
              !isActive
                ? "font-medium text-gray-400"
                : isSelected
                ? "font-bold text-gray-900"
                : "font-medium text-gray-700"
            )}
          >
            {name}
          </span>

          {/* 준비 중 배지 */}
          {!isActive && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full font-medium bg-gray-200 text-gray-500",
              seniorMode ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
            )}>
              <Clock className={cn(seniorMode ? "w-4 h-4" : "w-3 h-3")} />
              준비 중
            </span>
          )}
        </div>

        {description && (
          <span className={cn(
            "block mt-1 line-clamp-2",
            // 시니어 모드: 더 큰 설명 텍스트
            seniorMode ? "text-[15px] md:text-[16px]" : "text-sm md:text-base",
            !isActive ? "text-gray-400" : "text-gray-500"
          )}>
            {description}
          </span>
        )}
      </div>
    </button>
  );
});

export default ServiceCard;
