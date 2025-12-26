"use client";

import { forwardRef, useCallback, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SeniorLabel } from "./SeniorLabel";
import { FieldError } from "./FieldError";
import type { SeniorTextareaProps } from "./types";

/**
 * 시니어 친화적 텍스트 영역 컴포넌트
 *
 * 큰 텍스트, 넓은 터치 영역, 명확한 상태 표시를 제공합니다.
 * 모바일에서 키보드가 열릴 때 텍스트 영역이 보이도록 스크롤됩니다.
 * collapsible 모드에서는 접기/펼치기가 가능합니다.
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
      collapsible = false,
      collapsedRows = 3,
      expandedRows = 8,
      expandLabel = "자세히 작성하기",
      collapseLabel = "간단히 접기",
      onFocus,
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === "primary";
    const [isExpanded, setIsExpanded] = useState(false);

    // collapsible 모드일 때 줄 수 계산
    const actualRows = collapsible
      ? isExpanded
        ? expandedRows
        : collapsedRows
      : rows;

    // 모바일 키보드 열릴 때 텍스트 영역이 보이도록 스크롤
    const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
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

        <textarea
          ref={ref}
          id={id}
          rows={actualRows}
          disabled={disabled}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={handleFocus}
          className={cn(
            // 기본 스타일
            "w-full px-4 py-3",
            "text-base leading-relaxed",
            "rounded-xl border-2 border-gray-200",
            "bg-white",
            "placeholder:text-gray-400",
            "transition-all duration-200",
            collapsible ? "resize-none" : "resize-y min-h-[100px]",
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

        {/* Collapsible 모드: 펼치기/접기 버튼 */}
        {collapsible && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "mt-2 flex items-center gap-1.5",
              "text-sm font-medium",
              "transition-colors duration-200",
              isPrimary
                ? "text-primary hover:text-primary/80"
                : "text-secondary hover:text-secondary/80"
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {collapseLabel}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {expandLabel}
              </>
            )}
          </button>
        )}

        <FieldError message={error} fieldId={id} variant={variant} />
      </div>
    );
  }
);

SeniorTextarea.displayName = "SeniorTextarea";

export default SeniorTextarea;
