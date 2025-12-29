"use client";

import {
  Building,
  User,
  FileText,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { PartnerDetail } from "@/lib/api/admin";
import { CollapsibleCard } from "@/components/admin";
import { SafeText } from "@/components/common/SafeText";
import { formatDate, formatPhone } from "@/lib/constants/partner";

interface PartnerInfoSectionProps {
  partner: PartnerDetail;
}

export function PartnerInfoSection({ partner }: PartnerInfoSectionProps) {
  return (
    <CollapsibleCard
      title="기본 정보"
      icon={<Building size={18} />}
      defaultOpen={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">회사 정보</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Building size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">회사/상호명</p>
                <p className="font-medium">{partner.company_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">대표자명</p>
                <p className="font-medium">{partner.representative_name}</p>
              </div>
            </div>
            {partner.business_number && (
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">사업자등록번호</p>
                  <p className="font-medium">{partner.business_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">연락처</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">전화번호</p>
                <p className="font-medium text-gray-900">
                  {formatPhone(partner.contact_phone)}
                </p>
              </div>
            </div>
            {partner.contact_email && (
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">이메일</p>
                  <p className="font-medium text-gray-900">
                    {partner.contact_email}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">주소</p>
                <SafeText
                  text={partner.address}
                  className="font-medium"
                  as="p"
                />
                {partner.address_detail && (
                  <SafeText
                    text={partner.address_detail}
                    className="text-gray-600"
                    as="p"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 승인 정보 */}
      {(partner.status === "approved" ||
        partner.status === "rejected" ||
        partner.rejection_reason ||
        partner.approved_at) && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">승인 정보</h4>
          <div className="space-y-3">
            {partner.approved_at && (
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">승인 일시</p>
                  <p className="font-medium text-green-700">
                    {formatDate(partner.approved_at)}
                  </p>
                </div>
              </div>
            )}
            {partner.rejection_reason && (
              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-red-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">거절 사유</p>
                  <SafeText
                    text={partner.rejection_reason}
                    className="font-medium text-red-700 bg-red-50 px-3 py-2 rounded-lg mt-1 block"
                    as="p"
                  />
                </div>
              </div>
            )}
            {partner.status === "inactive" && (
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-orange-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">상태</p>
                  <p className="font-medium text-orange-700">
                    비활성 상태입니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CollapsibleCard>
  );
}
