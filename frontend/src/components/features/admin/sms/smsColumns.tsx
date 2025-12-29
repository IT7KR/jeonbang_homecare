"use client";

import { RefreshCw, Loader2, ImageIcon } from "lucide-react";
import { type ColumnDef } from "@/components/admin";
import type { SMSLogItem } from "@/lib/api/admin";
import { getSMSStatusLabel, getSMSStatusColor } from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";
import { TYPE_LABELS, TRIGGER_SOURCE_LABELS } from "@/hooks/useSMS";

interface ColumnsConfig {
  onMessageClick: (log: SMSLogItem) => void;
  onRetry: (logId: number) => void;
  retryingId: number | null;
}

export function getSMSColumns({
  onMessageClick,
  onRetry,
  retryingId,
}: ColumnsConfig): ColumnDef<SMSLogItem>[] {
  return [
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
            onMessageClick(log);
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
      header: "유형/출처",
      headerClassName: "hidden sm:table-cell",
      render: (log) => {
        const sourceInfo = TRIGGER_SOURCE_LABELS[log.trigger_source] || {
          label: log.trigger_source,
          className: "bg-gray-100 text-gray-700",
        };
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {log.mms_images && log.mms_images.length > 0 && (
                <ImageIcon size={14} className="text-purple-500" />
              )}
              <span className="text-sm text-gray-600">
                {TYPE_LABELS[log.sms_type] || log.sms_type}
              </span>
            </div>
            <span
              className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded w-fit ${sourceInfo.className}`}
            >
              {sourceInfo.label}
            </span>
          </div>
        );
      },
      className: "px-5 py-4 hidden sm:table-cell",
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
      render: (log) =>
        log.status === "failed" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry(log.id);
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
}
