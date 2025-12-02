"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Users,
  Building2,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { createBulkSMSJob, getBulkSMSJob, BulkSMSJobDetail } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

interface DirectSMSSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "customer" | "partner";
  selectedIds: number[];
  onComplete?: () => void;
}

type Status = "compose" | "sending" | "success" | "error";

export function DirectSMSSheet({
  open,
  onOpenChange,
  targetType,
  selectedIds,
  onComplete,
}: DirectSMSSheetProps) {
  const { getValidToken } = useAuthStore();

  const [status, setStatus] = useState<Status>("compose");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkSMSJobDetail | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setError("메시지를 입력해주세요");
      return;
    }

    try {
      setStatus("sending");
      setError(null);

      const token = await getValidToken();
      if (!token) return;

      const jobResult = await createBulkSMSJob(token, {
        job_type: "manual_select",
        target_type: targetType,
        target_ids: selectedIds,
        message,
      });

      // Poll for completion
      const pollJob = async (): Promise<BulkSMSJobDetail> => {
        const job = await getBulkSMSJob(token, jobResult.job_id);
        if (job.status === "processing" || job.status === "pending") {
          await new Promise((r) => setTimeout(r, 1000));
          return pollJob();
        }
        return job;
      };

      const finalJob = await pollJob();
      setResult(finalJob);
      setStatus(finalJob.status === "completed" ? "success" : "error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "발송에 실패했습니다");
      setStatus("error");
    }
  };

  const handleClose = () => {
    if (status === "success") {
      onComplete?.();
    }
    // Reset state
    setStatus("compose");
    setMessage("");
    setError(null);
    setResult(null);
    onOpenChange(false);
  };

  const recipientLabel = targetType === "customer" ? "고객" : "협력사";

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md w-full flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            {targetType === "customer" ? (
              <Users className="w-5 h-5 text-primary" />
            ) : (
              <Building2 className="w-5 h-5 text-primary" />
            )}
            {recipientLabel} {selectedIds.length}명에게 SMS 발송
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 py-6">
          {/* Compose */}
          {status === "compose" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메시지 내용
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="발송할 메시지를 입력하세요"
                  rows={8}
                  maxLength={2000}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>90자 초과 시 LMS로 발송</span>
                  <span className={cn(
                    message.length > 90 ? "text-amber-600" : ""
                  )}>
                    {message.length}/2000
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Sending */}
          {status === "sending" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-900 font-medium">발송 중...</p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedIds.length}명에게 발송하고 있습니다
              </p>
            </div>
          )}

          {/* Success */}
          {status === "success" && result && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-900 font-medium text-lg mb-1">발송 완료</p>
              <p className="text-sm text-gray-500 mb-6">
                {result.sent_count}명에게 성공적으로 발송되었습니다
              </p>

              <div className="w-full grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.sent_count}</p>
                  <p className="text-xs text-gray-500 mt-1">성공</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{result.failed_count}</p>
                  <p className="text-xs text-gray-500 mt-1">실패</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-gray-900 font-medium text-lg mb-1">발송 실패</p>
              <p className="text-sm text-gray-500 mb-4">
                {error || "발송 중 오류가 발생했습니다"}
              </p>

              {result && (
                <div className="w-full grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{result.sent_count}</p>
                    <p className="text-xs text-gray-500 mt-1">성공</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{result.failed_count}</p>
                    <p className="text-xs text-gray-500 mt-1">실패</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t">
          {status === "compose" && (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                발송하기
              </button>
            </div>
          )}

          {(status === "success" || status === "error") && (
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-colors"
            >
              닫기
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
