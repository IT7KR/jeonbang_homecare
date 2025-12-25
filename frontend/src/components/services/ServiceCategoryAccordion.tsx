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
import { ServiceCheckboxItem } from "./ServiceCheckboxItem";
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
  seniorMode = false,
  compactMode = false,
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
        "rounded-xl border overflow-hidden",
        "transition-[border-color,box-shadow] duration-150",
        selectedCount > 0
          ? isPrimary
            ? "border-primary/40 shadow-sm"
            : "border-secondary/40 shadow-sm"
          : "border-gray-200",
        className
      )}
    >
      {/* 카테고리 헤더 - 컴팩트 */}
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-controls={`category-content-${id}`}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-3",
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
        <div className="flex items-center gap-3">
          {/* 아이콘 */}
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              selectedCount > 0
                ? isPrimary
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary/15 text-secondary"
                : "bg-gray-100 text-gray-500"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          {/* 카테고리 이름 */}
          <div className="text-left">
            <span
              className={cn(
                "block text-base font-semibold",
                selectedCount > 0 ? "text-gray-900" : "text-gray-700"
              )}
            >
              {name}
            </span>
            <span className="block text-xs text-gray-500">
              {services.length}개 항목
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 선택 카운트 뱃지 */}
          {selectedCount > 0 && (
            <div
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                isPrimary
                  ? "bg-primary text-white"
                  : "bg-secondary text-white"
              )}
            >
              {selectedCount}개
            </div>
          )}

          {/* 확장/축소 아이콘 */}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "transition-colors duration-150",
              isExpanded ? "bg-gray-200" : "bg-gray-100"
            )}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </div>
        </div>
      </button>

      {/* 서비스 목록 - 확장 시 표시 */}
      {isExpanded && (
        <div
          id={`category-content-${id}`}
          className={cn(
            "border-t p-3",
            selectedCount > 0
              ? isPrimary
                ? "border-primary/20 bg-white"
                : "border-secondary/20 bg-white"
              : "border-gray-100 bg-gray-50/50"
          )}
        >
          <div className={cn(
            "grid grid-cols-2 gap-2",
            // 컴팩트 모드가 아닐 때만 반응형 3열 허용
            !compactMode && "lg:grid-cols-3"
          )}>
            {services.map((service) =>
              compactMode ? (
                <ServiceCheckboxItem
                  key={service.code}
                  code={service.code}
                  name={service.name}
                  isSelected={selectedServices.includes(service.code)}
                  onClick={() => handleServiceToggle(service.code)}
                  isActive={service.isActive !== false}
                  variant={variant}
                />
              ) : (
                <ServiceCard
                  key={service.code}
                  code={service.code}
                  name={service.name}
                  description={service.description}
                  isSelected={selectedServices.includes(service.code)}
                  onClick={() => handleServiceToggle(service.code)}
                  isActive={service.isActive !== false}
                  variant={variant}
                  seniorMode={seniorMode}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ServiceCategoryAccordion;
