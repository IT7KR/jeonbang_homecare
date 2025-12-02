"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { getBulkSMSJob, BulkSMSJobDetail } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

interface BulkSMSProgressProps {
  jobId: number;
  onComplete?: (job: BulkSMSJobDetail) => void;
  onClose?: () => void;
}

export function BulkSMSProgress({ jobId, onComplete, onClose }: BulkSMSProgressProps) {
  const { getValidToken } = useAuthStore();

  const [job, setJob] = useState<BulkSMSJobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const fetchJobStatus = useCallback(async () => {
    try {
      const token = await getValidToken();
      if (!token) return;

      const data = await getBulkSMSJob(token, jobId);
      setJob(data);

      // Stop polling when job is done
      if (["completed", "partial_failed", "failed"].includes(data.status)) {
        setIsPolling(false);
        onComplete?.(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태를 불러올 수 없습니다");
      setIsPolling(false);
    }
  }, [jobId, getValidToken, onComplete]);

  useEffect(() => {
    fetchJobStatus();

    // Poll every 2 seconds while processing
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(fetchJobStatus, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, fetchJobStatus]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      pending: {
        icon: <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />,
        label: "대기 중",
        color: "text-yellow-600",
      },
      processing: {
        icon: <Send className="w-8 h-8 text-primary animate-pulse" />,
        label: "발송 중",
        color: "text-primary",
      },
      completed: {
        icon: <CheckCircle className="w-8 h-8 text-green-500" />,
        label: "발송 완료",
        color: "text-green-600",
      },
      partial_failed: {
        icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
        label: "일부 실패",
        color: "text-orange-600",
      },
      failed: {
        icon: <XCircle className="w-8 h-8 text-red-500" />,
        label: "발송 실패",
        color: "text-red-600",
      },
    };
    return configs[status] || configs.pending;
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsPolling(true);
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-gray-500">발송 상태 확인 중...</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(job.status);
  const isFinished = ["completed", "partial_failed", "failed"].includes(job.status);

  return (
    <div className="p-6 space-y-6">
      {/* Status Icon and Title */}
      <div className="text-center">
        <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
          {statusConfig.icon}
        </div>
        <h3 className={cn("text-xl font-semibold", statusConfig.color)}>
          {statusConfig.label}
        </h3>
        {job.title && (
          <p className="text-gray-500 mt-1">{job.title}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">진행률</span>
          <span className="font-medium text-gray-900">{job.progress.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              job.status === "failed" ? "bg-red-500" :
              job.status === "partial_failed" ? "bg-orange-500" :
              job.status === "completed" ? "bg-green-500" :
              "bg-primary"
            )}
            style={{ width: `${job.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>배치 {job.current_batch}/{job.total_batches}</span>
          <span>{job.sent_count + job.failed_count}/{job.total_count}건 처리</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-2xl font-bold text-gray-900">{job.total_count}</p>
          <p className="text-xs text-gray-500">전체</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-600">{job.sent_count}</p>
          <p className="text-xs text-green-600">성공</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-xl">
          <p className="text-2xl font-bold text-red-600">{job.failed_count}</p>
          <p className="text-xs text-red-600">실패</p>
        </div>
      </div>

      {/* Failed Recipients */}
      {job.failed_recipients && job.failed_recipients.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">실패 목록</h4>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl">
            {job.failed_recipients.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-600">****{r.phone}</span>
                  {r.name && <span className="text-gray-500">{r.name}</span>}
                </div>
                <span className="text-red-500 text-xs truncate max-w-[150px]" title={r.error}>
                  {r.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isFinished && onClose && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium text-sm transition-colors"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}
