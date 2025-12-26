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
  ArrowLeft,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useConfirm } from "@/hooks";
import { createBulkSMSJob, BulkSMSJobDetail } from "@/lib/api/admin";
import { RecipientSelector } from "./RecipientSelector";
import { BulkSMSProgress } from "./BulkSMSProgress";
import { cn } from "@/lib/utils";

interface BulkSMSSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pre-selected recipients (from external pages)
  preSelectedType?: "customer" | "partner";
  preSelectedIds?: number[];
  onComplete?: () => void;
}

type Step = "type" | "recipients" | "message" | "progress";

const STATUS_OPTIONS = {
  customer: [
    { value: "", label: "전체 상태" },
    { value: "new", label: "신규" },
    { value: "consulting", label: "상담중" },
    { value: "assigned", label: "배정완료" },
    { value: "scheduled", label: "일정확정" },
    { value: "completed", label: "완료" },
  ],
  partner: [
    { value: "", label: "전체 상태" },
    { value: "pending", label: "대기" },
    { value: "approved", label: "승인" },
    { value: "rejected", label: "거절" },
  ],
};

export function BulkSMSSheet({
  open,
  onOpenChange,
  preSelectedType,
  preSelectedIds,
  onComplete,
}: BulkSMSSheetProps) {
  const { getValidToken } = useAuthStore();
  const { confirm } = useConfirm();

  // Current step
  const [step, setStep] = useState<Step>(
    preSelectedType && preSelectedIds?.length ? "message" : "type"
  );

  // Form state
  const [targetType, setTargetType] = useState<"customer" | "partner">(
    preSelectedType || "customer"
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>(preSelectedIds || []);
  const [recipientTotal, setRecipientTotal] = useState(0);
  const [message, setMessage] = useState("");

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);

  // Determine job type based on selection
  const getJobType = () => {
    if (selectedIds.length > 0) return "manual_select";
    if (statusFilter) return "status_notify";
    return "announcement";
  };

  // Handle send
  const handleSend = async () => {
    if (!message.trim()) {
      setSendError("메시지를 입력해주세요");
      return;
    }

    if (selectedIds.length === 0 && !statusFilter) {
      // Sending to ALL - confirm
      const confirmed = await confirm({
        title: "전체 발송 확인",
        description: `전체 ${targetType === "customer" ? "고객" : "협력사"} ${recipientTotal}명에게 발송하시겠습니까?`,
        type: "info",
        confirmText: "발송",
      });
      if (!confirmed) return;
    }

    try {
      setIsSending(true);
      setSendError(null);

      const token = await getValidToken();
      if (!token) return;

      const result = await createBulkSMSJob(token, {
        job_type: getJobType(),
        target_type: targetType,
        target_filter: statusFilter ? { status: statusFilter } : undefined,
        target_ids: selectedIds.length > 0 ? selectedIds : undefined,
        message,
      });

      setJobId(result.job_id);
      setStep("progress");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "발송에 실패했습니다");
    } finally {
      setIsSending(false);
    }
  };

  const handleComplete = (job: BulkSMSJobDetail) => {
    onComplete?.();
  };

  const handleClose = () => {
    // Reset state
    setStep(preSelectedType && preSelectedIds?.length ? "message" : "type");
    setTargetType(preSelectedType || "customer");
    setStatusFilter("");
    setSelectedIds(preSelectedIds || []);
    setMessage("");
    setJobId(null);
    setSendError(null);
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (step) {
      case "type":
        return true;
      case "recipients":
        return true; // Can proceed even without selection (sends to all filtered)
      case "message":
        return message.trim().length > 0;
      default:
        return false;
    }
  };

  const getRecipientCount = () => {
    if (selectedIds.length > 0) return selectedIds.length;
    return recipientTotal;
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <Megaphone className="w-5 h-5 text-primary" />
            대량 SMS 발송
          </SheetTitle>
          <p className="text-sm text-gray-500 mt-1">
            {step === "type" && "발송 대상과 조건을 선택하세요"}
            {step === "recipients" && "수신자를 확인하거나 개별 선택하세요"}
            {step === "message" && "발송할 메시지를 작성하세요"}
            {step === "progress" && "발송 진행 상황"}
          </p>
        </SheetHeader>

        {/* Step: Type Selection */}
        {step === "type" && (
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 space-y-6">
              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  발송 대상
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTargetType("customer")}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      targetType === "customer"
                        ? "border-primary bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Users
                      className={cn(
                        "w-8 h-8 mx-auto mb-2",
                        targetType === "customer" ? "text-primary" : "text-gray-400"
                      )}
                    />
                    <p className={cn(
                      "font-medium text-sm",
                      targetType === "customer" ? "text-primary" : "text-gray-700"
                    )}>
                      고객
                    </p>
                  </button>
                  <button
                    onClick={() => setTargetType("partner")}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      targetType === "partner"
                        ? "border-primary bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Building2
                      className={cn(
                        "w-8 h-8 mx-auto mb-2",
                        targetType === "partner" ? "text-primary" : "text-gray-400"
                      )}
                    />
                    <p className={cn(
                      "font-medium text-sm",
                      targetType === "partner" ? "text-primary" : "text-gray-700"
                    )}>
                      협력사
                    </p>
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태별 필터 (선택사항)
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                >
                  {STATUS_OPTIONS[targetType].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  전체 상태를 선택하면 해당 유형 전체에게 발송됩니다
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6">
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => setStep("recipients")}
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  다음
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Recipients Selection */}
        {step === "recipients" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <RecipientSelector
                targetType={targetType}
                statusFilter={statusFilter || undefined}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onTotalChange={setRecipientTotal}
              />
            </div>

            <div className="px-6 py-4 border-t">
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("type")}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  onClick={() => setStep("message")}
                  disabled={!canProceed()}
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  다음
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Message Composition */}
        {step === "message" && (
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 space-y-5">
              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-lg shadow-sm">
                    {targetType === "customer" ? (
                      <Users className="w-5 h-5 text-primary" />
                    ) : (
                      <Building2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {targetType === "customer" ? "고객" : "협력사"}{" "}
                      <span className="text-primary">{getRecipientCount()}명</span>에게 발송
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedIds.length > 0 ? "선택된 수신자" : statusFilter ? `${STATUS_OPTIONS[targetType].find(o => o.value === statusFilter)?.label} 상태` : "전체"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
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
                  <span className={cn(message.length > 90 ? "text-amber-600" : "")}>
                    {message.length}/2000
                  </span>
                </div>
              </div>

              {/* Error */}
              {sendError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  {sendError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(preSelectedIds?.length ? "message" : "recipients")}
                  disabled={isSending}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  onClick={handleSend}
                  disabled={!canProceed() || isSending}
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      발송하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Progress */}
        {step === "progress" && jobId && (
          <div className="flex-1 flex flex-col p-6">
            <BulkSMSProgress
              jobId={jobId}
              onComplete={handleComplete}
              onClose={handleClose}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
