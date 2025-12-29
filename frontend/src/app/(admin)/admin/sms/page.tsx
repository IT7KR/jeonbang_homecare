"use client";

import { useMemo } from "react";
import { Send, MessageSquare, Users } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useSMS, enableManualSMS, getImageUrl } from "@/hooks/useSMS";
import { SMS_STATUS_OPTIONS } from "@/lib/constants/status";
import { AdminListLayout } from "@/components/admin";
import {
  BulkSMSSheet,
  SMSSendSheet,
  SMSStatsCards,
  SMSFilters,
  MessageDetailModal,
  getSMSColumns,
} from "@/components/features/admin/sms";

export default function SMSPage() {
  const hook = useSMS();

  // Lightbox용 슬라이드 생성
  const slides = useMemo(() => {
    if (!hook.selectedLog?.mms_images) return [];
    return hook.selectedLog.mms_images.map((imgPath) => ({
      src: getImageUrl(imgPath),
    }));
  }, [hook.selectedLog?.mms_images]);

  // 이미지 클릭 핸들러
  const handleImageClick = (index: number) => {
    hook.setLightboxIndex(index);
    hook.setLightboxOpen(true);
  };

  // 컬럼 정의
  const columns = useMemo(
    () =>
      getSMSColumns({
        onMessageClick: hook.setSelectedLog,
        onRetry: hook.handleRetry,
        retryingId: hook.retryingId,
      }),
    [hook.setSelectedLog, hook.handleRetry, hook.retryingId]
  );

  // 헤더 액션 버튼
  const headerAction = (
    <div className="flex items-center gap-2">
      {enableManualSMS && (
        <button
          onClick={() => hook.setShowBulkSMSSheet(true)}
          className="inline-flex items-center px-4 py-2.5 border border-primary text-primary rounded-xl hover:bg-primary-50 font-medium text-sm transition-colors"
        >
          <Users size={18} className="mr-2" />
          복수 발송
        </button>
      )}
      <button
        onClick={() => hook.setShowSendSheet(true)}
        className="inline-flex items-center px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium text-sm transition-colors shadow-sm"
      >
        <Send size={18} className="mr-2" />
        SMS 발송
      </button>
    </div>
  );

  // 추가 필터
  const additionalFilters = (
    <SMSFilters
      typeFilter={hook.typeFilter}
      onTypeFilterChange={hook.handleTypeFilterChange}
      triggerSourceFilter={hook.triggerSourceFilter}
      onTriggerSourceFilterChange={hook.handleTriggerSourceFilterChange}
    />
  );

  // 통계 카드
  const statsCards = hook.stats && <SMSStatsCards stats={hook.stats} />;

  return (
    <AdminListLayout
      // 헤더
      title="SMS 관리"
      subtitle="SMS 발송 내역 및 수동 발송"
      headerAction={headerAction}
      // 필터
      statusOptions={SMS_STATUS_OPTIONS}
      statusFilter={hook.statusFilter}
      onStatusFilterChange={hook.handleStatusFilterChange}
      additionalFilters={additionalFilters}
      searchPlaceholder="수신번호 검색..."
      searchValue={hook.searchInput}
      onSearchChange={hook.setSearchInput}
      onSearch={hook.handleSearch}
      // 상태
      isLoading={hook.isLoading}
      error={hook.error}
      // 테이블
      columns={columns}
      data={hook.logs}
      keyExtractor={(log) => log.id}
      emptyIcon={<MessageSquare className="w-5 h-5 text-gray-400" />}
      emptyMessage="SMS 발송 내역이 없습니다"
      // 페이지네이션
      page={hook.page}
      totalPages={hook.totalPages}
      total={hook.total}
      pageSize={hook.pageSize}
      onPageChange={hook.setPage}
      // 추가 컨텐츠
      beforeTable={statsCards}
      afterPagination={
        <>
          {/* SMS 발송 시트 */}
          <SMSSendSheet
            open={hook.showSendSheet}
            onOpenChange={hook.setShowSendSheet}
            onComplete={hook.handleSendComplete}
            singleSelect={!enableManualSMS}
          />

          {/* 복수 발송 시트 */}
          {enableManualSMS && (
            <BulkSMSSheet
              open={hook.showBulkSMSSheet}
              onOpenChange={hook.setShowBulkSMSSheet}
              onComplete={hook.handleSendComplete}
            />
          )}

          {/* 메시지 상세 모달 */}
          {hook.selectedLog && (
            <MessageDetailModal
              log={hook.selectedLog}
              onClose={() => hook.setSelectedLog(null)}
              onImageClick={handleImageClick}
            />
          )}

          {/* 이미지 라이트박스 */}
          <Lightbox
            open={hook.lightboxOpen}
            close={() => hook.setLightboxOpen(false)}
            index={hook.lightboxIndex}
            slides={slides}
          />
        </>
      }
    />
  );
}
