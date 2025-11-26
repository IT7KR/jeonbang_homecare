"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { WizardContainerProps } from "./types";

/**
 * 마법사 컨테이너 컴포넌트
 *
 * 전체 마법사 레이아웃을 감싸며,
 * 모바일/데스크톱 반응형 패딩과 최대 너비를 제공합니다.
 */
export function WizardContainer({
  children,
  variant = "primary",
  className,
}: WizardContainerProps) {
  return (
    <div
      className={cn(
        "wizard-container",
        // 하단 네비게이션 공간 확보
        "pb-40 md:pb-32",
        className
      )}
    >
      <div
        className={cn(
          "wizard-content",
          // 최대 너비 및 중앙 정렬
          "max-w-7xl mx-auto",
          // 반응형 패딩
          "px-4 py-6 md:px-6 md:py-8 lg:px-8"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default WizardContainer;
