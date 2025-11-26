"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getPartners,
  approvePartner,
  PartnerListItem,
} from "@/lib/api/admin";

const STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "pending", label: "대기중" },
  { value: "approved", label: "승인됨" },
  { value: "rejected", label: "거절됨" },
  { value: "inactive", label: "비활성" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-secondary-50 text-secondary-700",
  approved: "bg-primary-50 text-primary-700",
  rejected: "bg-red-50 text-red-600",
  inactive: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "대기중",
  approved: "승인됨",
  rejected: "거절됨",
  inactive: "비활성",
};

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">파트너 관리</h1>
          <p className="text-gray-500 mt-1">
            총 <span className="font-semibold text-primary">{total}</span>명의 파트너
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Filter size={16} className="text-gray-500" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="min-w-[140px] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="회사명 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-500">!</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      회사명
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      대표자
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      연락처
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      서비스
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      등록일
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {partners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-gray-500">파트너가 없습니다</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    partners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            {partner.company_name}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                          {partner.representative_name}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          {formatPhone(partner.contact_phone)}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
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
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                              STATUS_COLORS[partner.status] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABELS[partner.status] || partner.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {formatDate(partner.created_at)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
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
                                onClick={() => setApprovalTarget(partner)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="승인/거절"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">{total}</span>명 중{" "}
                <span className="font-medium text-gray-700">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}</span>명
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <span className="px-3 text-sm font-medium text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Approval Modal */}
      {approvalTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                파트너 승인/거절
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-5">
                <strong className="text-gray-900">{approvalTarget.company_name}</strong> 파트너를 승인하시겠습니까?
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
                  <XCircle size={18} className="mr-2" />
                  거절
                </button>
                <button
                  onClick={() => handleApprove("approve")}
                  disabled={isApproving}
                  className="flex-1 py-2.5 px-4 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center font-medium transition-colors"
                >
                  <CheckCircle size={18} className="mr-2" />
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
      )}
    </div>
  );
}
