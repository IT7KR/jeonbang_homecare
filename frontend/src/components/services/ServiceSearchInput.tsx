"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceSearchInputProps } from "./types";

/**
 * 서비스 검색 입력 컴포넌트
 *
 * 시니어 친화적인 큰 입력 필드와 명확한 아이콘을 제공합니다.
 */
export function ServiceSearchInput({
  value,
  onChange,
  placeholder = "서비스 검색",
  variant = "primary",
  className,
}: ServiceSearchInputProps) {
  const isPrimary = variant === "primary";

  return (
    <div className={cn("relative", className)}>
      {/* 검색 아이콘 */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search
          className={cn(
            "w-6 h-6",
            value
              ? isPrimary
                ? "text-primary"
                : "text-secondary"
              : "text-gray-400"
          )}
        />
      </div>

      {/* 입력 필드 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-14 pl-12 pr-12",
          "text-[18px] text-gray-900 placeholder:text-gray-400",
          "bg-white rounded-xl border-2",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          isPrimary
            ? "border-gray-200 focus:border-primary focus:ring-primary/30"
            : "border-gray-200 focus:border-secondary focus:ring-secondary/30"
        )}
        aria-label={placeholder}
      />

      {/* 초기화 버튼 */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "transition-colors duration-200",
            isPrimary
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-secondary/10 text-secondary hover:bg-secondary/20"
          )}
          aria-label="검색어 지우기"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default ServiceSearchInput;
