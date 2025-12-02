"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  RefreshCw,
  Loader2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getSMSStats,
  getSMSLogs,
  retrySMS,
  SMSLogItem,
  SMSStats,
} from "@/lib/api/admin";
import {
  SMS_STATUS_OPTIONS,
  getSMSStatusLabel,
  getSMSStatusColor,
} from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";
import { AdminListLayout, ColumnDef, FilterOption } from "@/components/admin";
import { BulkSMSSheet, SMSSendSheet } from "@/components/features/admin/sms";

const TYPE_OPTIONS: FilterOption[] = [
  { value: "", label: "전체유형" },
  { value: "manual", label: "수동발송" },
  { value: "application_new", label: "신규신청알림" },
  { value: "partner_new", label: "협력사등록알림" },
  { value: "bulk_announcement", label: "복수발송(공지)" },
  { value: "bulk_status_notify", label: "복수발송(상태별)" },
  { value: "bulk_manual_select", label: "복수발송(선택)" },
];

const TYPE_LABELS: Record<string, string> = {
  manual: "수동발송",
  application_new: "신규신청알림",
  partner_new: "협력사등록알림",
  manual_retry: "수동발송(재시도)",
  application_new_retry: "신규신청알림(재시도)",
  partner_new_retry: "협력사등록알림(재시도)",
  bulk_announcement: "복수발송(공지)",
  bulk_status_notify: "복수발송(상태별)",
  bulk_manual_select: "복수발송(선택)",
};

export default function SMSPage() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  const [stats, setStats] = useState<SMSStats | null>(null);
  const [logs, setLogs] = useState<SMSLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Retry state
  const [retryingId, setRetryingId] = useState<number | null>(null);

  // SMS Sheets
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [showBulkSMSSheet, setShowBulkSMSSheet] = useState(false);

  // Message detail modal
  const [selectedLog, setSelectedLog] = useState<SMSLogItem | null>(null);

  const loadStats = async () => {
    try {
      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const data = await getSMSStats(token);
      setStats(data);
    } catch (err) {
      console.error("SMS 통계 로드 실패:", err);
    }
  };

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const data = await getSMSLogs(token, {
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        sms_type: typeFilter || undefined,
        search: searchQuery || undefined,
      });

      setLogs(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "데이터를 불러올 수 없습니다"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, statusFilter, typeFilter, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleRetry = async (logId: number) => {
    try {
      setRetryingId(logId);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const result = await retrySMS(token, logId);

      if (result.success) {
        loadStats();
        loadLogs();
      } else {
        alert(result.message || "SMS 재발송에 실패했습니다");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "SMS 재발송에 실패했습니다");
    } finally {
      setRetryingId(null);
    }
  };

  const columns: ColumnDef<SMSLogItem>[] = [
    {
      key: "receiver_phone",
      header: "수신번호",
      render: (log) => (
        <span className="font-mono text-sm font-semibold text-gray-900">
          {formatPhone(log.receiver_phone)}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "message",
      header: "메시지",
      headerClassName: "hidden md:table-cell",
      render: (log) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(log);
          }}
          className="text-sm text-gray-700 max-w-xs truncate text-left hover:text-primary transition-colors"
        >
          {log.message}
        </button>
      ),
      className: "px-5 py-4 hidden md:table-cell",
    },
    {
      key: "sms_type",
      header: "유형",
      headerClassName: "hidden sm:table-cell",
      render: (log) => (
        <span className="text-sm text-gray-600">
          {TYPE_LABELS[log.sms_type] || log.sms_type}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap hidden sm:table-cell",
    },
    {
      key: "status",
      header: "상태",
      render: (log) => (
        <div>
          <span
            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getSMSStatusColor(
              log.status
            )}`}
          >
            {getSMSStatusLabel(log.status)}
          </span>
          {log.result_message && log.status === "failed" && (
            <p className="text-xs text-red-500 mt-1">{log.result_message}</p>
          )}
        </div>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "sent_at",
      header: "발송일시",
      headerClassName: "hidden sm:table-cell",
      render: (log) => formatDate(log.sent_at || log.created_at),
      className:
        "px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell",
    },
    {
      key: "actions",
      header: "관리",
      headerClassName: "text-center",
      render: (log) =>
        log.status === "failed" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRetry(log.id);
            }}
            disabled={retryingId === log.id}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {retryingId === log.id ? (
              <Loader2 size={16} className="mr-1.5 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-1.5" />
            )}
            재발송
          </button>
        ),
      className: "px-5 py-4 whitespace-nowrap text-center",
    },
  ];

  // 통계 카드
  const StatsCards = stats && (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">오늘 발송</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.today_sent}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">오늘 실패</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.today_failed}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-secondary-50 rounded-xl">
            <MessageSquare className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">이번달 발송</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.this_month_sent}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-100 rounded-xl">
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 발송</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.total_sent}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // 유형 필터
  const TypeFilter = (
    <div className="flex items-center gap-2">
      <select
        value={typeFilter}
        onChange={(e) => {
          setTypeFilter(e.target.value);
          setPage(1);
        }}
        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <AdminListLayout
      // 헤더
      title="SMS 관리"
      subtitle="SMS 발송 내역 및 수동 발송"
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkSMSSheet(true)}
            className="inline-flex items-center px-4 py-2.5 border border-primary text-primary rounded-xl hover:bg-primary-50 font-medium text-sm transition-colors"
          >
            <Users size={18} className="mr-2" />
            복수 발송
          </button>
          <button
            onClick={() => setShowSendSheet(true)}
            className="inline-flex items-center px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium text-sm transition-colors shadow-sm"
          >
            <Send size={18} className="mr-2" />
            SMS 발송
          </button>
        </div>
      }
      // 필터
      statusOptions={SMS_STATUS_OPTIONS}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      additionalFilters={TypeFilter}
      searchPlaceholder="수신번호 검색..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      onSearch={handleSearch}
      // 상태
      isLoading={isLoading}
      error={error}
      // 테이블
      columns={columns}
      data={logs}
      keyExtractor={(log) => log.id}
      emptyIcon={<MessageSquare className="w-5 h-5 text-gray-400" />}
      emptyMessage="SMS 발송 내역이 없습니다"
      // 페이지네이션
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={setPage}
      // 추가 컨텐츠
      beforeTable={StatsCards}
      afterPagination={
        <>
          <SMSSendSheet
            open={showSendSheet}
            onOpenChange={setShowSendSheet}
            onComplete={() => {
              loadStats();
              loadLogs();
            }}
          />
          <BulkSMSSheet
            open={showBulkSMSSheet}
            onOpenChange={setShowBulkSMSSheet}
            onComplete={() => {
              loadStats();
              loadLogs();
            }}
          />
          {/* 메시지 상세 모달 */}
          {selectedLog && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedLog(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    메시지 상세
                  </h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">수신번호:</span>{" "}
                      <span className="font-mono font-semibold">
                        {formatPhone(selectedLog.receiver_phone)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">발송일시:</span>{" "}
                      <span>
                        {formatDate(selectedLog.sent_at || selectedLog.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">상태:</span>
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getSMSStatusColor(
                        selectedLog.status
                      )}`}
                    >
                      {getSMSStatusLabel(selectedLog.status)}
                    </span>
                    <span className="text-gray-500">유형:</span>
                    <span className="text-gray-700">
                      {TYPE_LABELS[selectedLog.sms_type] || selectedLog.sms_type}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">메시지 내용</p>
                    <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                      {selectedLog.message}
                    </div>
                  </div>
                  {selectedLog.result_message && selectedLog.status === "failed" && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                      <span className="font-medium">실패 사유:</span>{" "}
                      {selectedLog.result_message}
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="w-full py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      }
    />
  );
}
