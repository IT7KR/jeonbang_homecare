"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getApplications,
  getDashboard,
  ApplicationListItem,
  DashboardStats,
} from "@/lib/api/admin";
import { getServices, type ServicesListResponse } from "@/lib/api/services";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/constants/status";
import { type FilterChip, type SearchType } from "@/components/admin/filters";
import { format } from "date-fns";

// Feature Flag
export const enableManualSMS = process.env.NEXT_PUBLIC_ENABLE_MANUAL_SMS === "true";

export interface StatusCard {
  status: string;
  label: string;
  count: number;
  needsAction: boolean;
  color: string;
  bgColor: string;
  textColor: string;
}

export function useApplications() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  // 기본 상태
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 대시보드 통계
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // 서비스 목록 (코드→이름 변환용)
  const [services, setServices] = useState<ServicesListResponse | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("auto");

  // Advanced Filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkSMSSheet, setShowBulkSMSSheet] = useState(false);
  const [showBulkAssignSheet, setShowBulkAssignSheet] = useState(false);

  // 서비스 목록 로드 (최초 1회)
  useEffect(() => {
    getServices().then(setServices).catch(console.error);
  }, []);

  // 서비스 코드→이름 변환 맵 생성
  const serviceNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (services) {
      services.categories.forEach((cat) => {
        cat.services.forEach((s) => {
          map.set(s.code, s.name);
        });
      });
    }
    return map;
  }, [services]);

  // 서비스 코드를 이름으로 변환하는 함수
  const getServiceName = useCallback(
    (code: string) => serviceNameMap.get(code) || code,
    [serviceNameMap]
  );

  // AdvancedFilters용 서비스 카테고리
  const serviceCategories = useMemo(() => {
    return services?.categories ?? [];
  }, [services]);

  // 활성 필터 칩 생성
  const filterChips = useMemo(() => {
    const chips: FilterChip[] = [];

    if (statusFilter) {
      const statusLabel = APPLICATION_STATUS_OPTIONS.find(
        (opt) => opt.value === statusFilter
      )?.label;
      chips.push({
        key: "status",
        label: `상태: ${statusLabel || statusFilter}`,
        onRemove: () => {
          setStatusFilter("");
          setPage(1);
        },
      });
    }

    if (dateFrom || dateTo) {
      const fromStr = dateFrom ? format(dateFrom, "MM/dd") : "";
      const toStr = dateTo ? format(dateTo, "MM/dd") : "";
      chips.push({
        key: "date",
        label: `기간: ${fromStr}${fromStr && toStr ? " ~ " : ""}${toStr}`,
        onRemove: () => {
          setDateFrom(undefined);
          setDateTo(undefined);
          setPage(1);
        },
      });
    }

    selectedServices.forEach((serviceCode) => {
      const serviceName = getServiceName(serviceCode);
      chips.push({
        key: `service-${serviceCode}`,
        label: serviceName,
        onRemove: () => {
          setSelectedServices((prev) => prev.filter((s) => s !== serviceCode));
          setPage(1);
        },
      });
    });

    return chips;
  }, [statusFilter, dateFrom, dateTo, selectedServices, getServiceName]);

  // 데이터 로드
  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const [appData, dashboardData] = await Promise.all([
        getApplications(token, {
          page,
          page_size: pageSize,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
          search_type: searchType !== "auto" ? searchType : undefined,
          date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
          date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
          services: selectedServices.length > 0 ? selectedServices.join(",") : undefined,
        }),
        getDashboard(token),
      ]);

      setApplications(appData.items);
      setTotalPages(appData.total_pages);
      setTotal(appData.total);
      setStats(dashboardData.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  }, [getValidToken, router, page, pageSize, statusFilter, searchQuery, searchType, dateFrom, dateTo, selectedServices]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // 상태별 통계 카드 설정
  const statusCards = useMemo<StatusCard[]>(
    () => [
      {
        status: "new",
        label: "신규",
        count: stats?.applications_new ?? 0,
        needsAction: true,
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
      },
      {
        status: "consulting",
        label: "상담중",
        count: stats?.applications_consulting ?? 0,
        needsAction: true,
        color: "bg-yellow-500",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
      },
      {
        status: "assigned",
        label: "배정완료",
        count: stats?.applications_assigned ?? 0,
        needsAction: false,
        color: "bg-purple-500",
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
      },
      {
        status: "scheduled",
        label: "일정확정",
        count: stats?.applications_scheduled ?? 0,
        needsAction: false,
        color: "bg-primary",
        bgColor: "bg-primary-50",
        textColor: "text-primary-700",
      },
    ],
    [stats]
  );

  // 상태별 행 스타일링
  const getRowClassName = useCallback((app: ApplicationListItem) => {
    switch (app.status) {
      case "new":
        return "bg-blue-50/40 border-l-4 border-l-blue-500";
      case "consulting":
        return "bg-yellow-50/40 border-l-4 border-l-yellow-500";
      case "assigned":
        return "border-l-4 border-l-purple-300";
      case "scheduled":
        return "border-l-4 border-l-primary-300";
      case "completed":
        return "opacity-60";
      case "cancelled":
        return "opacity-40 bg-gray-50/50";
      default:
        return "";
    }
  }, []);

  // 상태 카드 클릭 핸들러
  const handleStatusCardClick = useCallback((status: string) => {
    if (statusFilter === status) {
      setStatusFilter("");
    } else {
      setStatusFilter(status);
    }
    setPage(1);
  }, [statusFilter]);

  // 통합 검색 핸들러
  const handleSearch = useCallback((query: string, type: SearchType) => {
    setSearchQuery(query);
    setSearchType(type);
    setPage(1);
  }, []);

  // 필터 전체 초기화
  const handleClearAllFilters = useCallback(() => {
    setStatusFilter("");
    setSearchQuery("");
    setSearchType("auto");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedServices([]);
    setPage(1);
  }, []);

  // 날짜 필터 핸들러
  const handleDateFromChange = useCallback((date: Date | undefined) => {
    setDateFrom(date);
    setPage(1);
  }, []);

  const handleDateToChange = useCallback((date: Date | undefined) => {
    setDateTo(date);
    setPage(1);
  }, []);

  const handleServicesChange = useCallback((services: string[]) => {
    setSelectedServices(services);
    setPage(1);
  }, []);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((app) => app.id));
    }
  }, [selectedIds.length, applications]);

  const handleToggleSelect = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }, [selectedIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // 일괄 작업 완료 후 새로고침
  const handleBulkComplete = useCallback(() => {
    setSelectedIds([]);
    loadApplications();
  }, [loadApplications]);

  return {
    // 데이터
    applications,
    isLoading,
    error,
    total,

    // 페이지네이션
    page,
    setPage,
    totalPages,
    pageSize,

    // 필터
    statusFilter,
    searchQuery,
    filterChips,
    statusCards,
    serviceCategories,
    dateFrom,
    dateTo,
    selectedServices,

    // 필터 핸들러
    handleSearch,
    handleClearAllFilters,
    handleStatusCardClick,
    handleDateFromChange,
    handleDateToChange,
    handleServicesChange,

    // 테이블
    getRowClassName,

    // 선택
    selectedIds,
    handleSelectAll,
    handleToggleSelect,
    handleClearSelection,

    // 시트
    showBulkSMSSheet,
    setShowBulkSMSSheet,
    showBulkAssignSheet,
    setShowBulkAssignSheet,

    // 일괄 작업
    handleBulkComplete,
  };
}
