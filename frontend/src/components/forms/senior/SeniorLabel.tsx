"use client";

import { cn } from "@/lib/utils";
import type { SeniorLabelProps } from "./types";

/**
 * 시니어 친화적 라벨 컴포넌트
 *
 * 큰 텍스트와 명확한 필수/선택 표시를 제공합니다.
 */
export function SeniorLabel({
  children,
  htmlFor,
  required = false,
  optional = false,
  hint,
  variant = "primary",
  className,
}: SeniorLabelProps) {
  const isPrimary = variant === "primary";

  return (
    <div className={cn("mb-2", className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          "text-senior-label",
          "flex items-center gap-2 flex-wrap"
        )}
      >
        <span>{children}</span>

        {/* 필수 표시 */}
        {required && (
          <span
            className={cn(
              "inline-flex items-center",
              "px-2 py-0.5 rounded",
              "text-[12px] font-bold",
              isPrimary
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            )}
          >
            필수
          </span>
        )}

        {/* 선택 표시 */}
        {optional && !required && (
          <span
            className={cn(
              "inline-flex items-center",
              "px-2 py-0.5 rounded",
              "text-[12px] font-medium",
              "bg-gray-100 text-gray-500"
            )}
          >
            선택
          </span>
        )}
      </label>

      {/* 힌트 텍스트 */}
      {hint && (
        <p className="mt-1 text-[14px] text-gray-500">{hint}</p>
      )}
    </div>
  );
}

export default SeniorLabel;
