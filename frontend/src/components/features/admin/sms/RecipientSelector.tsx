"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Users, Building2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { getSMSRecipients, SMSRecipient } from "@/lib/api/admin";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface RecipientSelectorProps {
  targetType: "customer" | "partner";
  statusFilter?: string;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onTotalChange?: (total: number) => void;
}

export function RecipientSelector({
  targetType,
  statusFilter,
  selectedIds,
  onSelectionChange,
  onTotalChange,
}: RecipientSelectorProps) {
  const { getValidToken } = useAuthStore();

  const [recipients, setRecipients] = useState<SMSRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 50;

  const loadRecipients = useCallback(async (resetList = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) return;

      const currentPage = resetList ? 1 : page;
      const data = await getSMSRecipients(token, {
        target_type: targetType,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page: currentPage,
        page_size: pageSize,
      });

      if (resetList) {
        setRecipients(data.items);
        setPage(1);
      } else {
        setRecipients((prev) => [...prev, ...data.items]);
      }
      setTotal(data.total);
      setHasMore(data.items.length === pageSize);
      onTotalChange?.(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수신자 목록을 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  }, [targetType, statusFilter, searchQuery, page, getValidToken, onTotalChange]);

  useEffect(() => {
    loadRecipients(true);
  }, [targetType, statusFilter]);

  useEffect(() => {
    if (page > 1) {
      loadRecipients(false);
    }
  }, [page]);

  const handleSearch = () => {
    loadRecipients(true);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === recipients.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(recipients.map((r) => r.id));
    }
  };

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setPage((p) => p + 1);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      new: { bg: "bg-blue-50", text: "text-blue-700", label: "신규" },
      consulting: { bg: "bg-yellow-50", text: "text-yellow-700", label: "상담중" },
      assigned: { bg: "bg-purple-50", text: "text-purple-700", label: "배정완료" },
      scheduled: { bg: "bg-indigo-50", text: "text-indigo-700", label: "일정확정" },
      completed: { bg: "bg-green-50", text: "text-green-700", label: "완료" },
      cancelled: { bg: "bg-gray-50", text: "text-gray-700", label: "취소" },
      pending: { bg: "bg-yellow-50", text: "text-yellow-700", label: "대기" },
      approved: { bg: "bg-green-50", text: "text-green-700", label: "승인" },
      rejected: { bg: "bg-red-50", text: "text-red-700", label: "거절" },
      inactive: { bg: "bg-gray-50", text: "text-gray-700", label: "비활성" },
    };
    const config = status ? statusConfig[status] : null;
    if (!config) return null;
    return (
      <span className={cn("px-2 py-0.5 text-xs rounded-full", config.bg, config.text)}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with select all and count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            {targetType === "customer" ? (
              <Users className="w-5 h-5 text-primary" />
            ) : (
              <Building2 className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {targetType === "customer" ? "고객" : "협력사"} 선택
            </h4>
            <p className="text-sm text-gray-500">
              {selectedIds.length > 0 ? (
                <span className="text-primary font-medium">{selectedIds.length}명 선택됨</span>
              ) : (
                `전체 ${total}명`
              )}
            </p>
          </div>
        </div>
        {recipients.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="text-sm text-primary hover:text-primary-600 font-medium"
          >
            {selectedIds.length === recipients.length ? "전체 해제" : "전체 선택"}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={targetType === "customer" ? "이름, 신청번호 검색" : "회사명 검색"}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors"
        >
          검색
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Recipients list */}
      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
        {isLoading && recipients.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : recipients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Users className="w-8 h-8 mb-2 text-gray-300" />
            <p className="text-sm">수신자가 없습니다</p>
          </div>
        ) : (
          <>
            {recipients.map((recipient) => {
              const isSelected = selectedIds.includes(recipient.id);
              return (
                <div
                  key={recipient.id}
                  onClick={() => handleToggle(recipient.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors",
                    isSelected ? "bg-primary-50" : "hover:bg-gray-50"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(recipient.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {recipient.name}
                      </span>
                      {getStatusBadge(recipient.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-mono">{recipient.phone}</span>
                      <span className="text-gray-300">|</span>
                      <span className="truncate">{recipient.label}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              );
            })}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full py-3 text-sm text-primary font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    불러오는 중...
                  </span>
                ) : (
                  "더 보기"
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
