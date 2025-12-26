"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  UserPlus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Search,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { getPartners, bulkAssignApplications } from "@/lib/api/admin";
import type { PartnerListItem, BulkAssignResponse, BulkAssignResult } from "@/lib/api/admin/types";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface BulkAssignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onComplete?: () => void;
}

type Status = "select" | "assigning" | "success" | "error";

export function BulkAssignSheet({
  open,
  onOpenChange,
  selectedIds,
  onComplete,
}: BulkAssignSheetProps) {
  const { getValidToken } = useAuthStore();

  const [status, setStatus] = useState<Status>("select");
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [sendSMS, setSendSMS] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkAssignResponse | null>(null);

  // Load approved partners
  useEffect(() => {
    if (open) {
      loadPartners();
    }
  }, [open]);

  const loadPartners = async () => {
    try {
      setIsLoadingPartners(true);
      const token = await getValidToken();
      if (!token) return;

      const data = await getPartners(token, {
        status: "approved",
        page_size: 100,
      });

      setPartners(data.items);
    } catch (err) {
      setError("협력사 목록을 불러올 수 없습니다");
    } finally {
      setIsLoadingPartners(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPartnerId) {
      setError("협력사를 선택해주세요");
      return;
    }

    try {
      setStatus("assigning");
      setError(null);

      const token = await getValidToken();
      if (!token) return;

      const assignResult = await bulkAssignApplications(token, {
        application_ids: selectedIds,
        partner_id: selectedPartnerId,
        send_sms: sendSMS,
      });

      setResult(assignResult);
      setStatus(assignResult.failed_count === 0 ? "success" : "error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "배정에 실패했습니다");
      setStatus("error");
    }
  };

  const handleClose = () => {
    if (status === "success") {
      onComplete?.();
    }
    // Reset state
    setStatus("select");
    setSelectedPartnerId(null);
    setSendSMS(false);
    setSearchQuery("");
    setError(null);
    setResult(null);
    onOpenChange(false);
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.representative_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md w-full flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <UserPlus className="w-5 h-5 text-primary" />
            {selectedIds.length}건 일괄 배정
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 py-4 overflow-hidden flex flex-col">
          {/* Select Partner */}
          {status === "select" && (
            <div className="flex flex-col h-full space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="협력사명 검색..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              {/* Partner List */}
              <div className="flex-1 overflow-y-auto -mx-2 px-2">
                {isLoadingPartners ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Building2 className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-sm">
                      {searchQuery ? "검색 결과가 없습니다" : "승인된 협력사가 없습니다"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPartners.map((partner) => (
                      <button
                        key={partner.id}
                        onClick={() => setSelectedPartnerId(partner.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                          selectedPartnerId === partner.id
                            ? "border-primary bg-primary-50"
                            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            selectedPartnerId === partner.id
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-500"
                          )}
                        >
                          {selectedPartnerId === partner.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {partner.company_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {partner.representative_name} · {partner.service_areas.slice(0, 2).join(", ")}
                            {partner.service_areas.length > 2 && ` 외 ${partner.service_areas.length - 2}개`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SMS Option */}
              <div className="pt-3 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={sendSMS}
                    onCheckedChange={(checked) => setSendSMS(checked === true)}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">SMS 알림 발송</p>
                    <p className="text-xs text-gray-500">고객에게 협력사 배정 알림 발송</p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Assigning */}
          {status === "assigning" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-900 font-medium">배정 중...</p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedIds.length}건을 {selectedPartner?.company_name}에 배정하고 있습니다
              </p>
            </div>
          )}

          {/* Success */}
          {status === "success" && result && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-900 font-medium text-lg mb-1">배정 완료</p>
              <p className="text-sm text-gray-500 mb-6">
                {result.success_count}건이 {result.partner_name}에 배정되었습니다
              </p>

              <div className="w-full grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.success_count}</p>
                  <p className="text-xs text-gray-500 mt-1">성공</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{result.failed_count}</p>
                  <p className="text-xs text-gray-500 mt-1">실패</p>
                </div>
              </div>
            </div>
          )}

          {/* Error / Partial Success */}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-gray-900 font-medium text-lg mb-1">
                {result ? "일부 배정 실패" : "배정 실패"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {error || "배정 중 오류가 발생했습니다"}
              </p>

              {result && (
                <>
                  <div className="w-full grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{result.success_count}</p>
                      <p className="text-xs text-gray-500 mt-1">성공</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{result.failed_count}</p>
                      <p className="text-xs text-gray-500 mt-1">실패</p>
                    </div>
                  </div>

                  {/* Failed Details */}
                  <div className="w-full max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {result.results
                        .filter((r) => !r.success)
                        .map((r) => (
                          <div
                            key={r.application_id}
                            className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm"
                          >
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="font-mono text-red-700">{r.application_number || `#${r.application_id}`}</span>
                            <span className="text-red-600 text-xs">{r.message}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t">
          {status === "select" && (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedPartnerId}
                className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                배정하기
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
