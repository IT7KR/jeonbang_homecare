"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { useAuthStore } from "@/lib/stores/auth";
import { useConfirm } from "@/hooks";
import {
  useApplicationDetail,
  FILE_BASE_URL,
} from "@/hooks/useApplicationDetail";
import {
  ApplicationDetailHeader,
  ServiceDetailSection,
  AssignmentsSection,
  ManagementPanel,
  CancelApplicationModal,
  AssignmentFormModal,
  QuoteDetailModal,
  PartnerUrlModal,
  CustomerUrlModal,
  WorkPhotosModal,
} from "@/components/features/admin/application-detail";
import { MMSSheet } from "@/components/features/admin/sms";

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { admin } = useAuthStore();
  const { confirm } = useConfirm();

  const hook = useApplicationDetail(id);

  // 로딩 상태
  if (hook.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 데이터 없음
  if (!hook.application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">신청 정보를 찾을 수 없습니다.</p>
        <Link
          href="/admin/applications"
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { application, partners, notes, auditLogs, customerHistory } = hook;

  // 이미지 슬라이드 데이터
  const photos = application.photos || [];
  const slides = photos.map((url: string) => ({
    src: url.startsWith("http") ? url : `${FILE_BASE_URL}${url}`,
  }));

  // 배정 상세 정보 계산
  const assignmentDetails = application.assignments?.map((assignment) => {
    const partner = partners.find((p) => p.id === assignment.partner_id);
    return { ...assignment, partner };
  }) || [];

  // 상태 변경 핸들러
  const handleStatusChange = async (newStatus: string) => {
    hook.setStatus(newStatus);
    setTimeout(() => hook.handleSave(), 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 헤더 */}
        <ApplicationDetailHeader
          application={application}
          summaryCards={hook.summaryCards}
          isSaving={hook.isSaving}
          onStatusChange={handleStatusChange}
          onCancelClick={() => hook.setShowCancelModal(true)}
          onSendSMS={() => hook.setShowMMSSheet(true)}
        />

        {/* 메인 콘텐츠 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 좌측 2/3: 상세 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 서비스 상세 */}
            <ServiceDetailSection
              application={application}
              expanded={hook.expandedSections?.service ?? true}
              onToggle={() => hook.toggleSection?.("service")}
              onPhotoClick={(index: number) => {
                hook.setLightboxIndex(index);
                hook.setLightboxOpen(true);
              }}
              onDownloadPhoto={hook.handleDownloadPhoto}
              onDownloadAllPhotos={hook.handleDownloadAllPhotos}
              isDownloadingAll={hook.isDownloadingAll}
              downloadingPhoto={hook.downloadingPhoto}
            />

            {/* 협력사 배정 현황 */}
            <AssignmentsSection
              application={application}
              partners={partners}
              unassignedServices={hook.unassignedServices}
              expanded={hook.expandedSections?.assignments ?? true}
              onToggle={() => hook.toggleSection?.("assignments")}
              isDeletingAssignment={hook.isDeletingAssignment}
              onOpenNewAssignment={hook.openNewAssignmentModal}
              onEditAssignment={hook.openEditAssignmentModal}
              onDeleteAssignment={async (assignmentId: number) => {
                const confirmed = await confirm({
                  title: "배정 삭제",
                  description: "이 배정을 삭제하시겠습니까?",
                  confirmText: "삭제",
                  cancelText: "취소",
                  confirmVariant: "destructive",
                });
                if (confirmed) {
                  hook.handleDeleteAssignment(assignmentId);
                }
              }}
              onOpenQuote={(assignmentId: number) => {
                hook.setQuoteAssignmentId(assignmentId);
                hook.setIsQuoteModalOpen(true);
              }}
              onOpenPhotos={(assignmentId: number) => {
                hook.setPhotosAssignmentId(assignmentId);
                hook.setIsPhotosModalOpen(true);
              }}
              onOpenPartnerUrl={(assignmentId: number) => {
                hook.setUrlAssignmentId(assignmentId);
                hook.setIsUrlModalOpen(true);
              }}
              onOpenCustomerUrl={(assignmentId: number) => {
                hook.setCustomerUrlAssignmentId(assignmentId);
                hook.setIsCustomerUrlModalOpen(true);
              }}
            />
          </div>

          {/* 우측 1/3: 관리 패널 */}
          <div className="space-y-6">
            <ManagementPanel
              application={application}
              notes={notes}
              customerHistory={customerHistory}
              unassignedServices={hook.unassignedServices}
              status={hook.status}
              setStatus={hook.setStatus}
              originalStatus={hook.originalStatus}
              hasStatusChanged={hook.hasStatusChanged}
              sendSms={hook.sendSms}
              setSendSms={hook.setSendSms}
              isSaving={hook.isSaving}
              expanded={hook.expandedSections?.management ?? true}
              onToggle={() => hook.toggleSection?.("management")}
              onSave={hook.handleSave}
              setShowCancelModal={hook.setShowCancelModal}
              applicationId={id}
            />
          </div>
        </div>
      </div>

      {/* 이미지 라이트박스 */}
      <Lightbox
        open={hook.lightboxOpen}
        close={() => hook.setLightboxOpen(false)}
        index={hook.lightboxIndex}
        slides={slides}
      />

      {/* 모달들 */}
      {hook.showCancelModal && (
        <CancelApplicationModal
          applicationNumber={application.application_number}
          cancelReasonSelect={hook.cancelReasonSelect}
          setCancelReasonSelect={hook.setCancelReasonSelect}
          cancelReasonCustom={hook.cancelReasonCustom}
          setCancelReasonCustom={hook.setCancelReasonCustom}
          sendCancelSms={hook.sendCancelSms}
          setSendCancelSms={hook.setSendCancelSms}
          isCancelling={hook.isCancelling}
          onConfirm={hook.handleCancelApplication}
          onClose={() => hook.setShowCancelModal(false)}
        />
      )}

      {hook.isAssignmentModalOpen && (
        <AssignmentFormModal
          application={application}
          editingAssignment={hook.editingAssignment}
          assignmentForm={hook.assignmentForm}
          setAssignmentForm={hook.setAssignmentForm}
          isPartnerDropdownOpen={hook.isPartnerDropdownOpen}
          setIsPartnerDropdownOpen={hook.setIsPartnerDropdownOpen}
          partnerSearchQuery={hook.partnerSearchQuery}
          setPartnerSearchQuery={hook.setPartnerSearchQuery}
          filteredPartners={hook.filteredPartners}
          selectedPartner={hook.selectedPartner ?? null}
          isAssignmentSaving={hook.isAssignmentSaving}
          onSave={hook.handleSaveAssignment}
          onClose={() => hook.setIsAssignmentModalOpen(false)}
        />
      )}

      {hook.isQuoteModalOpen && hook.quoteAssignmentId && (
        <QuoteDetailModal
          applicationId={id}
          assignmentId={hook.quoteAssignmentId}
          application={application}
          setApplication={hook.setApplication}
          onClose={() => {
            hook.setIsQuoteModalOpen(false);
            hook.setQuoteAssignmentId(null);
          }}
        />
      )}

      {hook.isUrlModalOpen && hook.urlAssignmentId && (
        <PartnerUrlModal
          applicationId={id}
          assignmentId={hook.urlAssignmentId}
          application={application}
          partners={partners}
          onClose={() => {
            hook.setIsUrlModalOpen(false);
            hook.setUrlAssignmentId(null);
          }}
        />
      )}

      {hook.isCustomerUrlModalOpen && hook.customerUrlAssignmentId && (
        <CustomerUrlModal
          applicationId={id}
          assignmentId={hook.customerUrlAssignmentId}
          application={application}
          onClose={() => {
            hook.setIsCustomerUrlModalOpen(false);
            hook.setCustomerUrlAssignmentId(null);
          }}
        />
      )}

      {hook.isPhotosModalOpen && hook.photosAssignmentId && (
        <WorkPhotosModal
          applicationId={id}
          assignmentId={hook.photosAssignmentId}
          onClose={() => {
            hook.setIsPhotosModalOpen(false);
            hook.setPhotosAssignmentId(null);
          }}
        />
      )}

      <MMSSheet
        open={hook.showMMSSheet}
        onOpenChange={hook.setShowMMSSheet}
        recipientName={application.customer_name}
        recipientPhone={application.customer_phone}
      />
    </div>
  );
}
