"use client";

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
} from "lucide-react";
import { ApplicationDetail, PartnerListItem, AssignmentSummary } from "@/lib/api/admin";
import { getAssignmentStatusInfo } from "@/lib/constants/application";
import { formatPhone } from "@/hooks/useApplicationDetail";

interface AssignmentsSectionProps {
  application: ApplicationDetail;
  partners: PartnerListItem[];
  unassignedServices: string[];
  expanded: boolean;
  onToggle: () => void;
  isDeletingAssignment: number | null;
  onOpenNewAssignment: () => void;
  onEditAssignment: (assignment: AssignmentSummary) => void;
  onDeleteAssignment: (assignmentId: number) => void;
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
  onOpenNewAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onOpenQuote,
  onOpenPhotos,
  onOpenPartnerUrl,
  onOpenCustomerUrl,
}: AssignmentsSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Users size={18} className="text-primary" />
          협력사 배정
          {application.assignments && application.assignments.length > 0 && (
            <span className="text-xs font-normal text-gray-500 ml-1">
              ({application.assignments.length}개)
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

          {/* 배정 목록 */}
          {application.assignments && application.assignments.length > 0 ? (
            <div className="space-y-3">
              {application.assignments.map((assignment) => {
                const statusInfo = getAssignmentStatusInfo(assignment.status);
                const partner = partners.find((p) => p.id === assignment.partner_id);

                return (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 size={14} className="text-primary" />
                          <span className="font-semibold text-gray-900">
                            {assignment.partner_name || assignment.partner_company || "알 수 없음"}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenQuote(assignment.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-200"
                        >
                          <FileText size={12} />
                          <span>견적</span>
                        </button>
                        <button
                          onClick={() => onOpenPhotos(assignment.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-200"
                        >
                          <Camera size={12} />
                          <span>사진</span>
                        </button>
                        <button
                          onClick={() => onOpenPartnerUrl(assignment.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-200"
                          title="협력사 포털 URL"
                        >
                          <Link2 size={12} />
                          <span>협력사</span>
                        </button>
                        <button
                          onClick={() => onOpenCustomerUrl(assignment.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors border border-gray-200 hover:border-cyan-200"
                          title="고객 열람 URL"
                        >
                          <Link2 size={12} />
                          <span>고객</span>
                        </button>
                        <button
                          onClick={() => onEditAssignment(assignment)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors border border-gray-200 hover:border-primary-200"
                        >
                          <Pencil size={12} />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() => onDeleteAssignment(assignment.id)}
                          disabled={isDeletingAssignment === assignment.id}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200 disabled:opacity-50"
                        >
                          {isDeletingAssignment === assignment.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          <span>삭제</span>
                        </button>
                      </div>
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
                    <div className="grid grid-cols-2 gap-2 text-xs">
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
