"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldErrorProps } from "./types";

/**
 * 필드 에러 표시 컴포넌트
 *
 * 시니어 친화적인 큰 텍스트와 명확한 에러 아이콘을 제공합니다.
 */
export function FieldError({
  message,
  fieldId,
  variant = "primary",
  className,
}: FieldErrorProps) {
  if (!message) return null;

  return (
    <div
      id={fieldId ? `${fieldId}-error` : undefined}
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-1.5",
        "mt-1.5 p-2 rounded-lg",
        "bg-red-50 border border-red-200",
        "animate-in fade-in-0 slide-in-from-top-1 duration-200",
        className
      )}
    >
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-600 font-medium">{message}</p>
    </div>
  );
}

export default FieldError;
