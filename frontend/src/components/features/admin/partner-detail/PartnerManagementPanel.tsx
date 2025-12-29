"use client";

import Link from "next/link";
import { Settings, StickyNote, AlertTriangle, Loader2 } from "lucide-react";
import type { PartnerDetail, SimilarPartnersResponse, PartnerStatusChange } from "@/lib/api/admin";
import {
  ActivityTimeline,
  type NoteItem,
  type AuditItem,
} from "@/components/admin";
import { SafeBlockText } from "@/components/common/SafeText";
import {
  getPartnerStatusInfo,
  formatPhone,
} from "@/lib/constants/partner";

interface PartnerManagementPanelProps {
  partner: PartnerDetail;
  timelineNotes: NoteItem[];
  timelineAuditLogs: AuditItem[];
  similarPartners: SimilarPartnersResponse | null;
  isChangingStatus: boolean;
  isAddingNote: boolean;
  showStatusReasonModal: boolean;
  statusChangeReason: string;
  pendingStatus: PartnerStatusChange["new_status"] | null;
  onStatusChangeReasonChange: (value: string) => void;
  onCancelStatusChange: () => void;
  onConfirmStatusChange: () => void;
  onAddNote: (content: string) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
}

export function PartnerManagementPanel({
  partner,
  timelineNotes,
  timelineAuditLogs,
  similarPartners,
  isChangingStatus,
  isAddingNote,
  showStatusReasonModal,
  statusChangeReason,
  pendingStatus,
  onStatusChangeReasonChange,
  onCancelStatusChange,
  onConfirmStatusChange,
  onAddNote,
  onDeleteNote,
}: PartnerManagementPanelProps) {
  const statusInfo = getPartnerStatusInfo(partner.status);

  return (
    <div className="space-y-4">
      {/* 상태 관리 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Settings size={18} className="text-primary" />
          상태 관리
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">현재 상태</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
          {(pendingStatus === "rejected" || pendingStatus === "inactive") &&
            showStatusReasonModal && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {pendingStatus === "rejected" ? "거절" : "비활성화"} 사유
                </label>
                <textarea
                  value={statusChangeReason}
                  onChange={(e) => onStatusChangeReasonChange(e.target.value)}
                  placeholder="사유를 입력하세요"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={onCancelStatusChange}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={onConfirmStatusChange}
                    disabled={isChangingStatus}
                    className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                  >
                    {isChangingStatus ? (
                      <Loader2 className="animate-spin mx-auto" size={16} />
                    ) : (
                      "확인"
                    )}
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* 활동 이력 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <StickyNote size={18} className="text-primary" />
          활동 이력
          {(timelineNotes.length > 0 || timelineAuditLogs.length > 0) && (
            <span className="text-sm font-normal text-gray-500">
              (메모 {timelineNotes.length}개, 변경{" "}
              {timelineAuditLogs.length}개)
            </span>
          )}
        </h3>

        {/* 기존 관리자 메모 (레거시) */}
        {partner.admin_memo && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <StickyNote
                size={14}
                className="text-amber-600 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-700 font-medium mb-1">
                  기존 관리자 메모
                </p>
                <SafeBlockText
                  text={partner.admin_memo}
                  className="text-sm text-amber-900"
                />
              </div>
            </div>
          </div>
        )}

        <ActivityTimeline
          notes={timelineNotes}
          auditLogs={timelineAuditLogs}
          showInput={true}
          isAddingNote={isAddingNote}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
          emptyMessage="아직 활동 이력이 없습니다"
        />
      </div>

      {/* 유사 협력사 */}
      {similarPartners && similarPartners.total > 0 && (
        <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-4">
          <h3 className="text-base font-semibold text-amber-900 flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            유사 협력사
            <span className="text-sm font-normal text-amber-700 ml-auto">
              {similarPartners.total}건
            </span>
          </h3>
          <p className="text-xs text-amber-700 mb-3">
            동일한 전화번호 또는 사업자등록번호를 가진 협력사가 있습니다.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {similarPartners.similar_partners.map((p) => {
              const pStatusInfo = getPartnerStatusInfo(p.status);
              return (
                <Link
                  key={p.id}
                  href={`/admin/partners/${p.id}`}
                  className="block p-3 bg-white hover:bg-amber-100/50 rounded-lg transition-colors border border-amber-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {p.company_name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {p.representative_name} · {formatPhone(p.contact_phone)}
                      </p>
                      {p.business_number && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          사업자번호: {p.business_number}
                        </p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${pStatusInfo.bgColor} ${pStatusInfo.color}`}
                    >
                      {pStatusInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    등록: {new Date(p.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
