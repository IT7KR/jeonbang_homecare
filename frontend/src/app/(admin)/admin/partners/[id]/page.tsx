"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { usePartnerDetail } from "@/hooks/usePartnerDetail";
import {
  PartnerDetailHeader,
  PartnerInfoSection,
  PartnerServicesSection,
  BusinessRegistrationSection,
  PartnerManagementPanel,
  PartnerStatusChangeModal,
} from "@/components/features/admin/partner-detail";
import { MMSSheet } from "@/components/features/admin/sms";

export default function PartnerDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const hook = usePartnerDetail(id);

  // 로딩 상태
  if (hook.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // 에러 상태 (데이터 없음)
  if (hook.error && !hook.partner) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/partners"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          목록으로
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {hook.error}
        </div>
      </div>
    );
  }

  if (!hook.partner) return null;

  const { partner, similarPartners, timelineNotes, timelineAuditLogs } = hook;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <PartnerDetailHeader
        partner={partner}
        isChangingStatus={hook.isChangingStatus}
        onStatusChange={hook.handleStatusChange}
        onSendSMS={() => hook.setShowMMSSheet(true)}
      />

      {/* 메시지 */}
      {hook.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {hook.error}
        </div>
      )}
      {hook.successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600">
          {hook.successMessage}
        </div>
      )}

      {/* 3:2 좌우 분할 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 좌측 영역 (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          <PartnerInfoSection partner={partner} />
          <PartnerServicesSection partner={partner} />
          <BusinessRegistrationSection partner={partner} />
        </div>

        {/* 우측 영역 (2/5) */}
        <div className="lg:col-span-2">
          <PartnerManagementPanel
            partner={partner}
            timelineNotes={timelineNotes}
            timelineAuditLogs={timelineAuditLogs}
            similarPartners={similarPartners}
            isAddingNote={hook.isAddingNote}
            onAddNote={hook.handleAddNote}
            onDeleteNote={hook.handleDeleteNote}
          />
        </div>
      </div>

      {/* 상태 변경 확인 모달 */}
      <PartnerStatusChangeModal
        isOpen={hook.showStatusReasonModal && hook.pendingStatus !== null}
        onClose={hook.handleCancelStatusChange}
        onConfirm={hook.confirmStatusChange}
        currentStatus={partner.status}
        newStatus={hook.pendingStatus || ""}
        isLoading={hook.isChangingStatus}
      />

      {/* MMS 발송 시트 */}
      <MMSSheet
        open={hook.showMMSSheet}
        onOpenChange={hook.setShowMMSSheet}
        recipientName={partner.representative_name}
        recipientPhone={partner.contact_phone}
        smsType="partner"
      />
    </div>
  );
}
