"use client";

import { Trees, Sofa, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_GROUPS, type ServiceGroupId } from "@/lib/constants/services";
import type { ServiceGroupTabsProps } from "./types";

// 아이콘 매핑
const iconMap: Record<string, React.ElementType> = {
  Trees,
  Sofa,
  Sparkles,
};

/**
 * 서비스 그룹 탭 컴포넌트
 *
 * 13개 카테고리를 3개 그룹으로 분류하여 표시합니다.
 * - 외부 관리: 건축, 외부 관리, 조경 공사, 외부 시설, 창호
 * - 실내 개선: 실내 가구, 화장실, 마감 공사, 설비, 전기
 * - 특화 서비스: 특화 서비스, 관리 서비스, 기타 작업
 */
export function ServiceGroupTabs({
  activeGroup,
  onGroupChange,
  selectedCounts,
  variant = "primary",
  layout = "horizontal",
  className,
}: ServiceGroupTabsProps) {
  const isPrimary = variant === "primary";
  const isVertical = layout === "vertical";

  return (
    <div
      className={cn(
        isVertical ? "flex flex-col gap-2" : "flex gap-2",
        className
      )}
      role="tablist"
      aria-label="서비스 그룹 선택"
    >
      {SERVICE_GROUPS.map((group) => {
        const Icon = iconMap[group.icon] || Trees;
        const isActive = activeGroup === group.id;
        const count = selectedCounts?.[group.id] ?? 0;

        return (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`group-panel-${group.id}`}
            onClick={() => onGroupChange(group.id)}
            className={cn(
              // 기본 스타일
              "relative flex items-center gap-3",
              "rounded-xl border-2",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              // 레이아웃별 스타일
              isVertical
                ? "w-full px-4 py-4 justify-start"
                : "flex-1 px-3 py-3 justify-center",
              // 활성/비활성 상태
              isActive
                ? [
                    isPrimary
                      ? "border-primary bg-primary/10 text-primary focus:ring-primary"
                      : "border-secondary bg-secondary/10 text-secondary focus:ring-secondary",
                    "shadow-sm",
                  ]
                : [
                    "border-gray-200 bg-white text-gray-600",
                    "hover:border-gray-300 hover:bg-gray-50",
                    "focus:ring-gray-400",
                  ]
            )}
          >
            {/* 아이콘 */}
            <div
              className={cn(
                "flex-shrink-0",
                isVertical ? "w-10 h-10" : "w-8 h-8",
                "rounded-lg flex items-center justify-center",
                isActive
                  ? isPrimary
                    ? "bg-primary/20"
                    : "bg-secondary/20"
                  : "bg-gray-100"
              )}
            >
              <Icon
                className={cn(
                  isVertical ? "w-5 h-5" : "w-4 h-4",
                  isActive
                    ? isPrimary
                      ? "text-primary"
                      : "text-secondary"
                    : "text-gray-500"
                )}
              />
            </div>

            {/* 텍스트 영역 */}
            <div
              className={cn(
                "flex flex-col",
                isVertical ? "items-start" : "items-center"
              )}
            >
              <span
                className={cn(
                  "font-semibold",
                  isVertical ? "text-[16px]" : "text-[14px]",
                  isActive ? "text-gray-900" : "text-gray-700"
                )}
              >
                {group.name}
              </span>

              {/* 선택 개수 (항상 표시) */}
              <span
                className={cn(
                  "text-[13px]",
                  count > 0
                    ? isActive
                      ? isPrimary
                        ? "text-primary font-medium"
                        : "text-secondary font-medium"
                      : "text-gray-500"
                    : "text-gray-400"
                )}
              >
                {count > 0 ? `${count}개 선택` : "선택 없음"}
              </span>
            </div>

            {/* 선택 개수 배지 (vertical 레이아웃에서만, 선택 있을 때) */}
            {isVertical && count > 0 && (
              <div
                className={cn(
                  "ml-auto px-3 py-1 rounded-full text-[13px] font-bold",
                  isPrimary
                    ? "bg-primary text-white"
                    : "bg-secondary text-white"
                )}
              >
                {count}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ServiceGroupTabs;
