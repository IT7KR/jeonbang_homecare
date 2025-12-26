"use client";

import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardNavigationProps } from "./types";

/**
 * 마법사 하단 고정 네비게이션 컴포넌트
 *
 * 모바일/데스크톱 모두 하단에 고정되며,
 * 이전/다음/제출 버튼을 제공합니다.
 */
export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
  prevLabel = "이전",
  nextLabel = "다음",
  submitLabel = "제출하기",
  showPrev = true,
  isNextDisabled = false,
  isSubmitDisabled = false,
  isSubmitting = false,
  isFirstStep = false,
  isLastStep = false,
  showPhoneButton = true,
  phoneNumber = "031-771-7114",
  variant = "primary",
  className,
  showProgressPercentage = false,
}: WizardNavigationProps) {
  // 진행률 계산 (현재 스텝 기준)
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);
  const handlePrev = () => {
    if (!isFirstStep && onPrev) {
      onPrev();
    }
  };

  const handleNext = () => {
    if (!isLastStep && onNext) {
      onNext();
    }
  };

  const handleSubmit = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className={cn("sticky-nav", className)}>
      <div className="sticky-nav-content">
        {/* 진행 상태 요약 (모바일) */}
        <div className="md:hidden flex items-center justify-center gap-3 mb-3">
          <span className="text-[14px] text-gray-500">
            {currentStep} / {totalSteps} 단계
          </span>
          {showProgressPercentage && (
            <>
              <span className="text-gray-300">|</span>
              <span
                className={cn(
                  "text-[14px] font-semibold",
                  variant === "primary" ? "text-primary" : "text-secondary"
                )}
              >
                {progressPercentage}% 완료
              </span>
            </>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-3">
          {/* 이전 버튼 */}
          {showPrev && !isFirstStep && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className={cn(
                "btn-senior-outline",
                "flex-none w-auto md:min-w-[120px]",
                "flex items-center justify-center flex-nowrap",
                "disabled:opacity-50"
              )}
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">
                {prevLabel}
              </span>
            </button>
          )}

          {/* Spacer (첫 번째 스텝에서 버튼을 오른쪽으로) */}
          {isFirstStep && <div className="flex-1" />}

          {/* 다음/제출 버튼 */}
          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled || isSubmitting}
              className={cn(
                "flex-1 md:flex-none md:min-w-[160px]",
                "btn-senior-lg",
                variant === "primary"
                  ? "btn-senior-primary"
                  : "btn-senior-secondary",
                "shadow-md hover:shadow-lg transition-shadow"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <span>{submitLabel}</span>
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled || isSubmitting}
              className={cn(
                "flex-1 md:flex-none md:min-w-[160px]",
                "btn-senior-lg",
                variant === "primary"
                  ? "btn-senior-primary"
                  : "btn-senior-secondary",
                "shadow-md hover:shadow-lg transition-shadow"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <span>{nextLabel}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WizardNavigation;
