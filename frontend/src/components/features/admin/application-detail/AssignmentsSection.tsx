"use client";

import { useState, useMemo } from "react";
import {
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building2,
  Phone,
  Calendar as CalendarIcon,
  FileText,
  Camera,
  Link2,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  MoreHorizontal,
  CheckCircle,
  CheckSquare,
  Square,
  ListChecks,
  MessageSquare,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationDetail, PartnerListItem, AssignmentSummary } from "@/lib/api/admin";
import { getAssignmentQuickAction, ASSIGNMENT_STATUS_MAP } from "@/lib/constants/application";
import { formatPhone } from "@/hooks/useApplicationDetail";
import { AssignmentStatusStepper } from "./AssignmentStatusStepper";
import { AssignmentStatusDropdown } from "./AssignmentStatusDropdown";

interface AssignmentsSectionProps {
  application: ApplicationDetail;
  partners: PartnerListItem[];
  unassignedServices: string[];
  expanded: boolean;
  onToggle: () => void;
  isDeletingAssignment: number | null;
  isChangingStatus: number | null;
  isBatchChanging?: boolean;
  isSendingSms?: { assignmentId: number; target: "customer" | "partner" } | null;
  onOpenNewAssignment: () => void;
  onEditAssignment: (assignment: AssignmentSummary) => void;
  onDeleteAssignment: (assignmentId: number) => void;
  onStatusChange: (assignmentId: number, newStatus: string) => void;
  onBatchStatusChange?: (assignmentIds: number[], newStatus: string, sendSms: boolean) => void;
  onSendSms?: (assignmentId: number, target: "customer" | "partner") => void;
  onOpenQuote: (assignmentId: number) => void;
  onOpenPhotos: (assignmentId: number) => void;
  onOpenPartnerUrl: (assignmentId: number) => void;
  onOpenCustomerUrl: (assignmentId: number) => void;
}

export function AssignmentsSection({
  application,
  partners,
  unassignedServices,
  expanded,
  onToggle,
  isDeletingAssignment,
  isChangingStatus,
  isBatchChanging,
  isSendingSms,
  onOpenNewAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onStatusChange,
  onBatchStatusChange,
  onSendSms,
  onOpenQuote,
  onOpenPhotos,
  onOpenPartnerUrl,
  onOpenCustomerUrl,
}: AssignmentsSectionProps) {
  // 선택된 배정 ID 관리
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // 일괄 변경 메뉴 열림 상태
  const [batchMenuOpen, setBatchMenuOpen] = useState(false);
  // SMS 발송 여부
  const [sendSms, setSendSms] = useState(true);
  // 더보기 메뉴 열림 상태 (assignment.id 저장)
  const [openMoreMenuId, setOpenMoreMenuId] = useState<number | null>(null);

  const assignments = application.assignments || [];
  const hasAssignments = assignments.length > 0;
  const selectedCount = selectedIds.size;
  const allSelected = hasAssignments && selectedCount === assignments.length;
  const someSelected = selectedCount > 0 && selectedCount < assignments.length;

  // 선택된 배정들의 공통 가능한 다음 상태 계산
  const availableNextStatuses = useMemo(() => {
    if (selectedCount === 0) return [];

    const selectedAssignments = assignments.filter((a) => selectedIds.has(a.id));
    const statusCounts: Record<string, number> = {};

    selectedAssignments.forEach((a) => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });

    // 모든 선택된 배정이 같은 상태인 경우에만 다음 상태 표시
    const statuses = Object.keys(statusCounts);
    if (statuses.length === 1) {
      const currentStatus = statuses[0];
      if (currentStatus === "pending") return ["scheduled"];
      if (currentStatus === "scheduled") return ["completed"];
    }

    // 혼합 상태인 경우 모든 가능한 상태 표시
    const allNextStatuses = new Set<string>();
    selectedAssignments.forEach((a) => {
      if (a.status === "pending") allNextStatuses.add("scheduled");
      if (a.status === "scheduled") allNextStatuses.add("completed");
    });
    return Array.from(allNextStatuses);
  }, [selectedIds, assignments, selectedCount]);

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assignments.map((a) => a.id)));
    }
  };

  // 개별 선택/해제
  const handleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // 일괄 상태 변경 실행
  const handleBatchChange = (newStatus: string) => {
    if (onBatchStatusChange && selectedCount > 0) {
      onBatchStatusChange(Array.from(selectedIds), newStatus, sendSms);
      setSelectedIds(new Set());
      setBatchMenuOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Users size={18} className="text-primary" />
          협력사 배정
          {hasAssignments && (
            <span className="text-xs font-normal text-gray-500 ml-1">
              ({assignments.length}개)
            </span>
          )}
        </h2>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 미배정 서비스 알림 */}
          {unassignedServices.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    미배정 서비스 ({unassignedServices.length}개)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {unassignedServices.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 일괄 선택 툴바 */}
          {hasAssignments && assignments.length > 1 && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {allSelected ? (
                    <CheckSquare size={16} className="text-primary" />
                  ) : someSelected ? (
                    <div className="relative">
                      <Square size={16} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-gray-600" />
                      </div>
                    </div>
                  ) : (
                    <Square size={16} />
                  )}
                  {allSelected ? "전체 해제" : "전체 선택"}
                </button>
                {selectedCount > 0 && (
                  <span className="text-sm text-primary font-medium">
                    {selectedCount}개 선택됨
                  </span>
                )}
              </div>

              {/* 일괄 상태 변경 버튼 */}
              {selectedCount > 0 && onBatchStatusChange && (
                <Popover open={batchMenuOpen} onOpenChange={setBatchMenuOpen}>
                  <PopoverTrigger asChild>
                    <button
                      disabled={isBatchChanging}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      {isBatchChanging ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ListChecks size={14} />
                      )}
                      일괄 상태 변경
                      <ChevronDown size={12} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 p-2">
                    <div className="text-xs text-gray-500 px-2 py-1.5 border-b mb-2">
                      선택한 {selectedCount}개 배정의 상태 변경
                    </div>

                    {availableNextStatuses.length > 0 ? (
                      <>
                        {availableNextStatuses.map((status) => {
                          const info = ASSIGNMENT_STATUS_MAP[status];
                          return (
                            <button
                              key={status}
                              onClick={() => handleBatchChange(status)}
                              disabled={isBatchChanging}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors text-left disabled:opacity-50"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  status === "scheduled"
                                    ? "bg-purple-500"
                                    : status === "completed"
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              />
                              <div>
                                <div className="font-medium">{info?.label || status}</div>
                                <div className="text-xs text-gray-500">
                                  {info?.description || ""}
                                </div>
                              </div>
                            </button>
                          );
                        })}

                        <div className="border-t border-gray-100 mt-2 pt-2 px-2">
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <Checkbox
                              checked={sendSms}
                              onCheckedChange={(checked) => setSendSms(checked === true)}
                            />
                            SMS 알림 발송
                          </label>
                        </div>
                      </>
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        선택한 배정들의 상태가 다릅니다.
                        <br />
                        같은 상태의 배정만 선택해주세요.
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}

          {/* 배정 목록 */}
          {hasAssignments ? (
            <div className="space-y-3">
              {assignments.map((assignment) => {
                const partner = partners.find((p) => p.id === assignment.partner_id);
                const quickAction = getAssignmentQuickAction(assignment.status);
                const isLoading = isChangingStatus === assignment.id;
                const isSelected = selectedIds.has(assignment.id);

                return (
                  <div
                    key={assignment.id}
                    className={`border rounded-xl p-4 transition-colors relative ${
                      isSelected
                        ? "border-primary bg-primary-50/30"
                        : "border-gray-200 hover:border-primary/30"
                    }`}
                  >
                    {/* 로딩 오버레이 */}
                    {(isLoading || isBatchChanging) && (
                      <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center z-10">
                        <Loader2 size={24} className="animate-spin text-primary" />
                      </div>
                    )}

                    {/* 헤더: 체크박스 + 협력사 정보 + 상태 드롭다운 */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* 체크박스 (2개 이상일 때만 표시) */}
                        {assignments.length > 1 && (
                          <button
                            onClick={() => handleSelect(assignment.id)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-primary" />
                            ) : (
                              <Square size={18} className="text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 size={14} className="text-primary flex-shrink-0" />
                            <span className="font-semibold text-gray-900 truncate">
                              {assignment.partner_name || assignment.partner_company || "알 수 없음"}
                            </span>
                            <AssignmentStatusDropdown
                              currentStatus={assignment.status}
                              onSelect={(newStatus) => onStatusChange(assignment.id, newStatus)}
                              isLoading={isLoading}
                            />
                          </div>
                          {partner && (
                            <a
                              href={`tel:${partner.contact_phone}`}
                              className="text-xs text-gray-500 hover:text-primary flex items-center gap-1"
                            >
                              <Phone size={10} />
                              {formatPhone(partner.contact_phone)}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* 버튼 그룹 */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => onOpenQuote(assignment.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-200"
                          title="견적 관리"
                        >
                          <FileText size={12} />
                          <span className="hidden sm:inline">견적</span>
                        </button>
                        <button
                          onClick={() => onOpenPhotos(assignment.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-200"
                          title="작업 사진"
                        >
                          <Camera size={12} />
                          <span className="hidden sm:inline">사진</span>
                        </button>

                        {/* 더보기 메뉴 */}
                        <Popover
                          open={openMoreMenuId === assignment.id}
                          onOpenChange={(open) => setOpenMoreMenuId(open ? assignment.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-gray-300"
                              title="더보기"
                            >
                              <MoreHorizontal size={12} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-44 p-1">
                            {/* SMS 발송 */}
                            {onSendSms && (
                              <>
                                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100 mb-1">
                                  SMS 발송
                                </div>
                                <button
                                  onClick={() => {
                                    setOpenMoreMenuId(null);
                                    onSendSms(assignment.id, "customer");
                                  }}
                                  disabled={isSendingSms?.assignmentId === assignment.id}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {isSendingSms?.assignmentId === assignment.id && isSendingSms?.target === "customer" ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <MessageSquare size={14} />
                                  )}
                                  고객에게 발송
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenMoreMenuId(null);
                                    onSendSms(assignment.id, "partner");
                                  }}
                                  disabled={isSendingSms?.assignmentId === assignment.id}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {isSendingSms?.assignmentId === assignment.id && isSendingSms?.target === "partner" ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <MessageSquare size={14} />
                                  )}
                                  협력사에게 발송
                                </button>
                                <div className="my-1 border-t border-gray-100" />
                              </>
                            )}

                            {/* URL 관리 */}
                            <button
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                onOpenPartnerUrl(assignment.id);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                            >
                              <Link2 size={14} />
                              협력사 URL
                            </button>
                            <button
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                onOpenCustomerUrl(assignment.id);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 rounded-md transition-colors"
                            >
                              <Link2 size={14} />
                              고객 URL
                            </button>
                            <div className="my-1 border-t border-gray-100" />

                            {/* 수정/삭제 */}
                            <button
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                onEditAssignment(assignment);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary rounded-md transition-colors"
                            >
                              <Pencil size={14} />
                              배정 수정
                            </button>
                            <button
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                onDeleteAssignment(assignment.id);
                              }}
                              disabled={isDeletingAssignment === assignment.id}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            >
                              {isDeletingAssignment === assignment.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              배정 삭제
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* 스텝 인디케이터 */}
                    <div className="mb-3 py-2 px-1 bg-gray-50 rounded-lg">
                      <AssignmentStatusStepper currentStatus={assignment.status} />
                    </div>

                    {/* 담당 서비스 */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {assignment.assigned_services.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* 일정 & 비용 */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      {(assignment.scheduled_date || assignment.scheduled_time) && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <CalendarIcon size={12} className="text-gray-400" />
                          <span>
                            {assignment.scheduled_date || "미정"}
                            {assignment.scheduled_time && ` ${assignment.scheduled_time}`}
                          </span>
                        </div>
                      )}
                      {(assignment.estimated_cost || assignment.final_cost) && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="text-gray-400">₩</span>
                          <span>
                            {assignment.final_cost
                              ? `${assignment.final_cost.toLocaleString()}원 (최종)`
                              : assignment.estimated_cost
                              ? `${assignment.estimated_cost.toLocaleString()}원 (견적)`
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 퀵 액션 버튼 */}
                    {quickAction && (
                      <div className="pt-3 border-t border-gray-100">
                        <button
                          onClick={() => onStatusChange(assignment.id, quickAction.nextStatus)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                        >
                          {quickAction.icon === "Calendar" ? (
                            <CalendarIcon size={14} />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          {quickAction.label}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">배정된 협력사가 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">
                아래 버튼을 클릭하여 협력사를 배정하세요
              </p>
            </div>
          )}

          {/* 배정 추가 버튼 */}
          <button
            onClick={onOpenNewAssignment}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-600 font-medium rounded-xl hover:border-primary hover:text-primary hover:bg-primary-50/50 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            협력사 배정 추가
          </button>
        </div>
      )}
    </div>
  );
}
