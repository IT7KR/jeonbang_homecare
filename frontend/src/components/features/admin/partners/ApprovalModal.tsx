"use client";

import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { PartnerListItem } from "@/lib/api/admin";

interface ApprovalModalProps {
  partner: PartnerListItem;
  rejectionReason: string;
  onRejectionReasonChange: (value: string) => void;
  isApproving: boolean;
  onApprove: (action: "approve" | "reject") => void;
  onClose: () => void;
}

export function ApprovalModal({
  partner,
  rejectionReason,
  onRejectionReasonChange,
  isApproving,
  onApprove,
  onClose,
}: ApprovalModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            협력사 승인/거절
          </h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-5">
            <strong className="text-gray-900">{partner.company_name}</strong>{" "}
            협력사를 승인하시겠습니까?
          </p>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거절 시 사유 (거절할 경우 필수)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              rows={3}
              placeholder="거절 사유를 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onApprove("reject")}
              disabled={isApproving}
              className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center font-medium transition-colors"
            >
              {isApproving ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <XCircle size={18} className="mr-2" />
              )}
              거절
            </button>
            <button
              onClick={() => onApprove("approve")}
              disabled={isApproving}
              className="flex-1 py-2.5 px-4 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center font-medium transition-colors"
            >
              {isApproving ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <CheckCircle size={18} className="mr-2" />
              )}
              승인
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
