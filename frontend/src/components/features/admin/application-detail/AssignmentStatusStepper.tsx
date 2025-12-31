"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ASSIGNMENT_STEPS, getAssignmentStepIndex } from "@/lib/constants/application";

interface AssignmentStatusStepperProps {
  currentStatus: string;
  className?: string;
}

/**
 * 배정 상태 스텝 인디케이터
 * 3단계: 대기 → 일정확정 → 완료
 */
export function AssignmentStatusStepper({
  currentStatus,
  className,
}: AssignmentStatusStepperProps) {
  const currentIndex = getAssignmentStepIndex(currentStatus);

  // 유효하지 않은 상태 (레거시 상태 등)
  if (currentIndex === -1) {
    return (
      <div className={cn("px-3 py-2 rounded-lg bg-gray-50", className)}>
        <span className="text-sm font-medium text-gray-500">
          {currentStatus}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {ASSIGNMENT_STEPS.map((step, index) => (
        <React.Fragment key={step.status}>
          {/* 스텝 노드 */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                index < currentIndex
                  ? "bg-primary text-white" // 완료된 단계
                  : index === currentIndex
                  ? "bg-primary-100 text-primary border-2 border-primary" // 현재 단계
                  : "bg-gray-100 text-gray-400" // 미래 단계
              )}
            >
              {index < currentIndex ? (
                <Check size={12} strokeWidth={3} />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                "text-[10px] mt-1 whitespace-nowrap",
                index <= currentIndex ? "text-primary font-medium" : "text-gray-400"
              )}
            >
              {step.label}
            </span>
          </div>

          {/* 연결선 */}
          {index < ASSIGNMENT_STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 min-w-4 mx-0.5 transition-colors",
                index < currentIndex ? "bg-primary" : "bg-gray-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default AssignmentStatusStepper;
