"use client";

import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardNavigationProps } from "./types";

/**
 * 마법사 하단 고정 네비게이션 컴포넌트
 *
 * 모바일/데스크톱 모두 하단에 고정되며,
 * 이전/다음/제출 버튼과 전화 문의 링크를 제공합니다.
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
}: WizardNavigationProps) {
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
        <div className="md:hidden flex items-center justify-center mb-3">
          <span className="text-[14px] text-gray-500">
            {currentStep} / {totalSteps} 단계
          </span>
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
                "flex-none w-auto md:w-32",
                "disabled:opacity-50"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{prevLabel}</span>
            </button>
          )}

          {/* 전화 문의 버튼 (데스크톱에서는 왼쪽에 표시) */}
          {showPhoneButton && (
            <a
              href={`tel:${phoneNumber.replace(/-/g, "")}`}
              className={cn(
                "hidden md:flex items-center gap-2 px-4 py-2 rounded-lg",
                "text-[14px] text-gray-600 hover:text-gray-800 hover:bg-gray-100",
                "transition-colors",
                !isFirstStep && "ml-auto mr-4"
              )}
            >
              <Phone className="w-4 h-4" />
              <span>전화 문의: {phoneNumber}</span>
            </a>
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
                "flex-1 md:flex-none md:min-w-[200px]",
                "btn-senior-lg",
                variant === "primary" ? "btn-senior-primary" : "btn-senior-secondary",
                "shadow-lg hover:shadow-xl transition-shadow"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <span>{submitLabel}</span>
                  <CheckCircle2 className="w-6 h-6" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled || isSubmitting}
              className={cn(
                "flex-1 md:flex-none md:min-w-[200px]",
                "btn-senior-lg",
                variant === "primary" ? "btn-senior-primary" : "btn-senior-secondary",
                "shadow-lg hover:shadow-xl transition-shadow"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <span>{nextLabel}</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          )}
        </div>

        {/* 전화 문의 (모바일) */}
        {showPhoneButton && (
          <div className="md:hidden mt-3 text-center">
            <a
              href={`tel:${phoneNumber.replace(/-/g, "")}`}
              className="inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-700"
            >
              <Phone className="w-4 h-4" />
              <span>전화 문의: {phoneNumber}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default WizardNavigation;
