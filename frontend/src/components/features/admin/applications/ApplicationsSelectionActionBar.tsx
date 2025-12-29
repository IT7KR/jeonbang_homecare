"use client";

import { X, MessageSquare, UserPlus } from "lucide-react";

interface ApplicationsSelectionActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAssign: () => void;
  onSendSMS: () => void;
}

export function ApplicationsSelectionActionBar({
  selectedCount,
  onClearSelection,
  onBulkAssign,
  onSendSMS,
}: ApplicationsSelectionActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
        <span className="text-sm font-medium text-gray-900">
          {selectedCount}건 선택
        </span>
        <button
          onClick={onClearSelection}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>
      <button
        onClick={onBulkAssign}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 text-sm font-medium transition-colors"
      >
        <UserPlus size={16} />
        일괄 배정
      </button>
      <button
        onClick={onSendSMS}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
      >
        <MessageSquare size={16} />
        SMS 발송
      </button>
    </div>
  );
}
