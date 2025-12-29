"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getPartners,
  approvePartner,
  getDashboard,
  PartnerListItem,
  DashboardStats,
} from "@/lib/api/admin";
import {
  getServices,
  type ServicesListResponse,
} from "@/lib/api/services";
import { PARTNER_STATUS_OPTIONS } from "@/lib/constants/status";
import { type FilterChip, type SearchType } from "@/components/admin/filters";
import { type StatsCardItem } from "@/components/admin";
import { format } from "date-fns";

// Feature Flag
export const enableManualSMS = process.env.NEXT_PUBLIC_ENABLE_MANUAL_SMS === "true";

export function usePartners() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  // 기본 상태
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
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

  // Approval modal
  const [approvalTarget, setApprovalTarget] = useState<PartnerListItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkSMSSheet, setShowBulkSMSSheet] = useState(false);

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
      const statusLabel = PARTNER_STATUS_OPTIONS.find(
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
  const loadPartners = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const [data, dashboardData] = await Promise.all([
        getPartners(token, {
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

      setPartners(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
      setStats(dashboardData.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  }, [getValidToken, router, page, pageSize, statusFilter, searchQuery, searchType, dateFrom, dateTo, selectedServices]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

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

  // 상태별 통계 카드 설정
  const statusCards = useMemo<StatsCardItem[]>(
    () => [
      {
        status: "pending",
        label: "대기중",
        count: stats?.partners_pending ?? 0,
        needsAction: true,
        color: "bg-yellow-500",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
      },
      {
        status: "approved",
        label: "승인됨",
        count: stats?.partners_approved ?? 0,
        needsAction: false,
        color: "bg-green-500",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
      },
      {
        status: "rejected",
        label: "거절됨",
        count: (stats?.partners_total ?? 0) - (stats?.partners_pending ?? 0) - (stats?.partners_approved ?? 0),
        needsAction: false,
        color: "bg-red-500",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
      },
      {
        status: "inactive",
        label: "비활성",
        count: 0,
        needsAction: false,
        color: "bg-gray-500",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
      },
    ],
    [stats]
  );

  // 상태별 행 스타일링
  const getRowClassName = useCallback((partner: PartnerListItem) => {
    switch (partner.status) {
      case "pending":
        return "bg-yellow-50/40 border-l-4 border-l-yellow-500";
      case "approved":
        return "border-l-4 border-l-green-400";
      case "rejected":
        return "opacity-60 bg-red-50/30 border-l-4 border-l-red-300";
      case "inactive":
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

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === partners.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(partners.map((p) => p.id));
    }
  }, [selectedIds.length, partners]);

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

  // 승인/거절 핸들러
  const handleApprove = useCallback(async (action: "approve" | "reject") => {
    if (!approvalTarget) return;

    if (action === "reject" && !rejectionReason.trim()) {
      setError("거절 사유를 입력해주세요");
      return;
    }

    try {
      setIsApproving(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      await approvePartner(
        token,
        approvalTarget.id,
        action,
        action === "reject" ? rejectionReason : undefined
      );

      setApprovalTarget(null);
      setRejectionReason("");
      loadPartners();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다");
    } finally {
      setIsApproving(false);
    }
  }, [approvalTarget, rejectionReason, getValidToken, router, loadPartners]);

  const closeApprovalModal = useCallback(() => {
    setApprovalTarget(null);
    setRejectionReason("");
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

  return {
    // 데이터
    partners,
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
    getServiceName,

    // 선택
    selectedIds,
    handleSelectAll,
    handleToggleSelect,
    handleClearSelection,
    showBulkSMSSheet,
    setShowBulkSMSSheet,

    // 승인 모달
    approvalTarget,
    setApprovalTarget,
    rejectionReason,
    setRejectionReason,
    isApproving,
    handleApprove,
    closeApprovalModal,
  };
}
