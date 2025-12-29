"use client";

import { AlertCircle, MessageSquare, Loader2 } from "lucide-react";
import { CANCEL_REASONS } from "@/lib/constants/application";

interface CancelApplicationModalProps {
  applicationNumber: string;
  cancelReasonSelect: string;
  setCancelReasonSelect: (reason: string) => void;
  cancelReasonCustom: string;
  setCancelReasonCustom: (reason: string) => void;
  sendCancelSms: boolean;
  setSendCancelSms: (send: boolean) => void;
  isCancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelApplicationModal({
  applicationNumber,
  cancelReasonSelect,
  setCancelReasonSelect,
  cancelReasonCustom,
  setCancelReasonCustom,
  sendCancelSms,
  setSendCancelSms,
  isCancelling,
  onClose,
  onConfirm,
}: CancelApplicationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">신청 취소</h3>
            <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{applicationNumber}</span> 신청을 취소하시겠습니까?
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              취소 사유 (선택)
            </label>
            <select
              value={cancelReasonSelect}
              onChange={(e) => setCancelReasonSelect(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
            >
              {CANCEL_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>

            {cancelReasonSelect === "other" && (
              <textarea
                value={cancelReasonCustom}
                onChange={(e) => setCancelReasonCustom(e.target.value)}
                placeholder="취소 사유를 직접 입력하세요..."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            )}
          </div>

          {/* SMS 발송 선택 */}
          <label className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={sendCancelSms}
              onChange={(e) => setSendCancelSms(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-gray-600" />
                <span className="font-medium text-gray-800 text-sm">
                  고객에게 취소 알림 SMS 발송
                </span>
              </div>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isCancelling}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            닫기
          </button>
          <button
            onClick={onConfirm}
            disabled={isCancelling}
            className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isCancelling ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                처리 중...
              </>
            ) : (
              "취소 확인"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
