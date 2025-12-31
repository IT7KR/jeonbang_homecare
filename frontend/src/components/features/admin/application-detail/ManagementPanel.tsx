"use client";

import Link from "next/link";
import {
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Save,
  XCircle,
  Loader2,
  Zap,
  User,
} from "lucide-react";
import { ApplicationDetail, ApplicationNote, CustomerHistoryResponse } from "@/lib/api/admin";
import { STATUS_OPTIONS, getStatusInfo, willSendSmsForStatusChange } from "@/lib/constants/application";
import { getServiceName } from "@/lib/utils/service";

interface ManagementPanelProps {
  application: ApplicationDetail;
  notes: ApplicationNote[];
  customerHistory: CustomerHistoryResponse | null;
  unassignedServices: string[];
  status: string;
  setStatus: (status: string) => void;
  originalStatus: string;
  hasStatusChanged: boolean;
  sendSms: boolean;
  setSendSms: (sendSms: boolean) => void;
  isSaving: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSave: () => void;
  setShowCancelModal: (show: boolean) => void;
  applicationId: number;
}

export function ManagementPanel({
  application,
  notes,
  customerHistory,
  unassignedServices,
  status,
  setStatus,
  originalStatus,
  hasStatusChanged,
  sendSms,
  setSendSms,
  isSaving,
  expanded,
  onToggle,
  onSave,
  setShowCancelModal,
  applicationId,
}: ManagementPanelProps) {
  return (
    <div className="lg:sticky lg:top-6 space-y-6">
      {/* 처리 관리 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            처리 관리
          </h2>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* 상태 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                상태
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 안내 메시지 */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700">
                협력사 배정, 일정, 비용은 아래 &quot;협력사 배정&quot; 섹션에서 관리합니다.
              </p>
            </div>

            {/* SMS 알림 & 저장 */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              {hasStatusChanged && willSendSmsForStatusChange(originalStatus, status) && (
                <label className="flex items-start gap-2.5 p-2.5 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-secondary" />
                      <span className="font-medium text-secondary-800 text-sm">
                        SMS 알림 발송
                      </span>
                    </div>
                    <p className="text-xs text-secondary-600 mt-0.5">
                      고객에게 상태 변경 알림
                    </p>
                  </div>
                </label>
              )}

              <button
                onClick={onSave}
                disabled={isSaving}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    저장하기
                  </>
                )}
              </button>

              {/* 취소 버튼 */}
              {application.status !== "cancelled" && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-2.5 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <XCircle size={18} className="mr-2" />
                  신청 취소
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 빠른 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap size={16} className="text-amber-500" />
          빠른 정보
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">배정 협력사</span>
            <span className="font-medium">{application.assignments?.length || 0}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">선택 서비스</span>
            <span className="font-medium">{application.selected_services.length}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">미배정 서비스</span>
            <span
              className={`font-medium ${
                unassignedServices.length > 0 ? "text-amber-600" : "text-green-600"
              }`}
            >
              {unassignedServices.length}개
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">메모</span>
            <span className="font-medium">{notes.length}개</span>
          </div>
        </div>
      </div>

      {/* 고객 이력 */}
      {customerHistory && customerHistory.total_applications > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User size={16} className="text-blue-500" />
            고객 이력
            <span className="text-xs font-normal text-gray-500 ml-auto">
              총 {customerHistory.total_applications}건
            </span>
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {customerHistory.customer_phone_masked}
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {customerHistory.applications
              .filter((app) => app.id !== applicationId)
              .map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  className="block p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {app.application_number}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        getStatusInfo(app.status).color
                      }`}
                    >
                      {app.status_label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{new Date(app.created_at).toLocaleDateString("ko-KR")}</span>
                    <span>·</span>
                    <span>
                      {app.selected_services
                        .slice(0, 2)
                        .map((s: string) => getServiceName(s))
                        .join(", ")}
                      {app.selected_services.length > 2 &&
                        ` 외 ${app.selected_services.length - 2}개`}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
          {customerHistory.total_applications > 5 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              최근 {Math.min(customerHistory.applications.length, 10)}건 표시
            </p>
          )}
        </div>
      )}
    </div>
  );
}
