"use client";

import { useMemo } from "react";
import { FileText } from "lucide-react";
import { useApplications, enableManualSMS } from "@/hooks/useApplications";
import { AdminListLayout } from "@/components/admin";
import { DirectSMSSheet } from "@/components/features/admin/sms";
import {
  BulkAssignSheet,
  ApplicationsFilterSection,
  ApplicationsSelectionActionBar,
  getApplicationsColumns,
} from "@/components/features/admin/applications";

export default function ApplicationsPage() {
  const hook = useApplications();

  // 컬럼 정의
  const columns = useMemo(
    () =>
      getApplicationsColumns({
        enableManualSMS,
        selectedIds: hook.selectedIds,
        onToggleSelect: hook.handleToggleSelect,
      }),
    [hook.selectedIds, hook.handleToggleSelect]
  );

  // 필터 섹션
  const filterSection = (
    <ApplicationsFilterSection
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
      title="신청 관리"
      subtitle={
        <p>
          총 <span className="font-semibold text-primary">{hook.total}</span>건의 신청
        </p>
      }
      headerAction={
        enableManualSMS && hook.applications.length > 0 ? (
          <button
            onClick={hook.handleSelectAll}
            className="text-sm text-gray-600 hover:text-primary"
          >
            {hook.selectedIds.length === hook.applications.length ? "전체 해제" : "전체 선택"}
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
      data={hook.applications}
      keyExtractor={(app) => app.id}
      emptyIcon={<FileText className="w-5 h-5 text-gray-400" />}
      emptyMessage="신청 내역이 없습니다"
      getRowClassName={hook.getRowClassName}
      // 페이지네이션
      page={hook.page}
      totalPages={hook.totalPages}
      total={hook.total}
      pageSize={hook.pageSize}
      onPageChange={hook.setPage}
      // 필터 섹션
      beforeTable={filterSection}
      // SMS 수동 발송 기능 활성화 시에만
      afterPagination={
        enableManualSMS ? (
          <>
            <ApplicationsSelectionActionBar
              selectedCount={hook.selectedIds.length}
              onClearSelection={hook.handleClearSelection}
              onBulkAssign={() => hook.setShowBulkAssignSheet(true)}
              onSendSMS={() => hook.setShowBulkSMSSheet(true)}
            />
            <BulkAssignSheet
              open={hook.showBulkAssignSheet}
              onOpenChange={hook.setShowBulkAssignSheet}
              selectedIds={hook.selectedIds}
              onComplete={hook.handleBulkComplete}
            />
            <DirectSMSSheet
              open={hook.showBulkSMSSheet}
              onOpenChange={hook.setShowBulkSMSSheet}
              targetType="customer"
              selectedIds={hook.selectedIds}
              onComplete={hook.handleClearSelection}
            />
          </>
        ) : undefined
      }
    />
  );
}
