"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getSMSStats,
  getSMSLogs,
  retrySMS,
  SMSLogItem,
  SMSStats,
} from "@/lib/api/admin";
import { toast } from "@/hooks";

// Feature Flag
export const enableManualSMS =
  process.env.NEXT_PUBLIC_ENABLE_MANUAL_SMS === "true";

// 상수
export const TYPE_OPTIONS = [
  { value: "", label: "전체유형" },
  { value: "manual", label: "수동발송" },
  { value: "application_new", label: "신규신청알림" },
  { value: "partner_new", label: "협력사등록알림" },
  { value: "bulk_announcement", label: "복수발송(공지)" },
  { value: "bulk_status_notify", label: "복수발송(상태별)" },
  { value: "bulk_manual_select", label: "복수발송(선택)" },
];

export const TYPE_LABELS: Record<string, string> = {
  manual: "수동발송",
  application_new: "신규신청알림",
  partner_new: "협력사등록알림",
  manual_retry: "수동발송(재시도)",
  application_new_retry: "신규신청알림(재시도)",
  partner_new_retry: "협력사등록알림(재시도)",
  bulk_announcement: "복수발송(공지)",
  bulk_status_notify: "복수발송(상태별)",
  bulk_manual_select: "복수발송(선택)",
  mms_manual: "MMS 수동발송",
  quote_notification: "견적 알림 발송",
  customer_result_url: "고객 링크 발송",
  partner_portal_url: "협력사 링크 발송",
};

export const TRIGGER_SOURCE_OPTIONS = [
  { value: "", label: "전체출처" },
  { value: "system", label: "시스템" },
  { value: "manual", label: "직접발송" },
  { value: "bulk", label: "대량발송" },
];

export const TRIGGER_SOURCE_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  system: { label: "시스템", className: "bg-blue-100 text-blue-700" },
  manual: { label: "직접", className: "bg-green-100 text-green-700" },
  bulk: { label: "대량", className: "bg-purple-100 text-purple-700" },
};

// 이미지 URL 생성 유틸리티
export const getImageUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      return url.pathname;
    } catch {
      return path;
    }
  }
  if (path.startsWith("/uploads/")) {
    return path;
  }
  if (path.startsWith("/api/v1/files/")) {
    return path;
  }
  return `/uploads${path.startsWith("/") ? "" : "/"}${path}`;
};

export function useSMS() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  // 기본 상태
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
  const [triggerSourceFilter, setTriggerSourceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Retry state
  const [retryingId, setRetryingId] = useState<number | null>(null);

  // SMS Sheets
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [showBulkSMSSheet, setShowBulkSMSSheet] = useState(false);

  // Message detail modal
  const [selectedLog, setSelectedLog] = useState<SMSLogItem | null>(null);

  // Lightbox (이미지 확대 보기)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 통계 로드
  const loadStats = useCallback(async () => {
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
  }, [getValidToken, router]);

  // 로그 로드
  const loadLogs = useCallback(async () => {
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
        trigger_source:
          (triggerSourceFilter as "system" | "manual" | "bulk") || undefined,
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
  }, [
    getValidToken,
    router,
    page,
    pageSize,
    statusFilter,
    typeFilter,
    triggerSourceFilter,
    searchQuery,
  ]);

  // 초기 로드
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
    setPage(1);
  }, [searchInput]);

  // 재발송 핸들러
  const handleRetry = useCallback(
    async (logId: number) => {
      try {
        setRetryingId(logId);

        const token = await getValidToken();
        if (!token) {
          router.push("/admin/login");
          return;
        }

        const result = await retrySMS(token, logId);

        if (result.success) {
          toast.success("SMS가 재발송되었습니다");
          loadStats();
          loadLogs();
        } else {
          toast.error(result.message || "SMS 재발송에 실패했습니다");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "SMS 재발송에 실패했습니다"
        );
      } finally {
        setRetryingId(null);
      }
    },
    [getValidToken, router, loadStats, loadLogs]
  );

  // 필터 변경 핸들러
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setPage(1);
  }, []);

  const handleTriggerSourceFilterChange = useCallback((value: string) => {
    setTriggerSourceFilter(value);
    setPage(1);
  }, []);

  // 발송 완료 후 새로고침
  const handleSendComplete = useCallback(() => {
    loadStats();
    loadLogs();
  }, [loadStats, loadLogs]);

  return {
    // 데이터
    stats,
    logs,
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
    typeFilter,
    triggerSourceFilter,
    searchInput,
    setSearchInput,

    // 필터 핸들러
    handleStatusFilterChange,
    handleTypeFilterChange,
    handleTriggerSourceFilterChange,
    handleSearch,

    // 재발송
    retryingId,
    handleRetry,

    // SMS Sheets
    showSendSheet,
    setShowSendSheet,
    showBulkSMSSheet,
    setShowBulkSMSSheet,

    // 메시지 상세
    selectedLog,
    setSelectedLog,

    // Lightbox (이미지 확대 보기)
    lightboxOpen,
    setLightboxOpen,
    lightboxIndex,
    setLightboxIndex,

    // 발송 완료 콜백
    handleSendComplete,
  };
}
