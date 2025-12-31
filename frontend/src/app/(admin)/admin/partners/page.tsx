"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { usePartners, enableManualSMS } from "@/hooks/usePartners";
import { AdminListLayout } from "@/components/admin";
import { DirectSMSSheet } from "@/components/features/admin/sms";
import {
  FilterSection,
  ApprovalModal,
  SelectionActionBar,
  getPartnersColumns,
} from "@/components/features/admin/partners";

export default function PartnersPage() {
  const hook = usePartners();

  // 컬럼 정의
  const columns = useMemo(
    () =>
      getPartnersColumns({
        enableManualSMS,
        selectedIds: hook.selectedIds,
        onToggleSelect: hook.handleToggleSelect,
        onApprovalClick: hook.setApprovalTarget,
      }),
    [hook.selectedIds, hook.handleToggleSelect, hook.setApprovalTarget]
  );

  // 필터 섹션
  const filterSection = (
    <FilterSection
      searchQuery={hook.searchQuery}
      onSearch={hook.handleSearch}
      dateFrom={hook.dateFrom}
      dateTo={hook.dateTo}
      onDateFromChange={hook.handleDateFromChange}
      onDateToChange={hook.handleDateToChange}
      serviceCategories={hook.serviceCategories}
      selectedServices={hook.selectedServices}
      onServicesChange={hook.handleServicesChange}
      filterChips={hook.filterChips}
      onClearAllFilters={hook.handleClearAllFilters}
      statusCards={hook.statusCards}
      activeStatus={hook.statusFilter}
      onStatusCardClick={hook.handleStatusCardClick}
    />
  );

  return (
    <AdminListLayout
      // 헤더
      title="협력사 관리"
      subtitle={
        <p>
          총 <span className="font-semibold text-primary">{hook.total}</span>개의 협력사
        </p>
      }
      headerAction={
        enableManualSMS && hook.partners.length > 0 ? (
          <button
            onClick={hook.handleSelectAll}
            className="text-sm text-gray-600 hover:text-primary"
          >
            {hook.selectedIds.length === hook.partners.length ? "전체 해제" : "전체 선택"}
          </button>
        ) : undefined
      }
      // 기본 필터 섹션 숨김
      hideFilters
      // 상태
      isLoading={hook.isLoading}
      error={hook.error}
      // 테이블
      columns={columns}
      data={hook.partners}
      keyExtractor={(partner) => partner.id}
      emptyIcon={<Users className="w-5 h-5 text-gray-400" />}
      emptyMessage="협력사가 없습니다"
      getRowClassName={hook.getRowClassName}
      // 필터 섹션
      beforeTable={filterSection}
      // 페이지네이션
      page={hook.page}
      totalPages={hook.totalPages}
      total={hook.total}
      pageSize={hook.pageSize}
      onPageChange={hook.setPage}
      unitLabel="개"
      // 모달 및 추가 컴포넌트
      afterPagination={
        <>
          {/* 승인/거절 모달 */}
          {hook.approvalTarget && (
            <ApprovalModal
              partner={hook.approvalTarget}
              rejectionReason={hook.rejectionReason}
              onRejectionReasonChange={hook.setRejectionReason}
              isApproving={hook.isApproving}
              onApprove={hook.handleApprove}
              onClose={hook.closeApprovalModal}
            />
          )}

          {/* SMS 수동 발송 기능 */}
          {enableManualSMS && (
            <>
              <SelectionActionBar
                selectedCount={hook.selectedIds.length}
                onClearSelection={hook.handleClearSelection}
                onSendSMS={() => hook.setShowBulkSMSSheet(true)}
              />
              <DirectSMSSheet
                open={hook.showBulkSMSSheet}
                onOpenChange={hook.setShowBulkSMSSheet}
                targetType="partner"
                selectedIds={hook.selectedIds}
                onComplete={hook.handleClearSelection}
              />
            </>
          )}
        </>
      }
    />
  );
}
