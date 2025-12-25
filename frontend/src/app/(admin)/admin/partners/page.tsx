"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, CheckCircle, XCircle, Users, Loader2, MessageSquare, X } from "lucide-react";
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
import {
  PARTNER_STATUS_OPTIONS,
  getPartnerStatusLabel,
  getPartnerStatusColor,
} from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";
import { AdminListLayout, ColumnDef, StatsCards, type StatsCardItem } from "@/components/admin";
import { Checkbox } from "@/components/ui/checkbox";
import { DirectSMSSheet } from "@/components/features/admin/sms";

// Feature Flag: SMS 수동/복수 발송 기능 활성화 여부
const enableManualSMS = process.env.NEXT_PUBLIC_ENABLE_MANUAL_SMS === "true";

export default function PartnersPage() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

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
  const [searchInput, setSearchInput] = useState("");

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

  const loadPartners = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      // 협력사 목록과 통계를 병렬로 로드
      const [data, dashboardData] = await Promise.all([
        getPartners(token, {
          page,
          page_size: pageSize,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
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
  };

  useEffect(() => {
    loadPartners();
  }, [page, statusFilter, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

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
        count: 0, // API에서 별도 제공 안함
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
  const handleStatusCardClick = (status: string) => {
    if (statusFilter === status) {
      setStatusFilter(""); // 같은 상태를 다시 클릭하면 필터 해제
    } else {
      setStatusFilter(status);
    }
    setPage(1);
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === partners.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(partners.map((p) => p.id));
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

  const handleApprove = async (action: "approve" | "reject") => {
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
  };

  const columns: ColumnDef<PartnerListItem>[] = [
    // SMS 수동 발송 기능 활성화 시에만 체크박스 표시
    ...(enableManualSMS
      ? [
          {
            key: "checkbox",
            header: "",
            headerClassName: "w-12",
            render: (partner: PartnerListItem) => (
              <div onClick={(e) => handleToggleSelect(partner.id, e)}>
                <Checkbox
                  checked={selectedIds.includes(partner.id)}
                  onCheckedChange={() => {}}
                />
              </div>
            ),
            className: "px-4 py-4 w-12",
          } as ColumnDef<PartnerListItem>,
        ]
      : []),
    {
      key: "company_name",
      header: "회사명",
      render: (partner) => (
        <span className="font-semibold text-gray-900">
          {partner.company_name}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "representative",
      header: "대표자",
      headerClassName: "hidden md:table-cell",
      render: (partner) => partner.representative_name,
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell",
    },
    {
      key: "contact",
      header: "연락처",
      headerClassName: "hidden sm:table-cell",
      render: (partner) => formatPhone(partner.contact_phone),
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell",
    },
    {
      key: "services",
      header: "서비스",
      headerClassName: "hidden lg:table-cell",
      render: (partner) => (
        <div className="flex flex-wrap gap-1.5 max-w-[180px]">
          {partner.service_areas.slice(0, 2).map((area, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium"
            >
              {getServiceName(area)}
            </span>
          ))}
          {partner.service_areas.length > 2 && (
            <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-lg font-medium">
              +{partner.service_areas.length - 2}
            </span>
          )}
        </div>
      ),
      className: "px-5 py-4 hidden lg:table-cell",
    },
    {
      key: "status",
      header: "상태",
      render: (partner) => (
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getPartnerStatusColor(partner.status)}`}
        >
          {getPartnerStatusLabel(partner.status)}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "created_at",
      header: "등록일",
      headerClassName: "hidden sm:table-cell",
      render: (partner) => formatDate(partner.created_at, { type: "date" }),
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell",
    },
    {
      key: "actions",
      header: "관리",
      headerClassName: "text-center",
      render: (partner) => (
        <div className="flex items-center justify-center gap-1">
          <Link
            href={`/admin/partners/${partner.id}`}
            className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
            title="상세보기"
          >
            <Eye size={18} />
          </Link>
          {partner.status === "pending" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setApprovalTarget(partner);
              }}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="승인/거절"
            >
              <CheckCircle size={18} />
            </button>
          )}
        </div>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
  ];

  // Floating Action Bar for selected items
  const SelectionActionBar = selectedIds.length > 0 && (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
        <span className="text-sm font-medium text-gray-900">
          {selectedIds.length}개 선택
        </span>
        <button
          onClick={handleClearSelection}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>
      <button
        onClick={() => setShowBulkSMSSheet(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 text-sm font-medium transition-colors"
      >
        <MessageSquare size={16} />
        SMS 발송
      </button>
    </div>
  );

  // 승인/거절 모달
  const ApprovalModal = approvalTarget && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            협력사 승인/거절
          </h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-5">
            <strong className="text-gray-900">
              {approvalTarget.company_name}
            </strong>{" "}
            협력사를 승인하시겠습니까?
          </p>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거절 시 사유 (거절할 경우 필수)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="거절 사유를 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleApprove("reject")}
              disabled={isApproving}
              className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center font-medium transition-colors"
            >
              {isApproving ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <XCircle size={18} className="mr-2" />
              )}
              거절
            </button>
            <button
              onClick={() => handleApprove("approve")}
              disabled={isApproving}
              className="flex-1 py-2.5 px-4 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center font-medium transition-colors"
            >
              {isApproving ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <CheckCircle size={18} className="mr-2" />
              )}
              승인
            </button>
          </div>

          <button
            onClick={() => {
              setApprovalTarget(null);
              setRejectionReason("");
            }}
            className="w-full mt-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminListLayout
      // 헤더
      title="협력사 관리"
      subtitle={
        <p>
          총 <span className="font-semibold text-primary">{total}</span>개의 협력사
        </p>
      }
      headerAction={
        enableManualSMS && partners.length > 0 ? (
          <button
            onClick={handleSelectAll}
            className="text-sm text-gray-600 hover:text-primary"
          >
            {selectedIds.length === partners.length ? "전체 해제" : "전체 선택"}
          </button>
        ) : undefined
      }
      // 필터
      statusOptions={PARTNER_STATUS_OPTIONS}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      searchPlaceholder="회사명 검색..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      onSearch={handleSearch}
      // 상태
      isLoading={isLoading}
      error={error}
      // 테이블
      columns={columns}
      data={partners}
      keyExtractor={(partner) => partner.id}
      emptyIcon={<Users className="w-5 h-5 text-gray-400" />}
      emptyMessage="협력사가 없습니다"
      getRowClassName={getRowClassName}
      // 통계 카드
      beforeTable={
        <StatsCards
          cards={statusCards}
          activeStatus={statusFilter}
          onCardClick={handleStatusCardClick}
        />
      }
      // 페이지네이션
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={setPage}
      unitLabel="개"
      // 모달 및 추가 컴포넌트
      afterPagination={
        <>
          {ApprovalModal}
          {/* SMS 수동 발송 기능 활성화 시에만 표시 */}
          {enableManualSMS && (
            <>
              {SelectionActionBar}
              <DirectSMSSheet
                open={showBulkSMSSheet}
                onOpenChange={setShowBulkSMSSheet}
                targetType="partner"
                selectedIds={selectedIds}
                onComplete={() => {
                  setSelectedIds([]);
                }}
              />
            </>
          )}
        </>
      }
    />
  );
}
