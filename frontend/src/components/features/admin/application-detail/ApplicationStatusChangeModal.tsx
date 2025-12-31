"use client";

import { StatusChangeModal } from "@/components/admin/StatusChangeModal";
import { getStatusInfo, willSendSmsForStatusChange } from "@/lib/constants/application";

interface ApplicationStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sendSms: boolean) => void;
  currentStatus: string;
  newStatus: string;
  isLoading: boolean;
}

export function ApplicationStatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  isLoading,
}: ApplicationStatusChangeModalProps) {
  const currentStatusInfo = getStatusInfo(currentStatus);
  const newStatusInfo = getStatusInfo(newStatus);

  const showSmsOption = willSendSmsForStatusChange(currentStatus, newStatus);

  // SMS 설명 문구
  const getSmsDescription = () => {
    if (newStatus === "consulting" && currentStatus === "new") {
      return "고객에게 접수 확인 알림을 발송합니다";
    }
    if (newStatus === "scheduled") {
      return "고객에게 일정 확정 알림을 발송합니다";
    }
    if (newStatus === "completed") {
      return "고객에게 완료 알림을 발송합니다";
    }
    return "고객에게 상태 변경 알림을 발송합니다";
  };

  const handleConfirm = (sendSms: boolean) => {
    onConfirm(sendSms);
  };

  return (
    <StatusChangeModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      currentStatusLabel={currentStatusInfo.label}
      newStatusLabel={newStatusInfo.label}
      currentStatusColor={currentStatusInfo.color}
      newStatusColor={newStatusInfo.color}
      isLoading={isLoading}
      showSmsOption={showSmsOption}
      smsDescription={getSmsDescription()}
      defaultSmsChecked={true}
      showReasonInput={false}
      reasonRequired={false}
    />
  );
}
