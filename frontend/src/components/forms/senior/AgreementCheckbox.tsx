"use client";

import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldError } from "./FieldError";
import type { AgreementCheckboxProps } from "./types";

/**
 * 동의 체크박스 컴포넌트
 *
 * 시니어 친화적인 큰 체크박스와 명확한 레이블을 제공합니다.
 * 개인정보 처리방침, 이용약관 등의 동의에 사용됩니다.
 */
export function AgreementCheckbox({
  id,
  name,
  label,
  description,
  checked,
  onChange,
  required = false,
  disabled = false,
  error,
  variant = "primary",
  viewDetailsLink,
  className,
}: AgreementCheckboxProps) {
  const isPrimary = variant === "primary";

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "w-full flex items-start gap-4 p-4 rounded-xl text-left",
          "border-2 transition-all duration-200",
          "cursor-pointer",
          checked
            ? isPrimary
              ? "border-primary bg-primary/5"
              : "border-secondary bg-secondary/5"
            : "border-gray-200 bg-white hover:border-gray-300",
          error && "border-red-300 bg-red-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* 체크박스 아이콘 */}
        <div className="flex-shrink-0 pt-0.5">
          <input
            type="checkbox"
            id={id}
            name={name}
            checked={checked}
            readOnly
            disabled={disabled}
            required={required}
            tabIndex={-1}
            className="sr-only"
          />
          <div
            className={cn(
              "w-8 h-8 md:w-9 md:h-9",
              "rounded-lg border-2",
              "flex items-center justify-center",
              "transition-all duration-200",
              checked
                ? isPrimary
                  ? "border-primary bg-primary text-white"
                  : "border-secondary bg-secondary text-white"
                : "border-gray-300 bg-white"
            )}
          >
            {checked && <Check className="w-5 h-5" strokeWidth={3} />}
          </div>
        </div>

        {/* 라벨 및 설명 */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor={id}
            className={cn(
              "block text-[18px] font-medium",
              "cursor-pointer",
              checked ? "text-gray-900" : "text-gray-700"
            )}
          >
            {label}
            {required && (
              <span
                className={cn(
                  "ml-2 px-2 py-0.5 rounded",
                  "text-[12px] font-bold",
                  isPrimary
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary/10 text-secondary"
                )}
              >
                필수
              </span>
            )}
          </label>

          {description && (
            <p className="mt-1 text-[14px] text-gray-500">{description}</p>
          )}

          {/* 전체 내용 보기 링크 */}
          {viewDetailsLink && (
            <a
              href={viewDetailsLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-center gap-1 mt-2",
                "text-[14px] font-medium underline",
                isPrimary
                  ? "text-primary hover:text-primary/80"
                  : "text-secondary hover:text-secondary/80"
              )}
            >
              <span>전체 내용 보기</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </button>

      {/* 에러 메시지 */}
      <FieldError message={error} fieldId={id} variant={variant} />
    </div>
  );
}

export default AgreementCheckbox;
