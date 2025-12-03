"use client";

import { memo, useCallback } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import {
  Leaf,
  Trees,
  Fence,
  Sofa,
  Building2,
  Bath,
  PaintBucket,
  Droplets,
  Zap,
  DoorOpen,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceCard } from "./ServiceCard";
import type { ServiceCategoryAccordionProps } from "./types";

// 아이콘 매핑
const iconMap: Record<string, React.ElementType> = {
  Leaf,
  Trees,
  Fence,
  Sofa,
  Building2,
  Bath,
  PaintBucket,
  Droplets,
  Zap,
  DoorOpen,
  MoreHorizontal,
  Sparkles,
  CalendarCheck,
};

/**
 * 서비스 카테고리 아코디언 컴포넌트
 *
 * 카테고리별로 서비스를 그룹화하여 표시합니다.
 * 확장/축소 기능과 선택 카운트를 제공합니다.
 *
 * React.memo로 감싸서 불필요한 리렌더를 방지합니다.
 */
export const ServiceCategoryAccordion = memo(function ServiceCategoryAccordion({
  id,
  name,
  index,
  icon,
  services,
  selectedServices,
  onServiceToggle,
  isExpanded,
  onToggleExpand,
  variant = "primary",
  className,
}: ServiceCategoryAccordionProps) {
  const isPrimary = variant === "primary";
  const Icon = icon && iconMap[icon] ? iconMap[icon] : MoreHorizontal;

  // 현재 카테고리에서 선택된 서비스 수
  const selectedCount = services.filter((s) =>
    selectedServices.includes(s.code)
  ).length;

  // 서비스 토글 핸들러를 useCallback으로 메모이제이션
  const handleServiceToggle = useCallback(
    (code: string) => {
      onServiceToggle(code);
    },
    [onServiceToggle]
  );

  return (
    <div
      className={cn(
        "rounded-2xl border-2 overflow-hidden",
        // 전환 효과 - 테두리 색상만 전환 (깜빡임 방지)
        "transition-[border-color,box-shadow] duration-150",
        selectedCount > 0
          ? isPrimary
            ? "border-primary/50 shadow-md"
            : "border-secondary/50 shadow-md"
          : "border-gray-200",
        className
      )}
    >
      {/* 카테고리 헤더 - 항상 표시, 클릭 가능 */}
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-controls={`category-content-${id}`}
        className={cn(
          "w-full px-5 md:px-6 py-4 md:py-5",
          "flex items-center justify-between",
          // 전환 효과 - 배경색만 전환 (깜빡임 방지)
          "transition-colors duration-150",
          "hover:bg-gray-50",
          "focus:outline-none focus:ring-2 focus:ring-inset",
          selectedCount > 0
            ? isPrimary
              ? "bg-primary/5 focus:ring-primary"
              : "bg-secondary/5 focus:ring-secondary"
            : "bg-white focus:ring-gray-400"
        )}
      >
        <div className="flex items-center gap-4">
          {/* 카테고리 번호 */}
          <div
            className={cn(
              "w-11 h-11 md:w-12 md:h-12",
              "rounded-full",
              "flex items-center justify-center",
              "text-lg md:text-xl font-bold",
              selectedCount > 0
                ? isPrimary
                  ? "bg-primary text-white"
                  : "bg-secondary text-white"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {index + 1}
          </div>

          {/* 아이콘 */}
          <div
            className={cn(
              "w-12 h-12 md:w-14 md:h-14",
              "rounded-xl",
              "flex items-center justify-center",
              selectedCount > 0
                ? isPrimary
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary/20 text-secondary"
                : "bg-gray-100 text-gray-500"
            )}
          >
            <Icon className="w-6 h-6 md:w-7 md:h-7" />
          </div>

          {/* 카테고리 이름 */}
          <div className="text-left">
            <span
              className={cn(
                "block font-bold text-xl md:text-2xl",
                selectedCount > 0 ? "text-gray-900" : "text-gray-700"
              )}
            >
              {name}
            </span>
            <span className="block text-sm md:text-base text-gray-500 mt-0.5">
              {services.length}개 항목
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 선택 카운트 뱃지 */}
          {selectedCount > 0 && (
            <div
              className={cn(
                "px-4 py-2 rounded-full",
                "text-sm md:text-base font-bold",
                isPrimary
                  ? "bg-primary text-white"
                  : "bg-secondary text-white"
              )}
            >
              {selectedCount}개 선택
            </div>
          )}

          {/* 확장/축소 아이콘 */}
          <div
            className={cn(
              "w-10 h-10 md:w-11 md:h-11",
              "rounded-full",
              "flex items-center justify-center",
              // 전환 효과 - 배경색만 전환 (깜빡임 방지)
              "transition-colors duration-150",
              isExpanded ? "bg-gray-200" : "bg-gray-100"
            )}
          >
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-gray-600" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-600" />
            )}
          </div>
        </div>
      </button>

      {/* 서비스 목록 - 확장 시 표시 (애니메이션 제거하여 깜빡임 방지) */}
      {isExpanded && (
        <div
          id={`category-content-${id}`}
          className={cn(
            "p-5 border-t-2",
            selectedCount > 0
              ? isPrimary
                ? "border-primary/20 bg-white"
                : "border-secondary/20 bg-white"
              : "border-gray-100 bg-gray-50/50"
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((service) => (
              <ServiceCard
                key={service.code}
                code={service.code}
                name={service.name}
                description={service.description}
                isSelected={selectedServices.includes(service.code)}
                onClick={() => handleServiceToggle(service.code)}
                isActive={service.isActive !== false}
                variant={variant}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ServiceCategoryAccordion;
