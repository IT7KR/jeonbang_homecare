"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, FileText, MessageSquare, X, UserPlus } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getApplications,
  getDashboard,
  ApplicationListItem,
  DashboardStats,
} from "@/lib/api/admin";
import {
  getServices,
  type ServicesListResponse,
} from "@/lib/api/services";
import {
  APPLICATION_STATUS_OPTIONS,
  getApplicationStatusLabel,
  getApplicationStatusColor,
} from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";
import { AdminListLayout, ColumnDef } from "@/components/admin";
import { Checkbox } from "@/components/ui/checkbox";
import { DirectSMSSheet } from "@/components/features/admin/sms";
import { BulkAssignSheet } from "@/components/features/admin/applications";
import {
  UnifiedSearchInput,
  FilterChips,
  AdvancedFilters,
  type FilterChip,
  type SearchType,
} from "@/components/admin/filters";
import { format } from "date-fns";

// Feature Flag: SMS 수동/복수 발송 기능 활성화 여부
const enableManualSMS = process.env.NEXT_PUBLIC_ENABLE_MANUAL_SMS === "true";

export default function ApplicationsPage() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

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

  // AdvancedFilters용 서비스 카테고리 (API 응답 직접 사용)
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

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      // 신청 목록과 통계를 병렬로 로드
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
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, searchQuery, searchType, dateFrom, dateTo, selectedServices]);

  // 상태별 통계 카드 설정
  const statusCards = useMemo(
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
  const handleStatusCardClick = (status: string) => {
    if (statusFilter === status) {
      setStatusFilter(""); // 같은 상태를 다시 클릭하면 필터 해제
    } else {
      setStatusFilter(status);
    }
    setPage(1);
  };

  // 통합 검색 핸들러
  const handleSearch = (query: string, type: SearchType) => {
    setSearchQuery(query);
    setSearchType(type);
    setPage(1);
  };

  // 필터 전체 초기화
  const handleClearAllFilters = () => {
    setStatusFilter("");
    setSearchQuery("");
    setSearchType("auto");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedServices([]);
    setPage(1);
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((app) => app.id));
    }
  };

  const handleToggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const columns: ColumnDef<ApplicationListItem>[] = [
    // SMS 수동 발송 기능 활성화 시에만 체크박스 표시
    ...(enableManualSMS
      ? [
          {
            key: "checkbox",
            header: "",
            headerClassName: "w-12",
            render: (app: ApplicationListItem) => (
              <div onClick={(e) => handleToggleSelect(app.id, e)}>
                <Checkbox
                  checked={selectedIds.includes(app.id)}
                  onCheckedChange={() => {}}
                />
              </div>
            ),
            className: "px-4 py-4 w-12",
          } as ColumnDef<ApplicationListItem>,
        ]
      : []),
    {
      key: "application_number",
      header: "신청번호",
      render: (app) => (
        <span className="font-mono text-sm font-semibold text-gray-900">
          {app.application_number}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "customer",
      header: "고객정보",
      render: (app) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{app.customer_name}</p>
          <p className="text-gray-500 mt-0.5">{formatPhone(app.customer_phone)}</p>
          <p className="text-gray-400 text-xs truncate max-w-[200px] mt-0.5">
            {app.address}
          </p>
        </div>
      ),
      className: "px-5 py-4",
    },
    {
      key: "services",
      header: "서비스",
      headerClassName: "hidden md:table-cell",
      render: (app) => (
        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
          {app.selected_services.slice(0, 2).map((service, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium"
            >
              {getServiceName(service)}
            </span>
          ))}
          {app.selected_services.length > 2 && (
            <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-lg font-medium">
              +{app.selected_services.length - 2}
            </span>
          )}
        </div>
      ),
      className: "px-5 py-4 hidden md:table-cell",
    },
    {
      key: "status",
      header: "상태",
      render: (app) => (
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getApplicationStatusColor(app.status)}`}
        >
          {getApplicationStatusLabel(app.status)}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "created_at",
      header: "신청일시",
      headerClassName: "hidden sm:table-cell",
      render: (app) => formatDate(app.created_at),
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell",
    },
    {
      key: "actions",
      header: "관리",
      headerClassName: "text-center",
      render: (app) => (
        <Link
          href={`/admin/applications/${app.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Eye size={16} />
          <span className="hidden sm:inline">상세</span>
        </Link>
      ),
      className: "px-5 py-4 whitespace-nowrap text-center",
    },
  ];

  // Floating Action Bar for selected items
  const SelectionActionBar = selectedIds.length > 0 && (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
        <span className="text-sm font-medium text-gray-900">
          {selectedIds.length}건 선택
        </span>
        <button
          onClick={handleClearSelection}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>
      <button
        onClick={() => setShowBulkAssignSheet(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 text-sm font-medium transition-colors"
      >
        <UserPlus size={16} />
        일괄 배정
      </button>
      <button
        onClick={() => setShowBulkSMSSheet(true)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
      >
        <MessageSquare size={16} />
        SMS 발송
      </button>
    </div>
  );

  // 통계 카드 컴포넌트
  const StatsCards = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {statusCards.map((card) => (
        <button
          key={card.status}
          onClick={() => handleStatusCardClick(card.status)}
          className={`
            relative px-3 py-2 rounded-xl border-2 transition-all text-left
            ${
              statusFilter === card.status
                ? `border-${card.status === "scheduled" ? "primary" : card.color.replace("bg-", "")} ${card.bgColor}`
                : "border-gray-100 bg-white hover:border-gray-200"
            }
          `}
        >
          {/* 색상 표시 바 */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${card.color}`}
          />
          <div className="pl-2 flex items-center gap-2">
            <div className={`text-xl font-bold ${card.textColor}`}>
              {card.count}
            </div>
            <div className="text-sm text-gray-600">{card.label}</div>
            {card.needsAction && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                처리필요
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );

  // 새로운 필터 섹션 (통합 검색 + 고급 필터)
  const FilterSectionNew = (
    <div className="space-y-4">
      {/* 통합 검색창 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <UnifiedSearchInput
          placeholder="이름, 전화번호, 신청번호로 검색..."
          onSearch={handleSearch}
          defaultValue={searchQuery}
        />
      </div>

      {/* 고급 필터 */}
      <AdvancedFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={(date) => {
          setDateFrom(date);
          setPage(1);
        }}
        onDateToChange={(date) => {
          setDateTo(date);
          setPage(1);
        }}
        serviceCategories={serviceCategories}
        selectedServices={selectedServices}
        onServicesChange={(services) => {
          setSelectedServices(services);
          setPage(1);
        }}
      />

      {/* 활성 필터 칩 */}
      {filterChips.length > 0 && (
        <FilterChips chips={filterChips} onClearAll={handleClearAllFilters} />
      )}

      {/* 상태 카드 */}
      {StatsCards}
    </div>
  );

  return (
    <AdminListLayout
      // 헤더
      title="신청 관리"
      subtitle={
        <p>
          총 <span className="font-semibold text-primary">{total}</span>건의 신청
        </p>
      }
      headerAction={
        enableManualSMS && applications.length > 0 ? (
          <button
            onClick={handleSelectAll}
            className="text-sm text-gray-600 hover:text-primary"
          >
            {selectedIds.length === applications.length ? "전체 해제" : "전체 선택"}
          </button>
        ) : undefined
      }
      // 기본 필터 섹션 숨기고 커스텀 필터 사용
      hideFilters
      // 상태
      isLoading={isLoading}
      error={error}
      // 테이블
      columns={columns}
      data={applications}
      keyExtractor={(app) => app.id}
      emptyIcon={<FileText className="w-5 h-5 text-gray-400" />}
      emptyMessage="신청 내역이 없습니다"
      getRowClassName={getRowClassName}
      // 페이지네이션
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={setPage}
      // 새로운 필터 섹션 (통합 검색 + 고급 필터 + 상태 카드)
      beforeTable={FilterSectionNew}
      // 추가 컨텐츠 (SMS 수동 발송 기능 활성화 시에만)
      afterPagination={
        enableManualSMS ? (
          <>
            {SelectionActionBar}
            <BulkAssignSheet
              open={showBulkAssignSheet}
              onOpenChange={setShowBulkAssignSheet}
              selectedIds={selectedIds}
              onComplete={() => {
                setSelectedIds([]);
                loadApplications();
              }}
            />
            <DirectSMSSheet
              open={showBulkSMSSheet}
              onOpenChange={setShowBulkSMSSheet}
              targetType="customer"
              selectedIds={selectedIds}
              onComplete={() => {
                setSelectedIds([]);
              }}
            />
          </>
        ) : undefined
      }
    />
  );
}
