"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FABProps {
  className?: string;
}

export function FAB({ className }: FABProps) {
  return (
    <div className={cn("fixed bottom-6 right-4 md:right-6 z-40", className)}>
      {/* 견적 요청 플로팅 버튼 - 40대 후반+ 사용자 고려 */}
      <Link
        href={ROUTES.APPLY}
        className={cn(
          // 기본 스타일
          "flex items-center gap-2 md:gap-3",
          "bg-primary hover:bg-primary/90 text-white",
          "rounded-full shadow-2xl",
          "transition-all duration-200 hover:scale-105",
          // 크기 - 터치 친화적 (최소 48px 이상)
          "h-14 md:h-16 px-5 md:px-7",
          // 글씨 크기 - 시니어 친화적
          "text-lg md:text-xl font-bold",
          // 그림자 효과
          "shadow-primary/40"
        )}
      >
        <ClipboardList className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0" />
        <span>견적 요청</span>
      </Link>
    </div>
  );
}
