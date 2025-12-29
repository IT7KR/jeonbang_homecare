"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { ApplicationDetail } from "@/lib/api/admin";
import { STATUS_OPTIONS, getStatusInfo } from "@/lib/constants/application";
import type { SummaryCardItem } from "@/components/admin";

interface ApplicationDetailHeaderProps {
  application: ApplicationDetail;
  summaryCards: SummaryCardItem[];
  isSaving: boolean;
  onStatusChange: (status: string) => void;
  onCancelClick: () => void;
  onSendSMS: () => void;
}

export function ApplicationDetailHeader({
  application,
  summaryCards,
  isSaving,
  onStatusChange,
  onCancelClick,
  onSendSMS,
}: ApplicationDetailHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const statusInfo = getStatusInfo(application.status);

  const handleStatusSelect = (status: string) => {
    if (status === "cancelled") {
      onCancelClick();
    } else {
      onStatusChange(status);
    }
    setShowDropdown(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        {/* 상단: 제목 + 상태 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/admin/applications"
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">
                  {application.application_number}
                </h1>
                <span
                  className={`inline-flex px-2.5 py-0.5 text-sm font-semibold rounded-full border ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>
                  등록: {new Date(application.created_at).toLocaleDateString("ko-KR")}
                </span>
                {application.updated_at !== application.created_at && (
                  <span>
                    · 수정: {new Date(application.updated_at).toLocaleDateString("ko-KR")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 헤더 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {/* 문자 발송 버튼 */}
            <button
              onClick={onSendSMS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare size={14} />
              문자 발송
            </button>

            {/* 상태 변경 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isSaving}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusInfo.color} hover:opacity-80 transition-opacity`}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <>
                    {statusInfo.label}
                    <ChevronDown size={14} />
                  </>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {STATUS_OPTIONS.filter((opt) => opt.value !== application.status).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단: 요약 정보 */}
        {summaryCards && summaryCards.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summaryCards.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.iconBgColor}`}
                  >
                    <span className={item.iconColor}>{item.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  );
}
