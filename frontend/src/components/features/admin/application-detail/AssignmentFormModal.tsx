"use client";

import { startOfDay } from "date-fns";
import {
  X,
  ChevronDown,
  Search,
  Star,
  Building2,
  User,
  Phone,
  AlertTriangle,
  Check,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { ApplicationDetail, AssignmentSummary } from "@/lib/api/admin";
import { numberToKoreanCurrency } from "@/lib/utils/formatters";
import { TIME_OPTIONS } from "@/lib/constants/application";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PartnerWithMatch, AssignmentFormData } from "@/hooks/useApplicationDetail";
import { formatPhone, formatCurrency, parseCurrency } from "@/hooks/useApplicationDetail";

interface AssignmentFormModalProps {
  application: ApplicationDetail;
  editingAssignment: AssignmentSummary | null;
  assignmentForm: AssignmentFormData;
  setAssignmentForm: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
  isPartnerDropdownOpen: boolean;
  setIsPartnerDropdownOpen: (open: boolean) => void;
  partnerSearchQuery: string;
  setPartnerSearchQuery: (query: string) => void;
  filteredPartners: { matched: PartnerWithMatch[]; unmatched: PartnerWithMatch[] };
  selectedPartner: PartnerWithMatch | null;
  isAssignmentSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function AssignmentFormModal({
  application,
  editingAssignment,
  assignmentForm,
  setAssignmentForm,
  isPartnerDropdownOpen,
  setIsPartnerDropdownOpen,
  partnerSearchQuery,
  setPartnerSearchQuery,
  filteredPartners,
  selectedPartner,
  isAssignmentSaving,
  onClose,
  onSave,
}: AssignmentFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingAssignment ? "배정 수정" : "새 협력사 배정"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 협력사 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              담당 협력사 <span className="text-red-500">*</span>
            </label>

            {editingAssignment ? (
              <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700">
                {selectedPartner?.company_name || "협력사 정보 없음"}
              </div>
            ) : (
              <Popover open={isPartnerDropdownOpen} onOpenChange={setIsPartnerDropdownOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm text-left transition-colors ${
                      isPartnerDropdownOpen
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200 hover:border-gray-300"
                    } ${selectedPartner ? "text-gray-900" : "text-gray-500"}`}
                  >
                    <span className="truncate">
                      {selectedPartner ? selectedPartner.company_name : "협력사를 선택하세요"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`flex-shrink-0 ml-2 transition-transform ${
                        isPartnerDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
                  {/* 검색 입력 */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={partnerSearchQuery}
                        onChange={(e) => setPartnerSearchQuery(e.target.value)}
                        placeholder="협력사명, 담당자, 서비스로 검색..."
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* 협력사 목록 */}
                  <div className="max-h-64 overflow-y-auto">
                    {/* 추천 협력사 */}
                    {filteredPartners.matched.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 flex items-center gap-1.5 sticky top-0">
                          <Star size={12} className="fill-current" />
                          추천 협력사 (서비스 매칭)
                        </div>
                        {filteredPartners.matched.map((partner) => (
                          <button
                            key={partner.id}
                            type="button"
                            onClick={() => {
                              setAssignmentForm((prev) => ({ ...prev, partner_id: partner.id }));
                              setIsPartnerDropdownOpen(false);
                              setPartnerSearchQuery("");
                            }}
                            className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                              assignmentForm.partner_id === partner.id ? "bg-primary-50" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {partner.company_name}
                                  </span>
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                    {partner.matchCount}개 매칭
                                  </span>
                                </div>
                                {partner.representative_name && (
                                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                    <User size={10} />
                                    {partner.representative_name}
                                    {partner.contact_phone && (
                                      <>
                                        <span className="mx-1">·</span>
                                        <Phone size={10} />
                                        {formatPhone(partner.contact_phone)}
                                      </>
                                    )}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {partner.matchedServices.slice(0, 3).map((s, i) => (
                                    <span key={i} className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                                      {s}
                                    </span>
                                  ))}
                                  {partner.matchedServices.length > 3 && (
                                    <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                      +{partner.matchedServices.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {assignmentForm.partner_id === partner.id && (
                                <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredPartners.matched.length === 0 && (
                      <div className="px-3 py-6 text-center text-gray-500">
                        {partnerSearchQuery ? (
                          <>
                            <Building2 size={24} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">검색 결과가 없습니다</p>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={24} className="mx-auto mb-2 text-amber-400" />
                            <p className="text-sm font-medium text-gray-700">매칭되는 협력사가 없습니다</p>
                            <p className="text-xs mt-1">
                              미배정 서비스를 제공하는 협력사가 없습니다.
                              <br />
                              협력사의 서비스 영역을 확인해주세요.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* 선택된 협력사 미리보기 카드 */}
            {selectedPartner && !editingAssignment && (
              <div className="mt-2 p-3 bg-primary-50/50 border border-primary-100 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={14} className="text-primary" />
                      <span className="font-semibold text-gray-900 text-sm">
                        {selectedPartner.company_name}
                      </span>
                      {selectedPartner.isMatched && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                          {selectedPartner.matchCount}개 매칭
                        </span>
                      )}
                    </div>
                    {selectedPartner.representative_name && (
                      <p className="text-xs text-gray-600 flex items-center gap-1.5">
                        <User size={10} />
                        {selectedPartner.representative_name}
                      </p>
                    )}
                    {selectedPartner.contact_phone && (
                      <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                        <Phone size={10} />
                        {formatPhone(selectedPartner.contact_phone)}
                      </p>
                    )}
                    {selectedPartner.isMatched && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">매칭 서비스:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedPartner.matchedServices.map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignmentForm((prev) => ({ ...prev, partner_id: "" }))}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="선택 해제"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 담당 서비스 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              담당 서비스 <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {application?.selected_services.map((service) => {
                const isChecked = assignmentForm.assigned_services.includes(service);
                const isAssignedToOther = application?.assignments?.some(
                  (a) => a.id !== editingAssignment?.id && a.assigned_services.includes(service)
                );

                return (
                  <label
                    key={service}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isAssignedToOther
                        ? "bg-gray-50 opacity-50"
                        : isChecked
                        ? "bg-primary-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isAssignedToOther}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignmentForm((prev) => ({
                            ...prev,
                            assigned_services: [...prev.assigned_services, service],
                          }));
                        } else {
                          setAssignmentForm((prev) => ({
                            ...prev,
                            assigned_services: prev.assigned_services.filter((s) => s !== service),
                          }));
                        }
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span
                      className={`text-sm ${
                        isAssignedToOther
                          ? "text-gray-400 line-through"
                          : isChecked
                          ? "text-primary-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {service}
                    </span>
                    {isAssignedToOther && (
                      <span className="ml-auto text-xs text-gray-400">(다른 배정)</span>
                    )}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              선택됨: {assignmentForm.assigned_services.length}개
            </p>
          </div>

          {/* 일정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">예정 일정</label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                date={assignmentForm.scheduled_date}
                onDateChange={(date) => setAssignmentForm((prev) => ({ ...prev, scheduled_date: date }))}
                placeholder="날짜"
                fromDate={startOfDay(new Date())}
              />
              <select
                value={assignmentForm.scheduled_time}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 견적 비용 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">견적 비용</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(assignmentForm.estimated_cost)}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({ ...prev, estimated_cost: parseCurrency(e.target.value) }))
                  }
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
              </div>
              {assignmentForm.estimated_cost !== "" && assignmentForm.estimated_cost > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {numberToKoreanCurrency(assignmentForm.estimated_cost)}
                </p>
              )}
            </div>

            {editingAssignment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">최종 비용</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrency(assignmentForm.final_cost)}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({ ...prev, final_cost: parseCurrency(e.target.value) }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
                </div>
                {assignmentForm.final_cost !== "" && assignmentForm.final_cost > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {numberToKoreanCurrency(assignmentForm.final_cost)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 견적 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">견적 메모</label>
            <textarea
              value={assignmentForm.estimate_note}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, estimate_note: e.target.value }))}
              placeholder="견적에 대한 설명을 입력하세요 (예: 작업 범위, 추가 비용 안내 등)"
              rows={2}
              maxLength={1000}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{assignmentForm.estimate_note.length}/1000</p>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">메모</label>
            <textarea
              value={assignmentForm.note}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="배정 관련 메모를 입력하세요..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* SMS 알림 */}
          <label className="flex items-center gap-2.5 p-3 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100 transition-colors">
            <input
              type="checkbox"
              checked={assignmentForm.send_sms}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, send_sms: e.target.checked }))}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-secondary" />
                <span className="font-medium text-secondary-800 text-sm">SMS 알림 발송</span>
              </div>
              <p className="text-xs text-secondary-600 mt-0.5">협력사에게 배정 알림 SMS를 발송합니다</p>
            </div>
          </label>
        </div>

        {/* 푸터 */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isAssignmentSaving}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={isAssignmentSaving || !assignmentForm.partner_id || assignmentForm.assigned_services.length === 0}
            className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isAssignmentSaving ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                저장 중...
              </>
            ) : editingAssignment ? (
              "수정"
            ) : (
              "배정 추가"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
