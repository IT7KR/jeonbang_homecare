"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, FileText, MessageSquare, X } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { getApplications, ApplicationListItem } from "@/lib/api/admin";
import {
  APPLICATION_STATUS_OPTIONS,
  getApplicationStatusLabel,
  getApplicationStatusColor,
} from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";
import { AdminListLayout, ColumnDef } from "@/components/admin";
import { Checkbox } from "@/components/ui/checkbox";
import { DirectSMSSheet } from "@/components/features/admin/sms";

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

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkSMSSheet, setShowBulkSMSSheet] = useState(false);

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

  const handleSearch = () => {
    setSearchQuery(searchInput);
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
    {
      key: "checkbox",
      header: "",
      headerClassName: "w-12",
      render: (app) => (
        <div onClick={(e) => handleToggleSelect(app.id, e)}>
          <Checkbox
            checked={selectedIds.includes(app.id)}
            onCheckedChange={() => {}}
          />
        </div>
      ),
      className: "px-4 py-4 w-12",
    },
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
              {service}
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
          {selectedIds.length}명 선택
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
        applications.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="text-sm text-gray-600 hover:text-primary"
          >
            {selectedIds.length === applications.length ? "전체 해제" : "전체 선택"}
          </button>
        )
      }
      // 필터
      statusOptions={APPLICATION_STATUS_OPTIONS}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      searchPlaceholder="신청번호 검색..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      onSearch={handleSearch}
      // 상태
      isLoading={isLoading}
      error={error}
      // 테이블
      columns={columns}
      data={applications}
      keyExtractor={(app) => app.id}
      emptyIcon={<FileText className="w-5 h-5 text-gray-400" />}
      emptyMessage="신청 내역이 없습니다"
      // 페이지네이션
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={setPage}
      // 추가 컨텐츠
      afterPagination={
        <>
          {SelectionActionBar}
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
      }
    />
  );
}
