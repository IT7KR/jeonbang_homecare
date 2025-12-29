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
  const { user } = useAuthStore();
  const { ConfirmDialog, confirm } = useConfirm();

  const {
    // 기본 데이터
    application,
    setApplication,
    partners,
    auditLogs,
    notes,
    customerHistory,
    // 상태
    isLoading,
    isSaving,
    // 모달 상태
    showCancelModal,
    setShowCancelModal,
    showAssignmentModal,
    setShowAssignmentModal,
    showQuoteModal,
    setShowQuoteModal,
    showPartnerUrlModal,
    setShowPartnerUrlModal,
    showCustomerUrlModal,
    setShowCustomerUrlModal,
    showWorkPhotosModal,
    setShowWorkPhotosModal,
    showMMSSheet,
    setShowMMSSheet,
    // 배정 관련
    editingAssignment,
    setEditingAssignment,
    selectedAssignmentId,
    setSelectedAssignmentId,
    // 이미지 관련
    lightboxOpen,
    setLightboxOpen,
    lightboxIndex,
    setLightboxIndex,
    // 계산된 값
    unassignedServices,
    summaryCards,
    assignmentDetails,
    // 핸들러
    handleStatusChange,
    handleCancelApplication,
    handleAddNote,
    handleDeleteNote,
    handleAddAssignment,
    handleUpdateAssignment,
    handleDeleteAssignment,
  } = useApplicationDetail(id);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 데이터 없음
  if (!application) {
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

  // 이미지 데이터 준비
  const photos = application.photo_urls || [];
  const slides = photos.map((url) => ({
    src: url.startsWith("http") ? url : `${FILE_BASE_URL}${url}`,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 헤더 */}
        <ApplicationDetailHeader
          application={application}
          summaryCards={summaryCards}
          isSaving={isSaving}
          onStatusChange={handleStatusChange}
          onCancelClick={() => setShowCancelModal(true)}
          onSendSMS={() => setShowMMSSheet(true)}
        />

        {/* 메인 콘텐츠 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 좌측 2/3: 상세 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 서비스 상세 */}
            <ServiceDetailSection
              application={application}
              photos={photos}
              fileBaseUrl={FILE_BASE_URL}
              onPhotoClick={(index) => {
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}
            />

            {/* 협력사 배정 현황 */}
            <AssignmentsSection
              application={application}
              assignmentDetails={assignmentDetails}
              unassignedServices={unassignedServices}
              onAddAssignment={() => {
                setEditingAssignment(null);
                setShowAssignmentModal(true);
              }}
              onEditAssignment={(assignment) => {
                setEditingAssignment(assignment);
                setShowAssignmentModal(true);
              }}
              onDeleteAssignment={async (assignmentId) => {
                const confirmed = await confirm({
                  title: "배정 삭제",
                  message: "이 배정을 삭제하시겠습니까?",
                  confirmText: "삭제",
                  cancelText: "취소",
                  variant: "danger",
                });
                if (confirmed) {
                  handleDeleteAssignment(assignmentId);
                }
              }}
              onShowQuote={(assignmentId) => {
                setSelectedAssignmentId(assignmentId);
                setShowQuoteModal(true);
              }}
              onShowWorkPhotos={(assignmentId) => {
                setSelectedAssignmentId(assignmentId);
                setShowWorkPhotosModal(true);
              }}
              onShowPartnerUrl={(assignmentId) => {
                setSelectedAssignmentId(assignmentId);
                setShowPartnerUrlModal(true);
              }}
              onShowCustomerUrl={(assignmentId) => {
                setSelectedAssignmentId(assignmentId);
                setShowCustomerUrlModal(true);
              }}
            />
          </div>

          {/* 우측 1/3: 관리 패널 */}
          <div className="space-y-6">
            <ManagementPanel
              application={application}
              customerHistory={customerHistory}
              notes={notes}
              auditLogs={auditLogs}
              userName={user?.name}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        </div>
      </div>

      {/* 이미지 라이트박스 */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />

      {/* 모달들 */}
      {showCancelModal && (
        <CancelApplicationModal
          isSaving={isSaving}
          onConfirm={handleCancelApplication}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {showAssignmentModal && (
        <AssignmentFormModal
          applicationId={id}
          application={application}
          partners={partners}
          editingAssignment={editingAssignment}
          onSave={editingAssignment ? handleUpdateAssignment : handleAddAssignment}
          onClose={() => {
            setShowAssignmentModal(false);
            setEditingAssignment(null);
          }}
        />
      )}

      {showQuoteModal && selectedAssignmentId && (
        <QuoteDetailModal
          applicationId={id}
          assignmentId={selectedAssignmentId}
          application={application}
          setApplication={setApplication}
          onClose={() => {
            setShowQuoteModal(false);
            setSelectedAssignmentId(null);
          }}
        />
      )}

      {showPartnerUrlModal && selectedAssignmentId && (
        <PartnerUrlModal
          applicationId={id}
          assignmentId={selectedAssignmentId}
          application={application}
          partners={partners}
          onClose={() => {
            setShowPartnerUrlModal(false);
            setSelectedAssignmentId(null);
          }}
        />
      )}

      {showCustomerUrlModal && selectedAssignmentId && (
        <CustomerUrlModal
          applicationId={id}
          assignmentId={selectedAssignmentId}
          application={application}
          onClose={() => {
            setShowCustomerUrlModal(false);
            setSelectedAssignmentId(null);
          }}
        />
      )}

      {showWorkPhotosModal && selectedAssignmentId && (
        <WorkPhotosModal
          applicationId={id}
          assignmentId={selectedAssignmentId}
          onClose={() => {
            setShowWorkPhotosModal(false);
            setSelectedAssignmentId(null);
          }}
        />
      )}

      {showMMSSheet && (
        <MMSSheet
          applicationId={id}
          customerName={application.customer_name}
          customerPhone={application.customer_phone}
          onClose={() => setShowMMSSheet(false)}
        />
      )}

      <ConfirmDialog />
    </div>
  );
}
