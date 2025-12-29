"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquare, ChevronDown } from "lucide-react";
import type { PartnerDetail, PartnerStatusChange } from "@/lib/api/admin";
import {
  getPartnerStatusInfo,
  PARTNER_STATUS_OPTIONS,
} from "@/lib/constants/partner";

interface PartnerDetailHeaderProps {
  partner: PartnerDetail;
  isChangingStatus: boolean;
  onStatusChange: (status: PartnerStatusChange["new_status"]) => void;
  onSendSMS: () => void;
}

export function PartnerDetailHeader({
  partner,
  isChangingStatus,
  onStatusChange,
  onSendSMS,
}: PartnerDetailHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const statusInfo = getPartnerStatusInfo(partner.status);

  const handleStatusSelect = (status: PartnerStatusChange["new_status"]) => {
    onStatusChange(status);
    setShowDropdown(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        {/* 상단: 제목 + 상태 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/admin/partners"
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">
                  {partner.company_name}
                </h1>
                <span
                  className={`inline-flex px-2.5 py-0.5 text-sm font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>
                  등록:{" "}
                  {new Date(partner.created_at).toLocaleDateString("ko-KR")}
                </span>
                {partner.updated_at !== partner.created_at && (
                  <span>
                    · 수정:{" "}
                    {new Date(partner.updated_at).toLocaleDateString("ko-KR")}
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
                disabled={isChangingStatus}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} hover:opacity-80 transition-opacity`}
              >
                {isChangingStatus ? (
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
                  {PARTNER_STATUS_OPTIONS.filter(
                    (opt) => opt.value !== partner.status
                  ).map((option) => (
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
