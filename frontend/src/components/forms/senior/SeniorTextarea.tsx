"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { SeniorLabel } from "./SeniorLabel";
import { FieldError } from "./FieldError";
import type { SeniorTextareaProps } from "./types";

/**
 * 시니어 친화적 텍스트 영역 컴포넌트
 *
 * 큰 텍스트, 넓은 터치 영역, 명확한 상태 표시를 제공합니다.
 */
export const SeniorTextarea = forwardRef<
  HTMLTextAreaElement,
  SeniorTextareaProps
>(
  (
    {
      id,
      label,
      required = false,
      optional = false,
      hint,
      error,
      variant = "primary",
      containerClassName,
      className,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === "primary";

    return (
      <div className={containerClassName}>
        <SeniorLabel
          htmlFor={id}
          required={required}
          optional={optional}
          hint={hint}
          variant={variant}
        >
          {label}
        </SeniorLabel>

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            // 기본 스타일
            "w-full px-5 py-4",
            "text-[18px] leading-[1.6]",
            "rounded-xl border-2 border-gray-200",
            "bg-white",
            "placeholder:text-gray-400",
            "transition-colors duration-200",
            "resize-y min-h-[120px]",
            // 포커스 상태
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            isPrimary
              ? "focus:border-primary focus:ring-primary/30"
              : "focus:border-secondary focus:ring-secondary/30",
            // 에러 상태
            error && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200",
            // 비활성화 상태
            disabled && "opacity-50 cursor-not-allowed bg-gray-100",
            className
          )}
          {...props}
        />

        <FieldError message={error} fieldId={id} variant={variant} />
      </div>
    );
  }
);

SeniorTextarea.displayName = "SeniorTextarea";

export default SeniorTextarea;
