"use client";

import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SeniorLabel } from "./SeniorLabel";
import { FieldError } from "./FieldError";
import type { SeniorInputProps } from "./types";

/**
 * 시니어 친화적 입력 필드 컴포넌트
 *
 * 큰 텍스트, 넓은 터치 영역, 명확한 상태 표시를 제공합니다.
 * 모바일에서 키보드가 열릴 때 입력 필드가 보이도록 스크롤됩니다.
 */
export const SeniorInput = forwardRef<HTMLInputElement, SeniorInputProps>(
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
      leftIcon,
      onFocus,
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === "primary";

    // 모바일 키보드 열릴 때 입력 필드가 보이도록 스크롤
    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // 원래 onFocus 핸들러 호출
      onFocus?.(e);

      // 모바일 환경에서만 스크롤 (터치 디바이스 감지)
      if (typeof window !== 'undefined' && 'ontouchstart' in window) {
        // 키보드가 올라오는 시간을 고려해 약간의 지연 후 스크롤
        setTimeout(() => {
          e.target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 300);
      }
    }, [onFocus]);

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

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            onFocus={handleFocus}
            className={cn(
              "input-senior",
              "w-full",
              leftIcon && "!pl-14",
              // 포커스 상태
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              isPrimary
                ? "focus:border-primary focus:ring-primary/30"
                : "focus:border-secondary focus:ring-secondary/30",
              // 에러 상태
              error &&
                "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200",
              // 비활성화 상태
              disabled && "opacity-50 cursor-not-allowed bg-gray-100",
              className
            )}
            {...props}
          />
        </div>

        <FieldError message={error} fieldId={id} variant={variant} />
      </div>
    );
  }
);

SeniorInput.displayName = "SeniorInput";

export default SeniorInput;
