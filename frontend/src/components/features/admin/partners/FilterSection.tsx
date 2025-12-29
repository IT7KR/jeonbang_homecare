"use client";

import { StatsCards, type StatsCardItem } from "@/components/admin";
import {
  UnifiedSearchInput,
  FilterChips,
  AdvancedFilters,
  type FilterChip,
  type SearchType,
} from "@/components/admin/filters";
import type { ServiceCategoryWithTypes } from "@/lib/api/services";

interface FilterSectionProps {
  // 검색
  searchQuery: string;
  onSearch: (query: string, type: SearchType) => void;

  // 고급 필터
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  serviceCategories: ServiceCategoryWithTypes[];
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;

  // 필터 칩
  filterChips: FilterChip[];
  onClearAllFilters: () => void;

  // 상태 카드
  statusCards: StatsCardItem[];
  activeStatus: string;
  onStatusCardClick: (status: string) => void;
}

export function FilterSection({
  searchQuery,
  onSearch,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  serviceCategories,
  selectedServices,
  onServicesChange,
  filterChips,
  onClearAllFilters,
  statusCards,
  activeStatus,
  onStatusCardClick,
}: FilterSectionProps) {
  return (
    <div className="space-y-4">
      {/* 통합 검색창 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <UnifiedSearchInput
          placeholder="회사명, 대표자, 연락처로 검색..."
          onSearch={onSearch}
          defaultValue={searchQuery}
        />
      </div>

      {/* 고급 필터 */}
      <AdvancedFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        serviceCategories={serviceCategories}
        selectedServices={selectedServices}
        onServicesChange={onServicesChange}
      />

      {/* 활성 필터 칩 */}
      {filterChips.length > 0 && (
        <FilterChips chips={filterChips} onClearAll={onClearAllFilters} />
      )}

      {/* 상태 카드 */}
      <StatsCards
        cards={statusCards}
        activeStatus={activeStatus}
        onCardClick={onStatusCardClick}
      />
    </div>
  );
}
