"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepIndicatorProps, StepStatus } from "./types";

/**
 * 스텝 인디케이터 컴포넌트
 *
 * 데스크톱: 숫자 + 라벨 + 연결선
 * 모바일: 프로그레스 바 + 도트
 */
export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  variant = "primary",
  onStepClick,
  className,
}: StepIndicatorProps) {
  const getStepStatus = (stepNumber: number): StepStatus => {
    if (completedSteps.includes(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "active";
    return "pending";
  };

  const isClickable = (stepNumber: number): boolean => {
    return (
      !!onStepClick &&
      (completedSteps.includes(stepNumber) || stepNumber < currentStep)
    );
  };

  const progress = Math.round(((currentStep - 1) / steps.length) * 100);

  return (
    <nav aria-label="진행 단계" className={cn("mb-8", className)}>
      {/* 데스크톱 버전 */}
      <ol className="hidden md:flex items-center justify-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          const clickable = isClickable(stepNumber);
          const isLast = index === steps.length - 1;

          return (
            <li key={stepNumber} className="flex items-center">
              {/* 스텝 아이템 */}
              <button
                type="button"
                onClick={() => clickable && onStepClick?.(stepNumber)}
                disabled={!clickable}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200",
                  status === "completed" && [
                    "cursor-pointer",
                    variant === "primary"
                      ? "bg-primary/10 hover:bg-primary/20"
                      : "bg-secondary/10 hover:bg-secondary/20",
                  ],
                  status === "active" && [
                    variant === "primary"
                      ? "bg-primary text-white shadow-lg"
                      : "bg-secondary text-white shadow-lg",
                  ],
                  status === "pending" && "bg-gray-100 text-gray-400",
                  !clickable && status !== "active" && "cursor-default"
                )}
                aria-current={status === "active" ? "step" : undefined}
              >
                {/* 번호/체크 아이콘 */}
                <span
                  className={cn(
                    "w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-bold transition-all",
                    status === "completed" && [
                      "text-white",
                      variant === "primary" ? "bg-primary" : "bg-secondary",
                    ],
                    status === "active" && [
                      variant === "primary"
                        ? "bg-white text-primary"
                        : "bg-white text-secondary",
                    ],
                    status === "pending" && "bg-gray-200 text-gray-500"
                  )}
                >
                  {status === "completed" ? (
                    <Check className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
                  ) : (
                    stepNumber
                  )}
                </span>

                {/* 라벨 */}
                <span
                  className={cn(
                    "text-lg md:text-xl font-semibold whitespace-nowrap",
                    status === "completed" && [
                      variant === "primary" ? "text-primary" : "text-secondary",
                    ],
                    status === "active" && "text-white",
                    status === "pending" && "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* 연결선 */}
              {!isLast && (
                <div
                  className={cn(
                    "w-8 lg:w-12 h-1 mx-2 rounded-full transition-all duration-300",
                    status === "completed" || stepNumber < currentStep
                      ? variant === "primary"
                        ? "bg-primary"
                        : "bg-secondary"
                      : "bg-gray-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* 모바일 버전 */}
      <div className="md:hidden">
        {/* 현재 단계 표시 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-gray-900">
            {steps[currentStep - 1]?.label}
          </span>
          <span className="text-lg text-gray-500">
            {currentStep} / {steps.length}
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              variant === "primary" ? "bg-primary" : "bg-secondary"
            )}
            style={{ width: `${Math.max(progress, 5)}%` }}
          />
        </div>

        {/* 스텝 도트 */}
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const status = getStepStatus(stepNumber);
            const clickable = isClickable(stepNumber);

            return (
              <button
                key={stepNumber}
                type="button"
                onClick={() => clickable && onStepClick?.(stepNumber)}
                disabled={!clickable}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all",
                  status === "completed" && [
                    "text-white",
                    variant === "primary" ? "bg-primary" : "bg-secondary",
                  ],
                  status === "active" && [
                    "text-white ring-4",
                    variant === "primary"
                      ? "bg-primary ring-primary/20"
                      : "bg-secondary ring-secondary/20",
                  ],
                  status === "pending" && "bg-gray-200 text-gray-500",
                  !clickable && "cursor-default"
                )}
                aria-label={`${step.label} (${stepNumber}단계)`}
              >
                {status === "completed" ? (
                  <Check className="w-5 h-5" strokeWidth={3} />
                ) : (
                  stepNumber
                )}
              </button>
            );
          })}
        </div>

        {/* 설명 (있는 경우) */}
        {steps[currentStep - 1]?.description && (
          <p className="mt-4 text-base text-gray-500 text-center">
            {steps[currentStep - 1].description}
          </p>
        )}
      </div>
    </nav>
  );
}

export default StepIndicator;
