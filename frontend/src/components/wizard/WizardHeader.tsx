"use client";

import { cn } from "@/lib/utils";
import type { WizardVariant } from "./types";

/**
 * WizardHeader Props
 */
export interface WizardHeaderProps {
  /** 현재 스텝 (1부터 시작) */
  currentStep: number;
  /** 총 스텝 수 */
  totalSteps: number;
  /** 테마 variant */
  variant?: WizardVariant;
  /** 추가 className */
  className?: string;
}

/**
 * 간소화된 마법사 프로그레스 바
 *
 * 공통 Header 아래 얇은 프로그레스 바만 표시
 * 높이: 6px (모바일 최적화)
 */
export function WizardHeader({
  currentStep,
  totalSteps,
  variant = "primary",
  className,
}: WizardHeaderProps) {
  const isPrimary = variant === "primary";
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div
      className={cn(
        "w-full h-1.5 bg-gray-200",
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${currentStep}/${totalSteps} 단계 진행 중`}
    >
      <div
        className={cn(
          "h-full transition-all duration-300",
          isPrimary ? "bg-primary" : "bg-secondary"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default WizardHeader;
