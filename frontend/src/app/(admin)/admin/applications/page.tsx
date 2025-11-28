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
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getApplications,
  ApplicationListItem,
} from "@/lib/api/admin";
import {
  APPLICATION_STATUS_OPTIONS,
  getApplicationStatusLabel,
  getApplicationStatusColor,
} from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";

export default function ApplicationsPage() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
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

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const data = await getApplications(token, {
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });

      setApplications(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [page, statusFilter, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">신청 관리</h1>
          <p className="text-gray-500 mt-1">
            총 <span className="font-semibold text-primary">{total}</span>건의 신청
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
              {APPLICATION_STATUS_OPTIONS.map((option) => (
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
                placeholder="신청번호 검색..."
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
                      신청번호
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      고객정보
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      서비스
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      신청일시
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-gray-500">신청 내역이 없습니다</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {app.application_number}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{app.customer_name}</p>
                            <p className="text-gray-500 mt-0.5">{formatPhone(app.customer_phone)}</p>
                            <p className="text-gray-400 text-xs truncate max-w-[200px] mt-0.5">
                              {app.address}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                            {app.selected_services.slice(0, 2).map((service, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium"
                              >
                                {service}
                              </span>
                            ))}
                            {app.selected_services.length > 2 && (
                              <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-lg font-medium">
                                +{app.selected_services.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getApplicationStatusColor(app.status)}`}
                          >
                            {getApplicationStatusLabel(app.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {formatDate(app.created_at)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                            <span className="hidden sm:inline">상세</span>
                          </Link>
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
                <span className="font-medium text-gray-700">{total}</span>건 중{" "}
                <span className="font-medium text-gray-700">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}</span>건
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
    </div>
  );
}
