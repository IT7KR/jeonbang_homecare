"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { SeniorLabel } from "./SeniorLabel";
import { FieldError } from "./FieldError";
import type { SeniorInputProps } from "./types";

/**
 * 시니어 친화적 입력 필드 컴포넌트
 *
 * 큰 텍스트, 넓은 터치 영역, 명확한 상태 표시를 제공합니다.
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

        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "input-senior",
            "w-full",
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

SeniorInput.displayName = "SeniorInput";

export default SeniorInput;
