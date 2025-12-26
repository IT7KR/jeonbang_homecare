"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
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
  MoreHorizontal,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping
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

// Types for API response (apply page)
interface ServiceItem {
  code: string;
  name: string;
}

interface CategoryItem {
  code: string;
  name: string;
  icon?: string | null;
  services: ServiceItem[];
}

// Types for constants (partner page)
interface ConstantCategory {
  id: string;
  name: string;
  subtitle?: string;
  icon?: string;
  services: readonly string[];
}

interface ServiceSelectorBaseProps {
  selectedServices: string[];
  onServiceToggle: (service: string) => void;
  isLoading?: boolean;
  error?: string;
  variant?: "primary" | "secondary";
}

interface ApiServiceSelectorProps extends ServiceSelectorBaseProps {
  categories: CategoryItem[];
  constantCategories?: never;
}

interface ConstantServiceSelectorProps extends ServiceSelectorBaseProps {
  constantCategories: readonly ConstantCategory[];
  categories?: never;
}

type ServiceSelectorProps = ApiServiceSelectorProps | ConstantServiceSelectorProps;

export function ServiceSelector(props: ServiceSelectorProps) {
  const {
    selectedServices,
    onServiceToggle,
    isLoading = false,
    error,
    variant = "primary",
  } = props;

  const isPrimary = variant === "primary";

  // Track expanded categories (default: first 3 expanded)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Determine if we're using API data or constant data
  const isApiData = "categories" in props && props.categories;
  const isConstantData = "constantCategories" in props && props.constantCategories;

  // Get categories list
  const categoriesList = isApiData
    ? props.categories
    : isConstantData
    ? props.constantCategories
    : [];

  // Initialize first 3 categories as expanded
  useEffect(() => {
    if (categoriesList.length > 0 && expandedCategories.size === 0) {
      const initialExpanded = new Set<string>();
      categoriesList.slice(0, 3).forEach((cat) => {
        const id = "code" in cat ? cat.code : cat.id;
        initialExpanded.add(id);
      });
      setExpandedCategories(initialExpanded);
    }
  }, [categoriesList]);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Expand all categories
  const expandAll = () => {
    const allIds = new Set<string>();
    categoriesList.forEach((cat) => {
      const id = "code" in cat ? cat.code : cat.id;
      allIds.add(id);
    });
    setExpandedCategories(allIds);
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Count selected services per category
  const getSelectedCount = (categoryId: string): number => {
    if (isApiData) {
      const category = props.categories.find((c) => c.code === categoryId);
      if (!category) return 0;
      return category.services.filter((s) => selectedServices.includes(s.code)).length;
    } else if (isConstantData) {
      const category = props.constantCategories.find((c) => c.id === categoryId);
      if (!category) return 0;
      return category.services.filter((s) => selectedServices.includes(s)).length;
    }
    return 0;
  };

  // Get services for a category
  const getServices = (categoryId: string): Array<{ code: string; name: string }> => {
    if (isApiData) {
      const category = props.categories.find((c) => c.code === categoryId);
      return category?.services || [];
    } else if (isConstantData) {
      const category = props.constantCategories.find((c) => c.id === categoryId);
      return (category?.services || []).map((s) => ({ code: s, name: s }));
    }
    return [];
  };

  // Get total selected count
  const totalSelected = selectedServices.length;

  // Get selected service names for display
  const getSelectedServiceNames = (): string[] => {
    const names: string[] = [];
    categoriesList.forEach((cat) => {
      const services = getServices("code" in cat ? cat.code : cat.id);
      services.forEach((s) => {
        if (selectedServices.includes(s.code)) {
          names.push(s.name);
        }
      });
    });
    return names;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary"></div>
        <span className="ml-4 text-xl text-gray-600">서비스 목록을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-gray-500 text-center py-8 text-xl">{error}</p>
    );
  }

  const selectedNames = getSelectedServiceNames();
  const allExpanded = expandedCategories.size === categoriesList.length;

  return (
    <div className="space-y-6">
      {/* Step 1: Instructions */}
      <div className={cn(
        "rounded-2xl p-5 border-2",
        isPrimary ? "bg-primary/5 border-primary/20" : "bg-secondary/5 border-secondary/20"
      )}>
        <p className={cn(
          "text-xl font-bold",
          isPrimary ? "text-primary" : "text-secondary"
        )}>
          아래 목록에서 원하시는 서비스를 선택해 주세요
        </p>
        <p className="text-base text-gray-600 mt-2">
          여러 개를 선택할 수 있습니다. 서비스 항목을 누르면 선택됩니다.
        </p>
      </div>

      {/* Selection Summary - Fixed Banner Style */}
      <div className={cn(
        "rounded-2xl p-5 border-2",
        totalSelected > 0
          ? isPrimary
            ? "bg-primary/10 border-primary"
            : "bg-secondary/10 border-secondary"
          : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg",
              totalSelected > 0
                ? isPrimary
                  ? "bg-primary text-white"
                  : "bg-secondary text-white"
                : "bg-gray-300 text-gray-600"
            )}>
              {totalSelected}
            </div>
            <div>
              <p className={cn(
                "text-xl font-bold",
                totalSelected > 0 ? "text-gray-900" : "text-gray-500"
              )}>
                {totalSelected > 0 ? "개 서비스 선택됨" : "선택된 서비스 없음"}
              </p>
              {totalSelected > 0 && selectedNames.length <= 5 && (
                <p className="text-base text-gray-600 mt-1">
                  {selectedNames.join(", ")}
                </p>
              )}
              {totalSelected > 5 && (
                <p className="text-base text-gray-600 mt-1">
                  {selectedNames.slice(0, 3).join(", ")} 외 {totalSelected - 3}개
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expand/Collapse All Toggle */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={allExpanded ? collapseAll : expandAll}
          className={cn(
            "px-4 py-2 rounded-lg text-base font-medium transition-colors",
            "border-2 hover:shadow-sm",
            isPrimary
              ? "border-primary/30 text-primary hover:bg-primary/5"
              : "border-secondary/30 text-secondary hover:bg-secondary/5"
          )}
        >
          {allExpanded ? "모두 접기" : "모두 펼치기"}
        </button>
      </div>

      {/* Category Sections - All Visible */}
      <div className="space-y-4">
        {categoriesList.map((category, index) => {
          const id = "code" in category ? category.code : category.id;
          const name = category.name;
          const icon = category.icon;
          const Icon = icon && iconMap[icon] ? iconMap[icon] : MoreHorizontal;
          const selectedCount = getSelectedCount(id);
          const services = getServices(id);
          const isExpanded = expandedCategories.has(id);

          return (
            <div
              key={id}
              ref={(el) => { categoryRefs.current[id] = el; }}
              className={cn(
                "rounded-2xl border-2 overflow-hidden transition-all",
                selectedCount > 0
                  ? isPrimary
                    ? "border-primary/50 shadow-md"
                    : "border-secondary/50 shadow-md"
                  : "border-gray-200"
              )}
            >
              {/* Category Header - Always Visible, Clickable */}
              <button
                type="button"
                onClick={() => toggleCategory(id)}
                className={cn(
                  "w-full px-5 py-4 flex items-center justify-between transition-colors",
                  "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset",
                  selectedCount > 0
                    ? isPrimary
                      ? "bg-primary/5 focus:ring-primary"
                      : "bg-secondary/5 focus:ring-secondary"
                    : "bg-white focus:ring-gray-400"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Category Number */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
                    selectedCount > 0
                      ? isPrimary
                        ? "bg-primary text-white"
                        : "bg-secondary text-white"
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    selectedCount > 0
                      ? isPrimary
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary/20 text-secondary"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Name */}
                  <div className="text-left">
                    <span className={cn(
                      "font-bold text-xl",
                      selectedCount > 0 ? "text-gray-900" : "text-gray-700"
                    )}>
                      {name}
                    </span>
                    <span className="text-base text-gray-500 ml-3">
                      ({services.length}개 항목)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Selection Count Badge */}
                  {selectedCount > 0 && (
                    <div className={cn(
                      "px-4 py-2 rounded-full text-base font-bold",
                      isPrimary
                        ? "bg-primary text-white"
                        : "bg-secondary text-white"
                    )}>
                      {selectedCount}개 선택
                    </div>
                  )}

                  {/* Expand/Collapse Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-transform",
                    "bg-gray-100",
                    isExpanded && "bg-gray-200"
                  )}>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                </div>
              </button>

              {/* Services Grid - Expandable */}
              {isExpanded && (
                <div className={cn(
                  "p-5 border-t-2",
                  selectedCount > 0
                    ? isPrimary
                      ? "border-primary/20 bg-white"
                      : "border-secondary/20 bg-white"
                    : "border-gray-100 bg-gray-50/50"
                )}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {services.map((service) => {
                      const isSelected = selectedServices.includes(service.code);
                      return (
                        <ServiceButton
                          key={service.code}
                          label={service.name}
                          isSelected={isSelected}
                          onClick={() => onServiceToggle(service.code)}
                          isPrimary={isPrimary}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Summary */}
      {totalSelected > 0 && (
        <div className={cn(
          "rounded-2xl p-5 text-center",
          isPrimary ? "bg-primary/10" : "bg-secondary/10"
        )}>
          <p className="text-xl font-bold text-gray-900">
            총 <span className={isPrimary ? "text-primary" : "text-secondary"}>{totalSelected}개</span> 서비스가 선택되었습니다
          </p>
          <p className="text-base text-gray-600 mt-2">
            아래 정보를 입력하고 신청해 주세요
          </p>
        </div>
      )}
    </div>
  );
}

// Service selection button component - Large and Clear
function ServiceButton({
  label,
  isSelected,
  onClick,
  isPrimary,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  isPrimary: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left w-full",
        "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2",
        "min-h-[64px]",
        isSelected
          ? isPrimary
            ? "border-primary bg-primary/10 ring-2 ring-primary/30 focus:ring-primary"
            : "border-secondary bg-secondary/10 ring-2 ring-secondary/30 focus:ring-secondary"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-400"
      )}
    >
      {/* Large Checkbox */}
      <div className={cn(
        "w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
        isSelected
          ? isPrimary
            ? "border-primary bg-primary text-white"
            : "border-secondary bg-secondary text-white"
          : "border-gray-300 bg-white"
      )}>
        {isSelected && <Check className="w-5 h-5" strokeWidth={3} />}
      </div>

      {/* Label - Large and Bold when selected */}
      <span className={cn(
        "text-lg",
        isSelected
          ? "font-bold text-gray-900"
          : "font-medium text-gray-700"
      )}>
        {label}
      </span>
    </button>
  );
}
