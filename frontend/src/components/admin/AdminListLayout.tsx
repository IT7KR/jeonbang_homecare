"use client";

import { ReactNode } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ===== 타입 정의 =====

export interface FilterOption {
  value: string;
  label: string;
}

export interface ColumnDef<T> {
  key: string;
  header: string;
  headerClassName?: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface AdminListLayoutProps<T> {
  // 헤더
  title: string;
  subtitle?: string | ReactNode;
  headerAction?: ReactNode;

  // 필터
  statusOptions?: FilterOption[];
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  additionalFilters?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  hideFilters?: boolean; // 기본 필터 섹션 숨김 옵션

  // 상태
  isLoading: boolean;
  error: string | null;

  // 테이블
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyIcon: ReactNode;
  emptyMessage: string;
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string; // 행별 스타일링

  // 페이지네이션
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  unitLabel?: string; // "건", "명", "개" 등

  // 추가 컨텐츠
  beforeTable?: ReactNode;
  afterPagination?: ReactNode;
}

// ===== 서브 컴포넌트 =====

function PageHeader({
  title,
  subtitle,
  headerAction,
}: {
  title: string;
  subtitle?: string | ReactNode;
  headerAction?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <div className="text-gray-500 mt-1">{subtitle}</div>
        )}
      </div>
      {headerAction}
    </div>
  );
}

function FilterSection({
  statusOptions,
  statusFilter,
  onStatusFilterChange,
  additionalFilters,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearch,
  onPageReset,
}: {
  statusOptions: FilterOption[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  additionalFilters?: ReactNode;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onPageReset: () => void;
}) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusFilterChange(e.target.value);
    onPageReset();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
    onPageReset();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
            <Filter size={16} className="text-gray-500" />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="min-w-[140px] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Filters */}
        {additionalFilters}

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={searchPlaceholder || "검색..."}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <span className="text-red-500">!</span>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
      </div>
    </div>
  );
}

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyIcon,
  emptyMessage,
  onRowClick,
  getRowClassName,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyIcon: ReactNode;
  emptyMessage: string;
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      {emptyIcon}
                    </div>
                    <p className="text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={`hover:bg-gray-50/50 transition-colors ${onRowClick ? "cursor-pointer" : ""} ${getRowClassName?.(item) || ""}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={`${keyExtractor(item)}-${col.key}`}
                      className={col.className || "px-5 py-4"}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  unitLabel = "건",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  unitLabel?: string;
}) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3">
      <p className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">{total}</span>
        {unitLabel} 중{" "}
        <span className="font-medium text-gray-700">
          {startItem}-{endItem}
        </span>
        {unitLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <span className="px-3 text-sm font-medium text-gray-700">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}

// ===== 메인 컴포넌트 =====

export function AdminListLayout<T>({
  title,
  subtitle,
  headerAction,
  statusOptions = [],
  statusFilter = "",
  onStatusFilterChange = () => {},
  additionalFilters,
  searchPlaceholder,
  searchValue = "",
  onSearchChange = () => {},
  onSearch = () => {},
  hideFilters = false,
  isLoading,
  error,
  columns,
  data,
  keyExtractor,
  emptyIcon,
  emptyMessage,
  onRowClick,
  getRowClassName,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  unitLabel,
  beforeTable,
  afterPagination,
}: AdminListLayoutProps<T>) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        headerAction={headerAction}
      />

      {!hideFilters && (
        <FilterSection
          statusOptions={statusOptions}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          additionalFilters={additionalFilters}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSearch={onSearch}
          onPageReset={() => onPageChange(1)}
        />
      )}

      {error && <ErrorMessage message={error} />}

      {beforeTable}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={keyExtractor}
            emptyIcon={emptyIcon}
            emptyMessage={emptyMessage}
            onRowClick={onRowClick}
            getRowClassName={getRowClassName}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
            unitLabel={unitLabel}
          />
        </>
      )}

      {afterPagination}
    </div>
  );
}

// 개별 컴포넌트도 export
export { PageHeader, FilterSection, ErrorMessage, LoadingSpinner, DataTable, Pagination };
