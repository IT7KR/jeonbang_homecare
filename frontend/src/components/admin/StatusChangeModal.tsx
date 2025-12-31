"use client";

import { useState, useEffect } from "react";
import { X, Loader2, MessageSquare, ArrowRight } from "lucide-react";

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sendSms: boolean, reason?: string) => void;
  currentStatusLabel: string;
  newStatusLabel: string;
  currentStatusColor?: string;
  newStatusColor?: string;
  isLoading: boolean;
  // SMS 관련
  showSmsOption: boolean;
  smsDescription?: string;
  defaultSmsChecked?: boolean;
  // 사유 입력 관련
  showReasonInput: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatusLabel,
  newStatusLabel,
  currentStatusColor = "bg-gray-100 text-gray-700",
  newStatusColor = "bg-blue-100 text-blue-700",
  isLoading,
  showSmsOption,
  smsDescription = "상태 변경 알림 문자를 발송합니다",
  defaultSmsChecked = true,
  showReasonInput,
  reasonLabel = "사유",
  reasonPlaceholder = "사유를 입력하세요",
  reasonRequired = false,
}: StatusChangeModalProps) {
  const [sendSms, setSendSms] = useState(defaultSmsChecked);
  const [reason, setReason] = useState("");

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setSendSms(defaultSmsChecked);
      setReason("");
    }
  }, [isOpen, defaultSmsChecked]);

  const handleConfirm = () => {
    if (reasonRequired && showReasonInput && !reason.trim()) {
      return;
    }
    onConfirm(sendSms, reason.trim() || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const canConfirm = !reasonRequired || !showReasonInput || reason.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isLoading ? undefined : onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">상태 변경 확인</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-5 py-4 space-y-4">
          {/* 상태 변경 표시 */}
          <div className="flex items-center justify-center gap-3 py-3 bg-gray-50 rounded-xl">
            <span
              className={`px-3 py-1.5 text-sm font-medium rounded-full ${currentStatusColor}`}
            >
              {currentStatusLabel}
            </span>
            <ArrowRight size={18} className="text-gray-400" />
            <span
              className={`px-3 py-1.5 text-sm font-medium rounded-full ${newStatusColor}`}
            >
              {newStatusLabel}
            </span>
          </div>

          {/* 사유 입력 */}
          {showReasonInput && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                {reasonLabel}
                {reasonRequired && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          )}

          {/* SMS 발송 옵션 */}
          {showSmsOption && (
            <label className="flex items-start gap-3 p-3 bg-secondary-50 rounded-xl cursor-pointer hover:bg-secondary-100 transition-colors">
              <input
                type="checkbox"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-secondary" />
                  <span className="font-medium text-secondary-800 text-sm">
                    SMS 알림 발송
                  </span>
                </div>
                <p className="text-xs text-secondary-600 mt-0.5">
                  {smsDescription}
                </p>
              </div>
            </label>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !canConfirm}
            className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                처리 중...
              </>
            ) : (
              "확인"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
