"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import type { ServiceCategoryWithTypes } from "@/lib/api/services";

// 서비스 카테고리별 필터 컴포넌트 (API 데이터 사용)
function ServiceCategoryFilter({
  categories,
  selectedServices,
  onServiceToggle,
}: {
  categories: ServiceCategoryWithTypes[];
  selectedServices: string[];
  onServiceToggle: (serviceCode: string) => void;
}) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // 활성 서비스가 있는 카테고리만 필터링
  const activeCategories = categories.filter((cat) => cat.services.length > 0);

  const toggleCategory = (categoryCode: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryCode)
        ? prev.filter((code) => code !== categoryCode)
        : [...prev, categoryCode]
    );
  };

  const getSelectedCountInCategory = (services: { code: string }[]) => {
    return services.filter((service) =>
      selectedServices.includes(service.code)
    ).length;
  };

  const toggleAllInCategory = (services: { code: string }[]) => {
    const serviceCodes = services.map((s) => s.code);
    const allSelected = serviceCodes.every((code) =>
      selectedServices.includes(code)
    );

    serviceCodes.forEach((code) => {
      const isSelected = selectedServices.includes(code);
      if (allSelected && isSelected) {
        onServiceToggle(code);
      } else if (!allSelected && !isSelected) {
        onServiceToggle(code);
      }
    });
  };

  return (
    <div className="space-y-1 max-h-80 overflow-y-auto">
      {activeCategories.map((category) => {
        const isExpanded = expandedCategories.includes(category.code);
        const selectedCount = getSelectedCountInCategory(category.services);
        const totalCount = category.services.length;

        return (
          <div key={category.code} className="rounded-lg border bg-background">
            {/* 카테고리 헤더 */}
            <button
              type="button"
              onClick={() => toggleCategory(category.code)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                <span className="font-medium">{category.name}</span>
                {selectedCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {selectedCount}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">{totalCount}개</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>

            {/* 서비스 목록 */}
            {isExpanded && (
              <div className="border-t px-3 py-2">
                {/* 전체 선택/해제 */}
                {totalCount > 1 && (
                  <button
                    type="button"
                    onClick={() => toggleAllInCategory(category.services)}
                    className="mb-2 text-xs text-primary hover:underline"
                  >
                    {selectedCount === totalCount ? "전체 해제" : "전체 선택"}
                  </button>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {category.services.map((service) => (
                    <label
                      key={service.code}
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        selectedServices.includes(service.code)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={selectedServices.includes(service.code)}
                        onCheckedChange={() => onServiceToggle(service.code)}
                        className="sr-only"
                      />
                      {selectedServices.includes(service.code) && (
                        <Check className="h-3 w-3" />
                      )}
                      {service.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface AdvancedFiltersProps {
  // 날짜 범위
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;

  // 서비스 필터 - API에서 가져온 카테고리 데이터
  serviceCategories: ServiceCategoryWithTypes[];
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;

  // 담당자 필터 (선택적)
  admins?: { id: number; name: string }[];
  selectedAdminId?: number | null;
  onAdminChange?: (adminId: number | null) => void;

  // 협력사 필터 (선택적)
  partners?: { id: number; name: string }[];
  selectedPartnerId?: number | null;
  onPartnerChange?: (partnerId: number | null) => void;

  // 지역 필터 (선택적)
  regions?: string[];
  selectedRegion?: string | null;
  onRegionChange?: (region: string | null) => void;

  className?: string;
}

export function AdvancedFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  serviceCategories,
  selectedServices,
  onServicesChange,
  admins,
  selectedAdminId,
  onAdminChange,
  partners,
  selectedPartnerId,
  onPartnerChange,
  regions,
  selectedRegion,
  onRegionChange,
  className,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    dateFrom !== undefined ||
    dateTo !== undefined ||
    selectedServices.length > 0 ||
    selectedAdminId !== undefined ||
    selectedPartnerId !== undefined ||
    selectedRegion !== undefined;

  const handleServiceToggle = (serviceCode: string) => {
    if (selectedServices.includes(serviceCode)) {
      onServicesChange(selectedServices.filter((s) => s !== serviceCode));
    } else {
      onServicesChange([...selectedServices, serviceCode]);
    }
  };

  const handleClearAll = () => {
    onDateFromChange(undefined);
    onDateToChange(undefined);
    onServicesChange([]);
    onAdminChange?.(null);
    onPartnerChange?.(null);
    onRegionChange?.(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* 토글 버튼 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-2",
            hasActiveFilters && "border-primary text-primary"
          )}
        >
          <Filter className="h-4 w-4" />
          <span>필터</span>
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {[
                dateFrom || dateTo ? 1 : 0,
                selectedServices.length > 0 ? 1 : 0,
                selectedAdminId ? 1 : 0,
                selectedPartnerId ? 1 : 0,
                selectedRegion ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-4 w-4" />
            초기화
          </Button>
        )}
      </div>

      {/* 필터 패널 */}
      {isExpanded && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 날짜 범위 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">날짜 범위</Label>
              <DateRangePicker
                from={dateFrom}
                to={dateTo}
                onFromChange={onDateFromChange}
                onToChange={onDateToChange}
                placeholder="날짜 선택"
              />
            </div>

            {/* 서비스 종류 - API 카테고리 데이터 사용 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">서비스 종류</Label>
                {selectedServices.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedServices.length}개 선택됨
                  </span>
                )}
              </div>
              <ServiceCategoryFilter
                categories={serviceCategories}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceToggle}
              />
            </div>

            {/* 담당자 (선택적) */}
            {admins && admins.length > 0 && onAdminChange && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">담당자</Label>
                <select
                  value={selectedAdminId || ""}
                  onChange={(e) =>
                    onAdminChange(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">전체</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 협력사 (선택적) */}
            {partners && partners.length > 0 && onPartnerChange && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">협력사</Label>
                <select
                  value={selectedPartnerId || ""}
                  onChange={(e) =>
                    onPartnerChange(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">전체</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 지역 (선택적) */}
            {regions && regions.length > 0 && onRegionChange && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">지역</Label>
                <select
                  value={selectedRegion || ""}
                  onChange={(e) => onRegionChange(e.target.value || null)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">전체</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
