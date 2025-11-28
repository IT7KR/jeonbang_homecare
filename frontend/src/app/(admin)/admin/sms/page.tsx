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
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getSMSStats,
  getSMSLogs,
  sendSMS,
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

const TYPE_OPTIONS: FilterOption[] = [
  { value: "", label: "전체유형" },
  { value: "manual", label: "수동발송" },
  { value: "application_new", label: "신규신청알림" },
  { value: "partner_new", label: "협력사등록알림" },
];

const TYPE_LABELS: Record<string, string> = {
  manual: "수동발송",
  application_new: "신규신청알림",
  partner_new: "협력사등록알림",
  manual_retry: "수동발송(재시도)",
  application_new_retry: "신규신청알림(재시도)",
  partner_new_retry: "협력사등록알림(재시도)",
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

  // Send SMS Modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendPhone, setSendPhone] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Retry state
  const [retryingId, setRetryingId] = useState<number | null>(null);

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
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
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

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSending(true);
      setSendResult(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const result = await sendSMS(token, {
        receiver_phone: sendPhone,
        message: sendMessage,
        sms_type: "manual",
      });

      setSendResult({
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        setSendPhone("");
        setSendMessage("");
        loadStats();
        loadLogs();
      }
    } catch (err) {
      setSendResult({
        success: false,
        message: err instanceof Error ? err.message : "SMS 발송에 실패했습니다",
      });
    } finally {
      setIsSending(false);
    }
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
        <p className="text-sm text-gray-700 max-w-xs truncate" title={log.message}>
          {log.message}
        </p>
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
            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getSMSStatusColor(log.status)}`}
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
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell",
    },
    {
      key: "actions",
      header: "관리",
      headerClassName: "text-center",
      render: (log) => (
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
        )
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
            <p className="text-xl font-bold text-gray-900">{stats.today_sent}</p>
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
            <p className="text-xl font-bold text-gray-900">{stats.today_failed}</p>
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
            <p className="text-xl font-bold text-gray-900">{stats.this_month_sent}</p>
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
            <p className="text-xl font-bold text-gray-900">{stats.total_sent}</p>
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

  // SMS 발송 모달
  const SendModal = showSendModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">SMS 발송</h2>
          <button
            onClick={() => {
              setShowSendModal(false);
              setSendResult(null);
            }}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSendSMS} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              수신번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={sendPhone}
              onChange={(e) => setSendPhone(e.target.value)}
              placeholder="010-1234-5678"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              메시지 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              required
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              {sendMessage.length}/2000자 (90자 초과시 LMS로 발송)
            </p>
          </div>

          {sendResult && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-center gap-2 ${
                sendResult.success
                  ? "bg-primary-50 text-primary-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {sendResult.success ? (
                <CheckCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}
              {sendResult.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowSendModal(false);
                setSendResult(null);
              }}
              className="px-5 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 inline-flex items-center font-medium text-sm transition-colors shadow-sm"
            >
              {isSending ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  발송중...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  발송
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <AdminListLayout
      // 헤더
      title="SMS 관리"
      subtitle="SMS 발송 내역 및 수동 발송"
      headerAction={
        <button
          onClick={() => setShowSendModal(true)}
          className="inline-flex items-center px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium text-sm transition-colors shadow-sm"
        >
          <Send size={18} className="mr-2" />
          SMS 발송
        </button>
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
      afterPagination={SendModal}
    />
  );
}
