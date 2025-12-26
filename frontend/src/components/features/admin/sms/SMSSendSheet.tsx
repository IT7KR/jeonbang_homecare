"use client";

import { useState, useEffect } from "react";
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
  Search,
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getSMSRecipients,
  createBulkSMSJob,
  getBulkSMSJob,
  SMSRecipient,
  BulkSMSJobDetail,
} from "@/lib/api/admin";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SMSSendSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  /** true일 경우 단일 수신자만 선택 가능 */
  singleSelect?: boolean;
}

type Tab = "customer" | "partner";
type Status = "select" | "compose" | "sending" | "success" | "error";

interface SelectedRecipient {
  id: number;
  name: string;
  phone: string;
  type: "customer" | "partner";
}

export function SMSSendSheet({
  open,
  onOpenChange,
  onComplete,
  singleSelect = false,
}: SMSSendSheetProps) {
  const { getValidToken } = useAuthStore();

  const [status, setStatus] = useState<Status>("select");
  const [activeTab, setActiveTab] = useState<Tab>("customer");

  // Recipients
  const [customers, setCustomers] = useState<SMSRecipient[]>([]);
  const [partners, setPartners] = useState<SMSRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search
  const [customerSearch, setCustomerSearch] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");

  // Pagination
  const [customerPage, setCustomerPage] = useState(1);
  const [partnerPage, setPartnerPage] = useState(1);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [partnerTotal, setPartnerTotal] = useState(0);
  const pageSize = 20;

  // Message
  const [message, setMessage] = useState("");

  // Result
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkSMSJobDetail | null>(null);

  // Load recipients
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const token = await getValidToken();
      if (!token) return;

      const data = await getSMSRecipients(token, {
        target_type: "customer",
        search: customerSearch || undefined,
        page: customerPage,
        page_size: pageSize,
      });
      setCustomers(data.items);
      setCustomerTotal(data.total);
    } catch (err) {
      console.error("고객 목록 로드 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPartners = async () => {
    try {
      setIsLoading(true);
      const token = await getValidToken();
      if (!token) return;

      const data = await getSMSRecipients(token, {
        target_type: "partner",
        search: partnerSearch || undefined,
        page: partnerPage,
        page_size: pageSize,
      });
      setPartners(data.items);
      setPartnerTotal(data.total);
    } catch (err) {
      console.error("협력사 목록 로드 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === "customer") {
      loadCustomers();
    }
  }, [open, activeTab, customerPage, customerSearch]);

  useEffect(() => {
    if (open && activeTab === "partner") {
      loadPartners();
    }
  }, [open, activeTab, partnerPage, partnerSearch]);

  // Toggle recipient selection
  const toggleRecipient = (recipient: SMSRecipient) => {
    const exists = selectedRecipients.find(
      (r) => r.id === recipient.id && r.type === recipient.type
    );
    if (exists) {
      setSelectedRecipients(
        selectedRecipients.filter(
          (r) => !(r.id === recipient.id && r.type === recipient.type)
        )
      );
    } else {
      // singleSelect 모드일 경우 기존 선택 초기화 후 새로운 수신자만 선택
      const newRecipient = {
        id: recipient.id,
        name: recipient.name,
        phone: recipient.phone,
        type: recipient.type,
      };
      setSelectedRecipients(singleSelect ? [newRecipient] : [...selectedRecipients, newRecipient]);
    }
  };

  const isSelected = (recipient: SMSRecipient) => {
    return selectedRecipients.some(
      (r) => r.id === recipient.id && r.type === recipient.type
    );
  };

  const removeRecipient = (recipient: SelectedRecipient) => {
    setSelectedRecipients(
      selectedRecipients.filter(
        (r) => !(r.id === recipient.id && r.type === recipient.type)
      )
    );
  };

  // Send
  const handleSend = async () => {
    if (!message.trim()) {
      setError("메시지를 입력해주세요");
      return;
    }

    if (selectedRecipients.length === 0) {
      setError("수신자를 선택해주세요");
      return;
    }

    try {
      setStatus("sending");
      setError(null);

      const token = await getValidToken();
      if (!token) return;

      // Group by type
      const customerIds = selectedRecipients
        .filter((r) => r.type === "customer")
        .map((r) => r.id);
      const partnerIds = selectedRecipients
        .filter((r) => r.type === "partner")
        .map((r) => r.id);

      // Send to each group
      const results: BulkSMSJobDetail[] = [];

      if (customerIds.length > 0) {
        const job = await createBulkSMSJob(token, {
          job_type: "manual_select",
          target_type: "customer",
          target_ids: customerIds,
          message,
        });
        const finalJob = await pollJob(token, job.job_id);
        results.push(finalJob);
      }

      if (partnerIds.length > 0) {
        const job = await createBulkSMSJob(token, {
          job_type: "manual_select",
          target_type: "partner",
          target_ids: partnerIds,
          message,
        });
        const finalJob = await pollJob(token, job.job_id);
        results.push(finalJob);
      }

      // Combine results
      const combined: BulkSMSJobDetail = {
        ...results[0],
        total_count: results.reduce((sum, r) => sum + r.total_count, 0),
        sent_count: results.reduce((sum, r) => sum + r.sent_count, 0),
        failed_count: results.reduce((sum, r) => sum + r.failed_count, 0),
        status: results.every((r) => r.status === "completed")
          ? "completed"
          : results.some((r) => r.status === "failed")
          ? "failed"
          : "partial_failed",
      };

      setResult(combined);
      setStatus(combined.status === "completed" ? "success" : "error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "발송에 실패했습니다");
      setStatus("error");
    }
  };

  const pollJob = async (token: string, jobId: number): Promise<BulkSMSJobDetail> => {
    const job = await getBulkSMSJob(token, jobId);
    if (job.status === "processing" || job.status === "pending") {
      await new Promise((r) => setTimeout(r, 1000));
      return pollJob(token, jobId);
    }
    return job;
  };

  const handleClose = () => {
    if (status === "success") {
      onComplete?.();
    }
    // Reset
    setStatus("select");
    setActiveTab("customer");
    setSelectedRecipients([]);
    setMessage("");
    setError(null);
    setResult(null);
    setCustomerSearch("");
    setPartnerSearch("");
    setCustomerPage(1);
    setPartnerPage(1);
    onOpenChange(false);
  };

  const currentList = activeTab === "customer" ? customers : partners;
  const currentTotal = activeTab === "customer" ? customerTotal : partnerTotal;
  const currentPage = activeTab === "customer" ? customerPage : partnerPage;
  const setCurrentPage = activeTab === "customer" ? setCustomerPage : setPartnerPage;
  const totalPages = Math.ceil(currentTotal / pageSize);

  const customerCount = selectedRecipients.filter((r) => r.type === "customer").length;
  const partnerCount = selectedRecipients.filter((r) => r.type === "partner").length;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <Send className="w-5 h-5 text-primary" />
            SMS 발송
          </SheetTitle>
        </SheetHeader>

        {/* Select Recipients */}
        {status === "select" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b px-6">
              <button
                onClick={() => setActiveTab("customer")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "customer"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Users className="w-4 h-4 inline mr-1.5" />
                고객 {customerCount > 0 && `(${customerCount})`}
              </button>
              <button
                onClick={() => setActiveTab("partner")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "partner"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Building2 className="w-4 h-4 inline mr-1.5" />
                협력사 {partnerCount > 0 && `(${partnerCount})`}
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === "customer" ? "이름, 신청번호 검색..." : "회사명 검색..."}
                  value={activeTab === "customer" ? customerSearch : partnerSearch}
                  onChange={(e) => {
                    if (activeTab === "customer") {
                      setCustomerSearch(e.target.value);
                      setCustomerPage(1);
                    } else {
                      setPartnerSearch(e.target.value);
                      setPartnerPage(1);
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : currentList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  검색 결과가 없습니다
                </div>
              ) : (
                <div className="space-y-1">
                  {currentList.map((recipient) => (
                    <label
                      key={`${recipient.type}-${recipient.id}`}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                        isSelected(recipient)
                          ? "bg-primary-50 border border-primary/20"
                          : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <Checkbox
                        checked={isSelected(recipient)}
                        onCheckedChange={() => toggleRecipient(recipient)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {recipient.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {recipient.label}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-2 border-t flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {currentTotal}명 중 {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, currentTotal)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}

            {/* Selected Summary */}
            {selectedRecipients.length > 0 && (
              <div className="px-6 py-3 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    선택됨: {selectedRecipients.length}명
                  </span>
                  {/* 복수 선택 모드일 때만 전체 해제 버튼 표시 */}
                  {!singleSelect && (
                    <button
                      onClick={() => setSelectedRecipients([])}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      전체 해제
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {selectedRecipients.slice(0, 10).map((r) => (
                    <span
                      key={`${r.type}-${r.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                    >
                      {r.type === "customer" ? (
                        <Users className="w-3 h-3 text-gray-400" />
                      ) : (
                        <Building2 className="w-3 h-3 text-gray-400" />
                      )}
                      {r.name}
                      <button
                        onClick={() => removeRecipient(r)}
                        className="ml-0.5 p-0.5 hover:bg-gray-100 rounded"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </span>
                  ))}
                  {!singleSelect && selectedRecipients.length > 10 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{selectedRecipients.length - 10}명
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 border-t">
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => setStatus("compose")}
                  disabled={selectedRecipients.length === 0}
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 ({selectedRecipients.length}명)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compose Message */}
        {status === "compose" && (
          <div className="flex-1 flex flex-col p-6">
            {/* Recipients Summary */}
            <div className="p-4 bg-gray-50 rounded-xl mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    <span className="text-primary">{selectedRecipients.length}명</span>에게 발송
                  </p>
                  <p className="text-sm text-gray-500">
                    {customerCount > 0 && `고객 ${customerCount}명`}
                    {customerCount > 0 && partnerCount > 0 && ", "}
                    {partnerCount > 0 && `협력사 ${partnerCount}명`}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="flex-1">
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

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm mt-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStatus("select")}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                이전
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
          </div>
        )}

        {/* Sending */}
        {status === "sending" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-900 font-medium">발송 중...</p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedRecipients.length}명에게 발송하고 있습니다
            </p>
          </div>
        )}

        {/* Success */}
        {status === "success" && result && (
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 flex flex-col items-center justify-center">
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

            <button
              onClick={handleClose}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-colors"
            >
              닫기
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 flex flex-col items-center justify-center">
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

            <button
              onClick={handleClose}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-colors"
            >
              닫기
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
