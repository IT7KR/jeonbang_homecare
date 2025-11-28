"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, CheckCircle, XCircle, Users, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { getPartners, approvePartner, PartnerListItem } from "@/lib/api/admin";
import {
  PARTNER_STATUS_OPTIONS,
  getPartnerStatusLabel,
  getPartnerStatusColor,
} from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";
import { AdminListLayout, ColumnDef } from "@/components/admin";

export default function PartnersPage() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadPartners = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const data = await getPartners(token, {
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });

      setPartners(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
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
              {area}
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
      // 페이지네이션
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={setPage}
      unitLabel="개"
      // 모달
      afterPagination={ApprovalModal}
    />
  );
}
