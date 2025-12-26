"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CollapsibleSectionProps {
  /** 섹션 제목 */
  title: string;
  /** 섹션 설명 (선택) */
  description?: string;
  /** 아이콘 (선택) */
  icon?: ReactNode;
  /** 기본 펼침 상태 */
  defaultOpen?: boolean;
  /** 자식 요소 */
  children: ReactNode;
  /** 테마 variant */
  variant?: "primary" | "secondary";
  /** 추가 className */
  className?: string;
}

/**
 * 접이식 섹션 컴포넌트
 *
 * 시니어 사용자를 위해 정보 과부하를 줄이고,
 * 선택적으로 추가 정보를 입력할 수 있도록 합니다.
 */
export function CollapsibleSection({
  title,
  description,
  icon,
  defaultOpen = false,
  children,
  variant = "primary",
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "rounded-2xl border-2 overflow-hidden transition-all duration-200",
        isOpen
          ? isPrimary
            ? "border-primary/30 bg-primary/5"
            : "border-secondary/30 bg-secondary/5"
          : "border-gray-200 bg-white",
        className
      )}
    >
      {/* 헤더 (클릭 가능) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between",
          "px-5 py-4",
          "text-left",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-3 focus:ring-inset",
          isPrimary ? "focus:ring-primary/30" : "focus:ring-secondary/30",
          isOpen ? "border-b-2 border-inherit" : ""
        )}
      >
        <div className="flex items-center gap-3">
          {/* 아이콘 */}
          {icon && (
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg",
                "flex items-center justify-center",
                isOpen
                  ? isPrimary
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary/20 text-secondary"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {icon}
            </div>
          )}

          {/* 제목 및 설명 */}
          <div>
            <span
              className={cn(
                "text-[18px] font-semibold",
                isOpen
                  ? isPrimary
                    ? "text-primary"
                    : "text-secondary"
                  : "text-gray-700"
              )}
            >
              {title}
            </span>
            {description && (
              <p className="text-[14px] text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* 펼치기/접기 아이콘 */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full",
            "flex items-center justify-center",
            "transition-colors duration-200",
            isOpen
              ? isPrimary
                ? "bg-primary/20 text-primary"
                : "bg-secondary/20 text-secondary"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {isOpen ? (
            <ChevronUp className="w-6 h-6" />
          ) : (
            <ChevronDown className="w-6 h-6" />
          )}
        </div>
      </button>

      {/* 콘텐츠 (펼쳤을 때만 표시) */}
      {isOpen && (
        <div
          className={cn(
            "px-5 py-5",
            "animate-in slide-in-from-top-2 duration-200"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default CollapsibleSection;
